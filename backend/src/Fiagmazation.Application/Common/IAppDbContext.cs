using Microsoft.EntityFrameworkCore;

namespace Fiagmazation.Application.Common;

public interface IAppDbContext
{
    DbSet<Domain.Entities.ApplicationUser> Users { get; }
    DbSet<Domain.Entities.Room> Rooms { get; }
    DbSet<Domain.Entities.RoomMember> RoomMembers { get; }
    DbSet<Domain.Entities.Design> Designs { get; }
    DbSet<Domain.Entities.DesignElement> DesignElements { get; }
    DbSet<Domain.Entities.DesignRevision> DesignRevisions { get; }
    DbSet<Domain.Entities.Comment> Comments { get; }
    DbSet<Domain.Entities.Notification> Notifications { get; }
    DbSet<Domain.Entities.RefreshToken> RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
