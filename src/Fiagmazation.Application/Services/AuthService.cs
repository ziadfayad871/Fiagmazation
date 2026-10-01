using System.Security.Cryptography;
using System.Text;
using Fiagmazation.Application.Common;
using Fiagmazation.Application.Dtos.Auth;
using Fiagmazation.Application.Interfaces;
using Fiagmazation.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Fiagmazation.Application.Services;

public class AuthService : IAuthService
{
    private readonly IAppDbContext _db;
    private readonly UserManager<ApplicationUser> _users;
    private readonly ITokenService _tokens;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpFactory;
    private readonly IEmailSender _email;

    public AuthService(IAppDbContext db, UserManager<ApplicationUser> users, ITokenService tokens,
        IConfiguration config, IHttpClientFactory httpFactory, IEmailSender email)
    {
        _db = db;
        _users = users;
        _tokens = tokens;
        _config = config;
        _httpFactory = httpFactory;
        _email = email;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ip, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var userName = request.UserName.Trim();

        var errors = new Dictionary<string, string[]>();
        if (await _users.Users.AnyAsync(u => u.Email == email, ct))
            errors["email"] = ["An account with this email already exists."];
        if (await _users.Users.AnyAsync(u => u.UserName == userName, ct))
            errors["userName"] = ["This username is already taken."];
        if (errors.Count > 0)
            throw AppException.BadRequest("Please fix the highlighted fields.", errors);

        var user = new ApplicationUser
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            UserName = userName,
            EmailConfirmed = true,
            AvatarUrl = request.AvatarUrl,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _users.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw AppException.BadRequest("Could not create the account.",
                result.Errors.GroupBy(e => e.Code).ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray()));

        return await IssueTokensAsync(user, ip, ct);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ip, CancellationToken ct = default)
    {
        var identifier = request.EmailOrUsername.Trim();
        var user = await _users.Users.FirstOrDefaultAsync(
            u => u.Email == identifier || u.UserName == identifier, ct)
            ?? throw AppException.Unauthorized("Invalid email/username or password.");

        if (!await _users.CheckPasswordAsync(user, request.Password))
            throw AppException.Unauthorized("Invalid email/username or password.");

        return await IssueTokensAsync(user, ip, ct);
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken, string? ip, CancellationToken ct = default)
    {
        var stored = await FindRefreshTokenAsync(refreshToken, ct)
            ?? throw AppException.Unauthorized("Refresh token is invalid.");

        if (!stored.IsActive)
            throw AppException.Unauthorized("Refresh token has expired or was revoked.");

        _tokens.RevokeRefreshToken(stored, ip);
        var response = await IssueTokensAsync(stored.User, ip, ct, skipRevoke: stored);
        return response;
    }

    public async Task LogoutAsync(string? refreshToken, string? ip, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return;
        var stored = await FindRefreshTokenAsync(refreshToken, ct);
        if (stored is null || stored.RevokedAt is not null) return;
        _tokens.RevokeRefreshToken(stored, ip);
        await _db.SaveChangesAsync(ct);
    }

    private async Task<RefreshToken?> FindRefreshTokenAsync(string rawToken, CancellationToken ct)
    {
        var hash = HashRefreshToken(rawToken);
        var stored = await _db.RefreshTokens.Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == hash, ct);
        if (stored is not null) return stored;

        stored = await _db.RefreshTokens.Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == rawToken, ct);
        if (stored is null) return null;

        stored.Token = hash;
        await _db.SaveChangesAsync(ct);
        return stored;
    }

    private static string HashRefreshToken(string rawToken) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

    public async Task LogoutAllAsync(string userId, string? ip, CancellationToken ct = default)
    {
        var tokens = await _db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync(ct);
        foreach (var t in tokens) _tokens.RevokeRefreshToken(t, ip);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<UserDto> GetCurrentUserAsync(string userId, CancellationToken ct = default)
    {
        var user = await _users.FindByIdAsync(userId) ?? throw AppException.Unauthorized();
        return user.ToDto();
    }

    public async Task<UserDto> UpdateProfileAsync(string userId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        var user = await _users.FindByIdAsync(userId) ?? throw AppException.Unauthorized();
        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.JobTitle = request.JobTitle;
        user.AvatarUrl = request.AvatarUrl;
        var result = await _users.UpdateAsync(user);
        if (!result.Succeeded)
            throw AppException.BadRequest("Could not update the profile.",
                result.Errors.GroupBy(e => e.Code).ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray()));
        return user.ToDto();
    }

    public async Task ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        var user = await _users.FindByIdAsync(userId) ?? throw AppException.Unauthorized();
        var result = await _users.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            throw AppException.BadRequest("Could not change the password.",
                result.Errors.GroupBy(e => e.Code).ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray()));
    }

    public async Task<string?> ForgotPasswordAsync(string email, CancellationToken ct = default)
    {
        var identifier = email.Trim().ToLowerInvariant();
        var user = await _users.Users.FirstOrDefaultAsync(u => u.Email == identifier, ct);
        if (user is null) return null;

        var rawToken = await _users.GeneratePasswordResetTokenAsync(user);
        var token = EncodeUserScopedToken(user.Id, rawToken);
        var link = $"{FrontendUrl}/reset-password?token={Uri.EscapeDataString(token)}";

        await _email.SendAsync(
            user.Email ?? identifier,
            "Reset your Fiagmazation password",
            $"<p>Hi {user.FirstName},</p>" +
            "<p>We received a request to reset the password for your Fiagmazation account.</p>" +
            $"<p><a href=\"{link}\">Choose a new password</a></p>" +
            "<p>This link expires in 1 hour. If you did not ask for this, you can ignore this email.</p>",
            ct);
        return link;
    }

    public async Task ResetPasswordAsync(string token, string newPassword, CancellationToken ct = default)
    {
        const string invalid = "This reset link is invalid or has expired.";
        var decoded = DecodeUserScopedToken(token) ?? throw AppException.BadRequest(invalid);
        var user = await _users.Users.FirstOrDefaultAsync(u => u.Id == decoded.UserId, ct)
            ?? throw AppException.BadRequest(invalid);

        var result = await _users.ResetPasswordAsync(user, decoded.Token, newPassword);
        if (!result.Succeeded)
            throw AppException.BadRequest(invalid,
                result.Errors.GroupBy(e => e.Code).ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray()));

        await LogoutAllAsync(user.Id, null, ct);
    }

    private string FrontendUrl
    {
        get
        {
            var configured = _config["Frontend:Url"];
            if (!string.IsNullOrWhiteSpace(configured)) return configured.TrimEnd('/');
            var origins = _config["Cors:Origins"] ?? "http://localhost:3000";
            return origins.Split(',')[0].Trim().TrimEnd('/');
        }
    }

    private static string EncodeUserScopedToken(string userId, string token) =>
        Convert.ToBase64String(Encoding.UTF8.GetBytes(userId)) + "." + token;

    private static (string UserId, string Token)? DecodeUserScopedToken(string token)
    {
        var separator = token.IndexOf('.');
        if (separator <= 0 || separator == token.Length - 1) return null;

        string userId;
        try
        {
            userId = Encoding.UTF8.GetString(Convert.FromBase64String(token[..separator]));
        }
        catch (FormatException)
        {
            return null;
        }

        return string.IsNullOrWhiteSpace(userId) ? null : (userId, token[(separator + 1)..]);
    }

    public Task<IReadOnlyList<ExternalProviderDto>> GetExternalProvidersAsync()
    {
        IReadOnlyList<ExternalProviderDto> list =
        [
            BuildProvider("google", "Google"),
            BuildProvider("github", "GitHub"),
            BuildProvider("microsoft", "Microsoft")
        ];
        return Task.FromResult(list);
    }

    public async Task<AuthResponse> SignInExternalAsync(string provider, string email, string userName,
        string firstName, string lastName, string? avatarUrl, string? ip, CancellationToken ct = default)
    {
        email = email.Trim().ToLowerInvariant();
        var user = await _users.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null)
        {
            var raw = string.IsNullOrWhiteSpace(userName) ? email.Split('@')[0] : userName;
            var baseName = new string(raw.ToLowerInvariant()
                .Where(c => char.IsLetterOrDigit(c) || c is '-' or '.' or '_').ToArray());
            if (baseName.Length < 3) baseName = "user" + Guid.NewGuid().ToString("N")[..8];
            var candidate = baseName;
            var suffix = 1;
            while (await _users.Users.AnyAsync(u => u.UserName == candidate, ct))
                candidate = $"{baseName}{suffix++}";

            user = new ApplicationUser
            {
                Email = email,
                UserName = candidate,
                FirstName = string.IsNullOrWhiteSpace(firstName) ? "There" : firstName.Trim(),
                LastName = lastName?.Trim() ?? string.Empty,
                AvatarUrl = avatarUrl,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };
            var created = await _users.CreateAsync(user);
            if (!created.Succeeded)
                throw AppException.BadRequest($"Could not create an account for {email}.",
                    created.Errors.GroupBy(e => e.Code).ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray()));
        }

        return await IssueTokensAsync(user, ip, ct);
    }

    private ExternalProviderDto BuildProvider(string provider, string displayName)    {
        var clientId = _config[$"OAuth:{provider}:ClientId"];
        var configured = !string.IsNullOrWhiteSpace(clientId);
        return new ExternalProviderDto
        {
            Provider = provider,
            DisplayName = displayName,
            IsConfigured = configured,
            AuthorizeUrl = configured ? $"/api/auth/external/{provider}" : null
        };
    }

    private async Task<AuthResponse> IssueTokensAsync(ApplicationUser user, string? ip, CancellationToken ct,
        RefreshToken? skipRevoke = null)
    {
        var roles = await _users.GetRolesAsync(user);
        var (accessToken, expiresAt) = _tokens.GenerateAccessToken(user, roles);

        var refresh = _tokens.GenerateRefreshToken(user.Id, ip);
        var rawRefreshToken = refresh.Token;
        refresh.Token = HashRefreshToken(rawRefreshToken);
        _db.RefreshTokens.Add(refresh);
        if (skipRevoke is not null) skipRevoke.ReplacedByToken = refresh.Token;
        await _db.SaveChangesAsync(ct);

        user.LastSeenAt = DateTime.UtcNow;
        await _users.UpdateAsync(user);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = rawRefreshToken,
            ExpiresAt = expiresAt,
            User = user.ToDto()
        };
    }
}
