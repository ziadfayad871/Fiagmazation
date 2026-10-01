using Fiagmazation.Application.Common;
using Microsoft.AspNetCore.Mvc;

namespace Fiagmazation.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class ApiControllerBase : ControllerBase
{
    private ICurrentUserService? _current;

    protected ICurrentUserService Current =>
        _current ??= HttpContext.RequestServices.GetRequiredService<ICurrentUserService>();

    protected string UserId => Current.RequireUserId();

    protected string? ClientIp
    {
        get
        {
            var forwarded = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwarded))
            {
                var firstHop = forwarded.Split(',')[0].Trim();
                if (firstHop.Length > 0) return firstHop;
            }
            return HttpContext.Connection.RemoteIpAddress?.ToString();
        }
    }
}
