using Microsoft.AspNetCore.Identity;

namespace Fiagmazation.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? JobTitle { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastSeenAt { get; set; }

    public ICollection<Room> OwnedRooms { get; set; } = new List<Room>();
    public ICollection<RoomMember> Memberships { get; set; } = new List<RoomMember>();

    public string FullName => $"{FirstName} {LastName}".Trim();
}
