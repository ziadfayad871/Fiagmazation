using Fiagmazation.Application.Dtos.Rooms;
using Fiagmazation.Application.Interfaces;
using Fiagmazation.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fiagmazation.Api.Controllers;

[Authorize]
public class RoomsController : ApiControllerBase
{
    private readonly IRoomService _rooms;

    public RoomsController(IRoomService rooms) => _rooms = rooms;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] RoomListQuery query, CancellationToken ct)
    {
        var result = await _rooms.ListAsync(query, UserId, ct);
        return Ok(new { items = result.Items, total = result.Total, page = result.Page, pageSize = result.PageSize });
    }

    [HttpGet("stats")]
    public async Task<ActionResult<RoomStatsDto>> Stats(CancellationToken ct) =>
        Ok(await _rooms.GetStatsAsync(UserId, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<RoomDetailDto>> Get(Guid id, CancellationToken ct) =>
        Ok(await _rooms.GetAsync(id, UserId, ct));

    [HttpPost]
    public async Task<ActionResult<RoomSummaryDto>> Create(CreateRoomRequest request, CancellationToken ct)
    {
        var room = await _rooms.CreateAsync(request, UserId, ct);
        return CreatedAtAction(nameof(Get), new { id = room.Id }, room);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<RoomSummaryDto>> Update(Guid id, UpdateRoomRequest request, CancellationToken ct) =>
        Ok(await _rooms.UpdateAsync(id, request, UserId, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _rooms.DeleteAsync(id, UserId, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/duplicate")]
    public async Task<ActionResult<RoomSummaryDto>> Duplicate(Guid id, CancellationToken ct) =>
        Ok(await _rooms.DuplicateAsync(id, UserId, ct));

    [HttpGet("{id:guid}/members")]
    public async Task<ActionResult<IReadOnlyList<RoomMemberDto>>> Members(Guid id, CancellationToken ct) =>
        Ok(await _rooms.GetMembersAsync(id, UserId, ct));

    [HttpPost("{id:guid}/members")]
    public async Task<ActionResult<RoomMemberDto>> AddMember(Guid id, ShareRoomRequest request, CancellationToken ct) =>
        Ok(await _rooms.AddMemberAsync(id, request, UserId, ct));

    [HttpPut("{id:guid}/members/{targetUserId}")]
    public async Task<ActionResult<RoomMemberDto>> UpdateMemberRole(Guid id, string targetUserId,
        [FromBody] UpdateRoleRequest request, CancellationToken ct) =>
        Ok(await _rooms.UpdateMemberRoleAsync(id, targetUserId, request.Role, UserId, ct));

    [HttpDelete("{id:guid}/members/{targetUserId}")]
    public async Task<IActionResult> RemoveMember(Guid id, string targetUserId, CancellationToken ct)
    {
        await _rooms.RemoveMemberAsync(id, targetUserId, UserId, ct);
        return NoContent();
    }

    public class UpdateRoleRequest
    {
        public RoomRole Role { get; set; } = RoomRole.Viewer;
    }
}
