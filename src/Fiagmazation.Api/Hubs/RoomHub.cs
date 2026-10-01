using Fiagmazation.Application.Common;
using Fiagmazation.Application.Dtos.Designs;
using Fiagmazation.Application.Interfaces;
using Fiagmazation.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Fiagmazation.Api.Hubs;

public interface IRoomClient
{
    Task PresenceJoined(object member);
    Task PresenceLeft(object payload);
    Task CursorMoved(object payload);
    Task SelectionChanged(object payload);
    Task ElementCreated(object payload);
    Task ElementUpdated(object payload);
    Task ElementsDeleted(object payload);
    Task ElementsReordered(object payload);
    Task DesignSaved(object payload);
    Task CommentsChanged(object payload);
    Task RoomError(object payload);
}

[Authorize]
public class RoomHub : Hub<IRoomClient>
{
    private readonly IPresenceTracker _presence;
    private readonly IRoomService _rooms;
    private readonly ILogger<RoomHub> _logger;

    private const string Prefix = "room:";

    public RoomHub(IPresenceTracker presence, IRoomService rooms, ILogger<RoomHub> logger)
    {
        _presence = presence;
        _rooms = rooms;
        _logger = logger;
    }

    private string UserId => Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? Context.User?.FindFirst("sub")?.Value
        ?? string.Empty;

    private string DisplayName => Context.User?.FindFirst("first_name")?.Value is { } first
        ? $"{first} {Context.User?.FindFirst("last_name")?.Value ?? string.Empty}".Trim()
        : Context.User?.Identity?.Name ?? "Guest";

    private static string Group(Guid roomId) => Prefix + roomId;

    private void EnsureInRoom(Guid roomId)
    {
        if (!Context.Items.ContainsKey($"{Prefix}{roomId}"))
            throw new HubException("You have not joined this room.");
    }

    public async Task<object> JoinRoom(Guid roomId)
    {
        if (!await _rooms.HasAccessAsync(roomId, UserId))
            throw new HubException("You do not have access to this room.");

        var userId = UserId;
        var member = _presence.Join(roomId, Context.ConnectionId, userId, DisplayName,
            Mappers.ColorFor(userId), null);

        await Groups.AddToGroupAsync(Context.ConnectionId, Group(roomId));
        Context.Items[$"{Prefix}{roomId}"] = roomId;

        var payload = new
        {
            roomId,
            userId,
            displayName = DisplayName,
            color = Mappers.ColorFor(userId),
            connectionId = Context.ConnectionId
        };

        if (member is not null)
            await Clients.OthersInGroup(Group(roomId)).PresenceJoined(new
            {
                roomId,
                userId,
                displayName = DisplayName,
                color = Mappers.ColorFor(userId),
                selection = Array.Empty<Guid>()
            });

        return new
        {
            roomId,
            you = payload,
            members = _presence.GetRoom(roomId).Select(m => new
            {
                userId = m.UserId,
                displayName = m.DisplayName,
                color = m.Color,
                cursorX = m.CursorX,
                cursorY = m.CursorY,
                selection = m.Selection
            })
        };
    }

    public async Task LeaveRoom(Guid roomId)
    {
        EnsureInRoom(roomId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, Group(roomId));
        Context.Items.Remove($"{Prefix}{roomId}");
        var left = _presence.Leave(roomId, Context.ConnectionId);
        if (left is not null)
            await Clients.Group(Group(roomId)).PresenceLeft(new { roomId, userId = left.UserId, displayName = left.DisplayName });
    }

    public Task CursorMoved(Guid roomId, double x, double y)
    {
        EnsureInRoom(roomId);
        _presence.UpdateCursor(roomId, UserId, x, y);
        return Clients.OthersInGroup(Group(roomId)).CursorMoved(new { roomId, userId = UserId, x, y });
    }

    public Task SelectionChanged(Guid roomId, Guid[] elementIds)
    {
        EnsureInRoom(roomId);
        _presence.UpdateSelection(roomId, UserId, elementIds);
        return Clients.OthersInGroup(Group(roomId)).SelectionChanged(new { roomId, userId = UserId, elementIds });
    }

    public Task ElementCreated(Guid roomId, Guid designId, ElementDto element)
    {
        EnsureInRoom(roomId);
        return Clients.OthersInGroup(Group(roomId)).ElementCreated(new { roomId, designId, element, by = UserId });
    }

    public Task ElementUpdated(Guid roomId, Guid designId, Guid elementId, UpdateElementRequest patch)
    {
        EnsureInRoom(roomId);
        return Clients.OthersInGroup(Group(roomId)).ElementUpdated(new { roomId, designId, elementId, patch, by = UserId });
    }

    public Task ElementsDeleted(Guid roomId, Guid designId, Guid[] elementIds)
    {
        EnsureInRoom(roomId);
        return Clients.OthersInGroup(Group(roomId)).ElementsDeleted(new { roomId, designId, elementIds, by = UserId });
    }

    public Task ElementsReordered(Guid roomId, Guid designId, Guid[] elementIds)
    {
        EnsureInRoom(roomId);
        return Clients.OthersInGroup(Group(roomId)).ElementsReordered(new { roomId, designId, elementIds, by = UserId });
    }

    public Task DesignSaved(Guid roomId, Guid designId)
    {
        EnsureInRoom(roomId);
        return Clients.OthersInGroup(Group(roomId)).DesignSaved(new { roomId, designId, by = UserId, savedAt = DateTime.UtcNow });
    }

    public Task CommentsChanged(Guid roomId, Guid designId)
    {
        EnsureInRoom(roomId);
        return Clients.Group(Group(roomId)).CommentsChanged(new { roomId, designId, by = UserId });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        foreach (var key in Context.Items.Keys.OfType<string>().Where(k => k.StartsWith(Prefix)).ToList())
        {
            if (Guid.TryParse(key[Prefix.Length..], out var roomId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, Group(roomId));
                var left = _presence.Leave(roomId, Context.ConnectionId);
                if (left is not null)
                    await Clients.Group(Group(roomId)).PresenceLeft(new { roomId, userId = left.UserId, displayName = left.DisplayName });
            }
        }
        await base.OnDisconnectedAsync(exception);
    }
}
