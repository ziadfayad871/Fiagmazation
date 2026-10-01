using Fiagmazation.Application.Common;
using Fiagmazation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fiagmazation.Api.Controllers;

[Authorize]
public class PresenceController : ApiControllerBase
{
    private readonly IPresenceTracker _presence;
    private readonly IRoomService _rooms;

    public PresenceController(IPresenceTracker presence, IRoomService rooms)
    {
        _presence = presence;
        _rooms = rooms;
    }

    [HttpGet("/api/rooms/{roomId:guid}/presence")]
    public async Task<IActionResult> Get(Guid roomId, CancellationToken ct)
    {
        if (!await _rooms.HasAccessAsync(roomId, UserId, ct))
            return Forbid();

        var members = _presence.GetRoom(roomId);
        return Ok(members.Select(m => new
        {
            userId = m.UserId,
            displayName = m.DisplayName,
            color = m.Color,
            avatarUrl = m.AvatarUrl,
            cursorX = m.CursorX,
            cursorY = m.CursorY,
            selection = m.Selection
        }));
    }
}
