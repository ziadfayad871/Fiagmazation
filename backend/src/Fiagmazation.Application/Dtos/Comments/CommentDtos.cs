using System.ComponentModel.DataAnnotations;
using Fiagmazation.Application.Dtos.Auth;

namespace Fiagmazation.Application.Dtos.Comments;

public class CommentDto
{
    public Guid Id { get; set; }
    public Guid DesignId { get; set; }
    public Guid RoomId { get; set; }
    public Guid? ParentId { get; set; }
    public string Body { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public bool Resolved { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? EditedAt { get; set; }
    public UserBriefAuthorDto Author { get; set; } = new();
    public List<CommentDto> Replies { get; set; } = [];
}

public class UserBriefAuthorDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Color { get; set; } = "#F97316";
}

public class CreateCommentRequest
{
    [Required, MaxLength(4000)] public string Body { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public Guid? ParentId { get; set; }
}

public class UpdateCommentRequest
{
    [Required, MaxLength(4000)] public string Body { get; set; } = string.Empty;
}

public class ResolveCommentRequest
{
    public bool Resolved { get; set; } = true;
}

public class NotificationDto
{
    public Guid Id { get; set; }
    public NotificationTypeDto Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public UserBriefAuthorDto? Actor { get; set; }
}

public enum NotificationTypeDto
{
    System = 0,
    RoomShared = 1,
    MemberJoined = 2,
    CommentAdded = 3,
    CommentReply = 4,
    Mention = 5
}
