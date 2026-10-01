using System.Text.RegularExpressions;
using Fiagmazation.Application.Common;
using Fiagmazation.Application.Dtos.Comments;
using Fiagmazation.Application.Interfaces;
using Fiagmazation.Domain.Entities;
using Fiagmazation.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Fiagmazation.Application.Services;

public class CommentService : ICommentService
{
    private readonly IAppDbContext _db;
    private readonly IRoomService _rooms;
    private readonly INotificationService _notifications;

    public CommentService(IAppDbContext db, IRoomService rooms, INotificationService notifications)
    {
        _db = db;
        _rooms = rooms;
        _notifications = notifications;
    }

    public async Task<IReadOnlyList<CommentDto>> ListAsync(Guid designId, string userId, bool includeResolved = true, CancellationToken ct = default)
    {
        var design = await _db.Designs.AsNoTracking().FirstOrDefaultAsync(d => d.Id == designId, ct)
            ?? throw AppException.NotFound("Design not found.");
        if (!await _rooms.HasAccessAsync(design.RoomId, userId, ct))
            throw AppException.Forbidden("You do not have access to this design.");

        var query = _db.Comments.AsNoTracking().Include(c => c.Author)
            .Where(c => c.DesignId == designId && c.ParentId == null);
        if (!includeResolved) query = query.Where(c => !c.Resolved);

        var comments = await query.OrderByDescending(c => c.CreatedAt).ToListAsync(ct);
        var replies = await _db.Comments.AsNoTracking().Include(c => c.Author)
            .Where(c => c.DesignId == designId && c.ParentId != null)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(ct);

        var lookup = comments.ToDictionary(c => c.Id);
        foreach (var reply in replies)
        {
            if (reply.ParentId is Guid parentId && lookup.TryGetValue(parentId, out var parent))
                parent.Replies.Add(reply);
        }

        return comments.Select(c => ToDto(c)).ToList();
    }

    public async Task<CommentDto> CreateAsync(Guid designId, CreateCommentRequest request, string userId, CancellationToken ct = default)
    {
        var design = await _db.Designs.FirstOrDefaultAsync(d => d.Id == designId, ct)
            ?? throw AppException.NotFound("Design not found.");
        if (!await _rooms.HasAccessAsync(design.RoomId, userId, ct))
            throw AppException.Forbidden("You do not have access to this design.");

        Comment? parent = null;
        if (request.ParentId.HasValue)
        {
            parent = await _db.Comments.FirstOrDefaultAsync(c => c.Id == request.ParentId && c.DesignId == designId, ct)
                ?? throw AppException.NotFound("Parent comment not found.");
        }

        var comment = new Comment
        {
            Body = request.Body.Trim(),
            X = request.X,
            Y = request.Y,
            DesignId = designId,
            RoomId = design.RoomId,
            AuthorId = userId,
            ParentId = parent?.Id,
            CreatedAt = DateTime.UtcNow
        };
        _db.Comments.Add(comment);
        await _db.SaveChangesAsync(ct);

        if (parent is not null && parent.AuthorId != userId)
        {
            await _notifications.CreateAsync(parent.AuthorId, NotificationType.CommentReply,
                "New reply to your comment", Truncate(comment.Body), null, userId, ct);
        }

        await NotifyMentionsAsync(design.RoomId, designId, comment, userId, ct);

        var author = await _db.Users.AsNoTracking().FirstAsync(u => u.Id == userId, ct);
        comment.Author = author;
        return ToDto(comment);
    }

    public async Task<CommentDto> UpdateAsync(Guid commentId, UpdateCommentRequest request, string userId, CancellationToken ct = default)
    {
        var comment = await _db.Comments.Include(c => c.Author)
            .FirstOrDefaultAsync(c => c.Id == commentId, ct)
            ?? throw AppException.NotFound("Comment not found.");
        if (comment.AuthorId != userId) throw AppException.Forbidden("You can only edit your own comments.");
        if (!await _rooms.HasAccessAsync(comment.RoomId, userId, ct))
            throw AppException.Forbidden();

        comment.Body = request.Body.Trim();
        comment.EditedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ToDto(comment);
    }

    public async Task<CommentDto> ResolveAsync(Guid commentId, bool resolved, string userId, CancellationToken ct = default)
    {
        var comment = await _db.Comments.Include(c => c.Author)
            .FirstOrDefaultAsync(c => c.Id == commentId, ct)
            ?? throw AppException.NotFound("Comment not found.");
        if (!await _rooms.HasAccessAsync(comment.RoomId, userId, ct))
            throw AppException.Forbidden();

        comment.Resolved = resolved;
        await _db.SaveChangesAsync(ct);
        return ToDto(comment);
    }

    public async Task DeleteAsync(Guid commentId, string userId, CancellationToken ct = default)
    {
        var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == commentId, ct)
            ?? throw AppException.NotFound("Comment not found.");
        if (comment.AuthorId != userId) throw AppException.Forbidden("You can only delete your own comments.");
        if (!await _rooms.HasAccessAsync(comment.RoomId, userId, ct))
            throw AppException.Forbidden();

        var replies = await _db.Comments.Where(c => c.ParentId == commentId).ToListAsync(ct);
        _db.Comments.RemoveRange(replies);
        _db.Comments.Remove(comment);
        await _db.SaveChangesAsync(ct);
    }

    private async Task NotifyMentionsAsync(Guid roomId, Guid designId, Comment comment, string userId, CancellationToken ct)
    {
        var handles = Regex.Matches(comment.Body, @"@([A-Za-z0-9_.-]{2,30})")
            .Select(m => m.Groups[1].Value.ToLowerInvariant())
            .Distinct()
            .ToList();
        if (handles.Count == 0) return;

        var room = await _db.Rooms.AsNoTracking()
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r => r.Id == roomId, ct);
        if (room is null) return;

        var memberIds = room.Members.Select(m => m.UserId).Append(room.OwnerId).Distinct().ToList();
        var mentioned = await _db.Users.AsNoTracking()
            .Where(u => memberIds.Contains(u.Id) && u.Id != userId && u.UserName != null
                && handles.Contains(u.UserName.ToLower()))
            .ToListAsync(ct);

        foreach (var user in mentioned.DistinctBy(u => u.Id))
        {
            await _notifications.CreateAsync(user.Id, NotificationType.Mention,
                "You were mentioned in a comment", Truncate(comment.Body),
                $"/editor?room={roomId}&design={designId}&comment={comment.Id}", userId, ct);
        }
    }

    private static string Truncate(string value) =>
        value.Length <= 120 ? value : value[..117] + "...";

    private static CommentDto ToDto(Comment c) => new()
    {
        Id = c.Id,
        DesignId = c.DesignId,
        RoomId = c.RoomId,
        ParentId = c.ParentId,
        Body = c.Body,
        X = c.X,
        Y = c.Y,
        Resolved = c.Resolved,
        CreatedAt = c.CreatedAt,
        EditedAt = c.EditedAt,
        Author = c.Author?.ToAuthor() ?? new UserBriefAuthorDto(),
        Replies = c.Replies.Select(ToDto).ToList()
    };
}
