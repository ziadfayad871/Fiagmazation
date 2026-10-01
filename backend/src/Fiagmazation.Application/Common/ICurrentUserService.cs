using System.Security.Claims;

namespace Fiagmazation.Application.Common;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? UserName { get; }
    ClaimsPrincipal? Principal { get; }
    string RequireUserId();
}
