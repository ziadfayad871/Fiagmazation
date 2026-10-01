using System.ComponentModel.DataAnnotations;

namespace Fiagmazation.Application.Dtos.Auth;

public class RegisterRequest
{
    [Required, MaxLength(60)] public string FirstName { get; set; } = string.Empty;
    [Required, MaxLength(60)] public string LastName { get; set; } = string.Empty;
    [Required, EmailAddress, MaxLength(256)] public string Email { get; set; } = string.Empty;
    [Required, MinLength(3), MaxLength(40)] public string UserName { get; set; } = string.Empty;
    [Required, MinLength(8), MaxLength(128)] public string Password { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
}

public class LoginRequest
{
    [Required, MaxLength(256)] public string EmailOrUsername { get; set; } = string.Empty;
    [Required, MaxLength(128)] public string Password { get; set; } = string.Empty;
}

public class RefreshRequest
{
    [Required] public string RefreshToken { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserDto User { get; set; } = new();
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? JobTitle { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class UpdateProfileRequest
{
    [Required, MaxLength(60)] public string FirstName { get; set; } = string.Empty;
    [Required, MaxLength(60)] public string LastName { get; set; } = string.Empty;
    [MaxLength(120)] public string? JobTitle { get; set; }
    [MaxLength(500)] public string? AvatarUrl { get; set; }
}

public class ChangePasswordRequest
{
    [Required] public string CurrentPassword { get; set; } = string.Empty;
    [Required, MinLength(8), MaxLength(128)] public string NewPassword { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    [Required, EmailAddress, MaxLength(256)] public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    [Required, MaxLength(4000)] public string Token { get; set; } = string.Empty;
    [Required, MinLength(8), MaxLength(128)] public string NewPassword { get; set; } = string.Empty;
}

public class MessageDto
{
    public string Message { get; set; } = string.Empty;
    public string? DevResetUrl { get; set; }
}

public class ExternalProviderDto
{
    public string Provider { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool IsConfigured { get; set; }
    public string? AuthorizeUrl { get; set; }
}
