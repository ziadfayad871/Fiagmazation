using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Fiagmazation.Application.Interfaces;
using Fiagmazation.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Fiagmazation.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config) => _config = config;

    public (string AccessToken, DateTime ExpiresAt) GenerateAccessToken(ApplicationUser user, IList<string> roles)
    {
        var key = _config["Jwt:Secret"] ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
        var issuer = _config["Jwt:Issuer"] ?? "Fiagmazation";
        var audience = _config["Jwt:Audience"] ?? "Fiagmazation";
        var minutes = int.TryParse(_config["Jwt:AccessTokenMinutes"], out var m) ? m : 30;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("first_name", user.FirstName),
            new("last_name", user.LastName),
            new("avatar_url", user.AvatarUrl ?? string.Empty)
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var expires = DateTime.UtcNow.AddMinutes(minutes);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expires,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    public RefreshToken GenerateRefreshToken(string userId, string? ip)
    {
        var days = int.TryParse(_config["Jwt:RefreshTokenDays"], out var d) ? d : 7;
        var random = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(random);

        return new RefreshToken
        {
            UserId = userId,
            Token = Convert.ToBase64String(random).Replace("+", "-").Replace("/", "_").Replace("=", string.Empty),
            ExpiresAt = DateTime.UtcNow.AddDays(days),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = ip
        };
    }

    public void RevokeRefreshToken(RefreshToken token, string? ip, string? replacedBy = null)
    {
        token.RevokedAt = DateTime.UtcNow;
        token.ReplacedByToken = replacedBy;
        if (ip is not null) token.CreatedByIp = ip;
    }
}
