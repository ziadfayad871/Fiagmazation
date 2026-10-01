using Fiagmazation.Domain.Enums;

namespace Fiagmazation.Domain.Entities;

public class RoomMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public RoomRole Role { get; set; } = RoomRole.Viewer;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public Guid RoomId { get; set; }
    public Room Room { get; set; } = null!;

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
}
