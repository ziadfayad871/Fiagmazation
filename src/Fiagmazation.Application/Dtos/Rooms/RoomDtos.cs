using System.ComponentModel.DataAnnotations;
using Fiagmazation.Application.Dtos.Designs;
using Fiagmazation.Domain.Enums;

namespace Fiagmazation.Application.Dtos.Rooms;

public class RoomSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? AccentColor { get; set; }
    public UserBriefDto Owner { get; set; } = new();
    public RoomRole Role { get; set; }
    public bool IsOwner { get; set; }
    public int MemberCount { get; set; }
    public int OnlineCount { get; set; }
    public int DesignCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string RelativeUpdatedAt { get; set; } = string.Empty;
    public Guid? PrimaryDesignId { get; set; }
}

public class RoomDetailDto : RoomSummaryDto
{
    public List<RoomMemberDto> Members { get; set; } = [];
    public List<DesignSummaryDto> Designs { get; set; } = [];
}

public class RoomMemberDto
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public RoomRole Role { get; set; }
    public DateTime JoinedAt { get; set; }
    public UserBriefDto User { get; set; } = new();
    public bool IsOnline { get; set; }
}

public class UserBriefDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Color { get; set; } = "#2563EB";
    public string Email { get; set; } = string.Empty;
}

public class CreateRoomRequest
{
    [Required, MinLength(1), MaxLength(120)] public string Name { get; set; } = string.Empty;
    [MaxLength(500)] public string? Description { get; set; }
    [MaxLength(24)] public string? AccentColor { get; set; }
}

public class UpdateRoomRequest
{
    [Required, MinLength(1), MaxLength(120)] public string? Name { get; set; }
    [MaxLength(500)] public string? Description { get; set; }
    [MaxLength(24)] public string? AccentColor { get; set; }
}

public class ShareRoomRequest
{
    [Required] public string Email { get; set; } = string.Empty;
    [Required] public RoomRole Role { get; set; } = RoomRole.Editor;
}

public class RoomStatsDto
{
    public int MyRooms { get; set; }
    public int SharedRooms { get; set; }
    public int TotalCollaborators { get; set; }
    public int OnlineNow { get; set; }
}

public class RoomListQuery
{
    public string? Search { get; set; }
    public string Scope { get; set; } = "all"; // all | mine | shared | recent
    [Range(1, 500)] public int Page { get; set; } = 1;
    [Range(1, 100)] public int PageSize { get; set; } = 50;
}
