using Fiagmazation.Application.Dtos.Comments;
using Fiagmazation.Domain.Enums;

namespace Fiagmazation.Application.Interfaces;

public interface INotificationService
{
    Task<IReadOnlyList<NotificationDto>> ListAsync(string userId, int limit = 30, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(string userId, CancellationToken ct = default);
    Task MarkReadAsync(Guid id, string userId, CancellationToken ct = default);
    Task MarkAllReadAsync(string userId, CancellationToken ct = default);
    Task<NotificationDto> CreateAsync(string userId, NotificationType type, string title, string body,
        string? linkUrl, string? actorId, CancellationToken ct = default);
}
