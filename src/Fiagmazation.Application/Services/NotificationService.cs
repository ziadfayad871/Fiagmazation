using Fiagmazation.Application.Common;
using Fiagmazation.Application.Dtos.Comments;
using Fiagmazation.Application.Interfaces;
using Fiagmazation.Domain.Entities;
using Fiagmazation.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Fiagmazation.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IAppDbContext _db;

    public NotificationService(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<NotificationDto>> ListAsync(string userId, int limit = 30, CancellationToken ct = default)
    {
        var items = await _db.Notifications
            .Include(n => n.Actor)
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync(ct);
        return items.Select(ToDto).ToList();
    }

    public Task<int> GetUnreadCountAsync(string userId, CancellationToken ct = default) =>
        _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead, ct);

    public async Task MarkReadAsync(Guid id, string userId, CancellationToken ct = default)
    {
        var item = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId, ct);
        if (item is null) return;
        item.IsRead = true;
        await _db.SaveChangesAsync(ct);
    }

    public async Task MarkAllReadAsync(string userId, CancellationToken ct = default)
    {
        var items = await _db.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync(ct);
        foreach (var item in items) item.IsRead = true;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<NotificationDto> CreateAsync(string userId, NotificationType type, string title, string body,
        string? linkUrl, string? actorId, CancellationToken ct = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Body = body,
            LinkUrl = linkUrl,
            ActorId = actorId,
            CreatedAt = DateTime.UtcNow
        };
        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync(ct);

        if (actorId is not null)
            notification.Actor = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == actorId, ct);

        return ToDto(notification);
    }

    private static NotificationDto ToDto(Notification n) => new()
    {
        Id = n.Id,
        Type = (NotificationTypeDto)(int)n.Type,
        Title = n.Title,
        Body = n.Body,
        LinkUrl = n.LinkUrl,
        IsRead = n.IsRead,
        CreatedAt = n.CreatedAt,
        Actor = n.Actor?.ToAuthor()
    };
}
