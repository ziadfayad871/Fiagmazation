namespace Fiagmazation.Application.Common;

/// <summary>Tracks which users are currently connected to a room hub.</summary>
public interface IPresenceTracker
{
    IReadOnlyCollection<PresenceMember> GetRoom(Guid roomId);
    bool IsOnline(Guid roomId, string userId);
    int OnlineCount(Guid roomId);
    PresenceMember? Join(Guid roomId, string connectionId, string userId, string displayName, string color, string? avatarUrl);
    PresenceMember? Leave(Guid roomId, string connectionId);
    void UpdateCursor(Guid roomId, string userId, double x, double y);
    void UpdateSelection(Guid roomId, string userId, IReadOnlyList<Guid> elementIds);
}

public record PresenceMember(
    Guid RoomId,
    string ConnectionId,
    string UserId,
    string DisplayName,
    string Color,
    string? AvatarUrl,
    double CursorX,
    double CursorY,
    IReadOnlyList<Guid> Selection);
