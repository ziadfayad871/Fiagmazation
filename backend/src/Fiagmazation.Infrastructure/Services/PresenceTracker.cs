using System.Collections.Concurrent;
using Fiagmazation.Application.Common;

namespace Fiagmazation.Infrastructure.Services;

public class PresenceTracker : IPresenceTracker
{
    private readonly ConcurrentDictionary<Guid, ConcurrentDictionary<string, PresenceMember>> _rooms = new();

    public IReadOnlyCollection<PresenceMember> GetRoom(Guid roomId) =>
        _rooms.TryGetValue(roomId, out var members)
            ? members.Values.ToList()
            : Array.Empty<PresenceMember>();

    public bool IsOnline(Guid roomId, string userId) =>
        _rooms.TryGetValue(roomId, out var members) &&
        members.Values.Any(m => m.UserId == userId);

    public int OnlineCount(Guid roomId) =>
        _rooms.TryGetValue(roomId, out var members)
            ? members.Values.Select(m => m.UserId).Distinct().Count()
            : 0;

    public PresenceMember? Join(Guid roomId, string connectionId, string userId, string displayName, string color, string? avatarUrl)
    {
        var members = _rooms.GetOrAdd(roomId, _ => new ConcurrentDictionary<string, PresenceMember>());
        var member = new PresenceMember(roomId, connectionId, userId, displayName, color, avatarUrl, 0, 0, Array.Empty<Guid>());
        members[connectionId] = member;

        var distinct = members.Values.Count(m => m.UserId == userId);
        return distinct == 1 ? member : null;
    }

    public PresenceMember? Leave(Guid roomId, string connectionId)
    {
        if (!_rooms.TryGetValue(roomId, out var members)) return null;
        if (!members.TryRemove(connectionId, out var removed)) return null;

        var stillThere = members.Values.Any(m => m.UserId == removed.UserId);
        if (members.IsEmpty) _rooms.TryRemove(roomId, out _);
        return stillThere ? null : removed;
    }

    public void UpdateCursor(Guid roomId, string userId, double x, double y)
    {
        if (!_rooms.TryGetValue(roomId, out var members)) return;
        foreach (var key in members.Keys.ToList())
        {
            if (members.TryGetValue(key, out var m) && m.UserId == userId)
                members[key] = m with { CursorX = x, CursorY = y };
        }
    }

    public void UpdateSelection(Guid roomId, string userId, IReadOnlyList<Guid> elementIds)
    {
        if (!_rooms.TryGetValue(roomId, out var members)) return;
        foreach (var key in members.Keys.ToList())
        {
            if (members.TryGetValue(key, out var m) && m.UserId == userId)
                members[key] = m with { Selection = elementIds };
        }
    }
}
