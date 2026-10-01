using Fiagmazation.Application.Common;
using Fiagmazation.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Fiagmazation.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<RoomMember> RoomMembers => Set<RoomMember>();
    public DbSet<Design> Designs => Set<Design>();
    public DbSet<DesignElement> DesignElements => Set<DesignElement>();
    public DbSet<DesignRevision> DesignRevisions => Set<DesignRevision>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(e =>
        {
            e.Property(u => u.FirstName).HasMaxLength(60);
            e.Property(u => u.LastName).HasMaxLength(60);
            e.Property(u => u.JobTitle).HasMaxLength(120);
            e.Property(u => u.AvatarUrl).HasMaxLength(500);
            e.HasIndex(u => u.Email).IsUnique();
        });

        builder.Entity<RefreshToken>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Token).HasMaxLength(128);
            e.HasIndex(t => t.Token).IsUnique();
            e.HasIndex(t => new { t.UserId, t.RevokedAt });
            e.HasOne(t => t.User).WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Room>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Name).HasMaxLength(120).IsRequired();
            e.Property(r => r.Description).HasMaxLength(500);
            e.Property(r => r.AccentColor).HasMaxLength(24);
            e.Property(r => r.ThumbnailUrl).HasMaxLength(500);
            e.HasIndex(r => r.UpdatedAt);
            e.HasIndex(r => new { r.OwnerId, r.IsDeleted, r.UpdatedAt });
            e.HasOne(r => r.Owner).WithMany(u => u.OwnedRooms)
                .HasForeignKey(r => r.OwnerId).OnDelete(DeleteBehavior.NoAction);
            e.HasQueryFilter(r => !r.IsDeleted);
        });

        builder.Entity<RoomMember>(e =>
        {
            e.HasKey(m => m.Id);
            e.HasIndex(m => new { m.RoomId, m.UserId }).IsUnique();
            e.HasQueryFilter(m => !m.Room.IsDeleted);
            e.HasOne(m => m.Room).WithMany(r => r.Members)
                .HasForeignKey(m => m.RoomId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(m => m.User).WithMany(u => u.Memberships)
                .HasForeignKey(m => m.UserId).OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<Design>(e =>
        {
            e.HasKey(d => d.Id);
            e.Property(d => d.Name).HasMaxLength(120);
            e.Property(d => d.BackgroundColor).HasMaxLength(24);
            e.HasIndex(d => d.RoomId);
            e.HasQueryFilter(d => !d.Room.IsDeleted);
            e.HasOne(d => d.Room).WithMany(r => r.Designs)
                .HasForeignKey(d => d.RoomId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<DesignElement>(e =>
        {
            e.HasKey(el => el.Id);
            e.Property(el => el.Name).HasMaxLength(160);
            e.Property(el => el.Fill).HasMaxLength(64);
            e.Property(el => el.Stroke).HasMaxLength(64);
            e.Property(el => el.FontFamily).HasMaxLength(80);
            e.Property(el => el.Src);
            e.Property(el => el.Points);
            e.Property(el => el.Text).HasMaxLength(4000);
            e.HasIndex(el => new { el.DesignId, el.ZIndex });
            e.HasOne(el => el.Design).WithMany(d => d.Elements)
                .HasForeignKey(el => el.DesignId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<DesignRevision>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.SnapshotJson).IsRequired();
            e.Property(r => r.Label).HasMaxLength(100);
            e.HasIndex(r => new { r.DesignId, r.CreatedAt });
            e.HasOne(r => r.Design).WithMany()
                .HasForeignKey(r => r.DesignId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Comment>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Body).HasMaxLength(4000).IsRequired();
            e.HasIndex(c => c.DesignId);
            e.HasIndex(c => new { c.DesignId, c.ParentId });
            e.HasQueryFilter(c => !c.Design.Room.IsDeleted && !c.Room.IsDeleted);
            e.HasOne(c => c.Design).WithMany()
                .HasForeignKey(c => c.DesignId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.Room).WithMany(r => r.Comments)
                .HasForeignKey(c => c.RoomId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(c => c.Author).WithMany()
                .HasForeignKey(c => c.AuthorId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(c => c.Parent).WithMany(c => c.Replies)
                .HasForeignKey(c => c.ParentId).OnDelete(DeleteBehavior.ClientCascade);
        });

        builder.Entity<Notification>(e =>
        {
            e.HasKey(n => n.Id);
            e.Property(n => n.Title).HasMaxLength(200);
            e.Property(n => n.Body).HasMaxLength(500);
            e.Property(n => n.LinkUrl).HasMaxLength(500);
            e.HasIndex(n => new { n.UserId, n.IsRead });
            e.HasIndex(n => new { n.UserId, n.CreatedAt });
            e.HasOne(n => n.User).WithMany()
                .HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(n => n.Actor).WithMany()
                .HasForeignKey(n => n.ActorId).OnDelete(DeleteBehavior.NoAction);
        });
    }
}
