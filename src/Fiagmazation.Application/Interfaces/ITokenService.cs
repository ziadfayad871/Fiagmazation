using System.Security.Claims;
using Fiagmazation.Domain.Entities;

namespace Fiagmazation.Application.Interfaces;

public interface ITokenService
{
    (string AccessToken, DateTime ExpiresAt) GenerateAccessToken(ApplicationUser user, IList<string> roles);
    RefreshToken GenerateRefreshToken(string userId, string? ip);
    void RevokeRefreshToken(RefreshToken token, string? ip, string? replacedBy = null);
}
