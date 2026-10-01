using Fiagmazation.Application.Dtos.Auth;

namespace Fiagmazation.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ip, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ip, CancellationToken ct = default);
    Task<AuthResponse> RefreshAsync(string refreshToken, string? ip, CancellationToken ct = default);
    Task LogoutAsync(string? refreshToken, string? ip, CancellationToken ct = default);
    Task LogoutAllAsync(string userId, string? ip, CancellationToken ct = default);
    Task<UserDto> GetCurrentUserAsync(string userId, CancellationToken ct = default);
    Task<UserDto> UpdateProfileAsync(string userId, UpdateProfileRequest request, CancellationToken ct = default);
    Task ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken ct = default);
    Task<string?> ForgotPasswordAsync(string email, CancellationToken ct = default);
    Task ResetPasswordAsync(string token, string newPassword, CancellationToken ct = default);
    Task<IReadOnlyList<ExternalProviderDto>> GetExternalProvidersAsync();
    Task<AuthResponse> SignInExternalAsync(string provider, string email, string userName,
        string firstName, string lastName, string? avatarUrl, string? ip, CancellationToken ct = default);
}
