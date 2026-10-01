using System.Security.Claims;
using Fiagmazation.Application.Common;
using Microsoft.AspNetCore.Http;

namespace Fiagmazation.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _http;

    public CurrentUserService(IHttpContextAccessor http) => _http = http;

    public ClaimsPrincipal? Principal => _http.HttpContext?.User;

    public string? UserId =>
        Principal?.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? Principal?.FindFirstValue("sub");

    public string? UserName => Principal?.Identity?.Name;

    public string RequireUserId() =>
        !string.IsNullOrEmpty(UserId) ? UserId : throw AppException.Unauthorized();
}
