using Fiagmazation.Application.Common;
using Fiagmazation.Application.Dtos.Designs;
using Fiagmazation.Application.Dtos.Rooms;
using Fiagmazation.Application.Interfaces;
using Fiagmazation.Domain.Entities;
using Fiagmazation.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Fiagmazation.Application.Services;

public class RoomService : IRoomService
{
    private readonly IAppDbContext _db;
    private readonly IPresenceTracker _presence;
    private readonly INotificationService _notifications;

    public RoomService(IAppDbContext db, IPresenceTracker presence, INotificationService notifications)
    {
        _db = db;
        _presence = presence;
        _notifications = notifications;
    }

    private const int RecentScopeLimit = 20;

    public async Task<PagedResult<RoomSummaryDto>> ListAsync(RoomListQuery query, string userId, CancellationToken ct = default)
    {
        var search = query.Search?.Trim().ToLowerInvariant();
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var page = Math.Max(query.Page, 1);
        var recent = query.Scope == "recent";

        var baseQuery = _db.Rooms
            .Where(r => !r.IsDeleted)
            .Where(r => r.OwnerId == userId || r.Members.Any(m => m.UserId == userId));

        baseQuery = query.Scope switch
        {
            "mine" => baseQuery.Where(r => r.OwnerId == userId),
            "shared" => baseQuery.Where(r => r.OwnerId != userId && r.Members.Any(m => m.UserId == userId)),
            _ => baseQuery
        };

        if (!string.IsNullOrWhiteSpace(search))
            baseQuery = baseQuery.Where(r => r.Name.ToLower().Contains(search));

        var total = await baseQuery.CountAsync(ct);

        var skip = recent ? 0 : (page - 1) * pageSize;
        var take = recent ? Math.Min(pageSize, RecentScopeLimit) : pageSize;
        if (recent) total = Math.Min(total, take);

        var rooms = await baseQuery
            .OrderByDescending(r => r.UpdatedAt)
            .Skip(skip)
            .Take(take)
            .Include(r => r.Owner)
            .Include(r => r.Members)
            .Include(r => r.Designs)
            .AsSplitQuery()
            .ToListAsync(ct);

        return new PagedResult<RoomSummaryDto>
        {
            Items = rooms.Select(r => ToSummary(r, userId)).ToList(),
            Total = total,
            Page = recent ? 1 : page,
            PageSize = take
        };
    }

    public async Task<RoomDetailDto> GetAsync(Guid roomId, string userId, CancellationToken ct = default)
    {
        var room = await _db.Rooms
            .Include(r => r.Owner)
            .Include(r => r.Members).ThenInclude(m => m.User)
            .Include(r => r.Designs)
            .AsSplitQuery()
            .FirstOrDefaultAsync(r => r.Id == roomId && !r.IsDeleted, ct)
            ?? throw AppException.NotFound("Room not found.");

        EnsureAccess(room, userId);

        var summary = ToSummary(room, userId);
        var detail = new RoomDetailDto
        {
            Id = summary.Id,
            Name = summary.Name,
            Description = summary.Description,
            ThumbnailUrl = summary.ThumbnailUrl,
            AccentColor = summary.AccentColor,
            Owner = summary.Owner,
            Role = summary.Role,
            IsOwner = summary.IsOwner,
            MemberCount = summary.MemberCount,
            OnlineCount = summary.OnlineCount,
            DesignCount = summary.DesignCount,
            CreatedAt = summary.CreatedAt,
            UpdatedAt = summary.UpdatedAt,
            RelativeUpdatedAt = summary.RelativeUpdatedAt,
            PrimaryDesignId = summary.PrimaryDesignId
        };
        detail.Members = room.Members
            .OrderBy(m => m.Role == RoomRole.Owner ? 0 : m.Role == RoomRole.Editor ? 1 : 2)
            .ThenBy(m => m.User.FullName)
            .Select(m =>
            {
                var dto = new RoomMemberDto
                {
                    Id = m.Id,
                    RoomId = m.RoomId,
                    Role = m.Role,
                    JoinedAt = m.JoinedAt,
                    User = m.User.ToBrief(),
                    IsOnline = _presence.IsOnline(roomId, m.UserId)
                };
                return dto;
            }).ToList();
        detail.Designs = room.Designs.OrderBy(d => d.CreatedAt).Select(d => new DesignSummaryDto
        {
            Id = d.Id,
            RoomId = d.RoomId,
            Name = d.Name,
            Width = d.Width,
            Height = d.Height,
            BackgroundColor = d.BackgroundColor,
            UpdatedAt = d.UpdatedAt
        }).ToList();
        detail.MemberCount = room.Members.Count;
        return detail;
    }

    public async Task<RoomSummaryDto> CreateAsync(CreateRoomRequest request, string userId, CancellationToken ct = default)
    {
        var accent = string.IsNullOrWhiteSpace(request.AccentColor) ? Mappers.ColorFor(Guid.NewGuid().ToString()) : request.AccentColor!;
        var room = new Room
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            AccentColor = accent,
            OwnerId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        room.Members.Add(new RoomMember { RoomId = room.Id, UserId = userId, Role = RoomRole.Owner });
        room.Designs.Add(new Design
        {
            RoomId = room.Id,
            Name = "Design 1",
            Width = 1440,
            Height = 900,
            BackgroundColor = "#FFFFFF"
        });

        _db.Rooms.Add(room);
        await _db.SaveChangesAsync(ct);

        var created = await _db.Rooms
            .Include(r => r.Owner)
            .Include(r => r.Members)
            .Include(r => r.Designs)
            .AsSplitQuery()
            .FirstAsync(r => r.Id == room.Id, ct);

        return ToSummary(created, userId);
    }

    public async Task<RoomSummaryDto> UpdateAsync(Guid roomId, UpdateRoomRequest request, string userId, CancellationToken ct = default)
    {
        var room = await _db.Rooms
            .Include(r => r.Owner).Include(r => r.Members).Include(r => r.Designs)
            .AsSplitQuery()
            .FirstOrDefaultAsync(r => r.Id == roomId && !r.IsDeleted, ct)
            ?? throw AppException.NotFound("Room not found.");

        if (room.OwnerId != userId)
        {
            var role = room.Members.FirstOrDefault(m => m.UserId == userId)?.Role;
            if (role != RoomRole.Owner && role != RoomRole.Editor)
                throw AppException.Forbidden("Only owners and editors can rename this room.");
        }

        if (!string.IsNullOrWhiteSpace(request.Name)) room.Name = request.Name.Trim();
        if (request.Description is not null) room.Description = request.Description.Trim();
        if (!string.IsNullOrWhiteSpace(request.AccentColor)) room.AccentColor = request.AccentColor;
        room.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ToSummary(room, userId);
    }

    public async Task DeleteAsync(Guid roomId, string userId, CancellationToken ct = default)
    {
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId && !r.IsDeleted, ct)
            ?? throw AppException.NotFound("Room not found.");
        if (room.OwnerId != userId) throw AppException.Forbidden("Only the room owner can delete this room.");

        room.IsDeleted = true;
        room.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<RoomSummaryDto> DuplicateAsync(Guid roomId, string userId, CancellationToken ct = default)
    {
        var source = await _db.Rooms
            .Include(r => r.Owner).Include(r => r.Members).Include(r => r.Designs)
            .ThenInclude(d => d.Elements)
            .AsSplitQuery()
            .FirstOrDefaultAsync(r => r.Id == roomId && !r.IsDeleted, ct)
            ?? throw AppException.NotFound("Room not found.");

        EnsureAccess(source, userId);

        var copy = new Room
        {
            Name = $"{source.Name} (copy)",
            Description = source.Description,
            AccentColor = source.AccentColor,
            OwnerId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        copy.Members.Add(new RoomMember { RoomId = copy.Id, UserId = userId, Role = RoomRole.Owner });

        foreach (var design in source.Designs)
        {
            var designCopy = new Design
            {
                RoomId = copy.Id,
                Name = design.Name,
                Width = design.Width,
                Height = design.Height,
                BackgroundColor = design.BackgroundColor,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            foreach (var element in design.Elements.OrderBy(e => e.ZIndex))
            {
                designCopy.Elements.Add(new DesignElement
                {
                    Id = Guid.NewGuid(),
                    Type = element.Type,
                    Name = element.Name,
                    X = element.X, Y = element.Y,
                    Width = element.Width, Height = element.Height,
                    Rotation = element.Rotation, Opacity = element.Opacity,
                    Fill = element.Fill, Stroke = element.Stroke,
                    StrokeWidth = element.StrokeWidth, CornerRadius = element.CornerRadius,
                    Text = element.Text, FontFamily = element.FontFamily,
                    FontSize = element.FontSize, FontWeight = element.FontWeight,
                    TextAlign = element.TextAlign, LineHeight = element.LineHeight,
                    Src = element.Src, Points = element.Points,
                    ZIndex = element.ZIndex, IsVisible = element.IsVisible,
                    IsLocked = element.IsLocked,
                    DesignId = designCopy.Id,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            copy.Designs.Add(designCopy);
        }

        _db.Rooms.Add(copy);
        await _db.SaveChangesAsync(ct);

        var created = await _db.Rooms
            .Include(r => r.Owner).Include(r => r.Members).Include(r => r.Designs)
            .AsSplitQuery()
            .FirstAsync(r => r.Id == copy.Id, ct);
        return ToSummary(created, userId);
    }

    public async Task<IReadOnlyList<RoomMemberDto>> GetMembersAsync(Guid roomId, string userId, CancellationToken ct = default)
    {
        var room = await _db.Rooms
            .Include(r => r.Members).ThenInclude(m => m.User)
            .AsSplitQuery()
            .FirstOrDefaultAsync(r => r.Id == roomId && !r.IsDeleted, ct)
            ?? throw AppException.NotFound("Room not found.");
        EnsureAccess(room, userId);

        return room.Members.Select(m => new RoomMemberDto
        {
            Id = m.Id,
            RoomId = m.RoomId,
            Role = m.Role,
            JoinedAt = m.JoinedAt,
            User = m.User.ToBrief(),
            IsOnline = _presence.IsOnline(roomId, m.UserId)
        }).OrderByDescending(m => m.IsOnline).ThenBy(m => m.User.FullName).ToList();
    }

    public async Task<RoomMemberDto> AddMemberAsync(Guid roomId, ShareRoomRequest request, string actorId, CancellationToken ct = default)
    {
        var room = await _db.Rooms.Include(r => r.Owner)
            .FirstOrDefaultAsync(r => r.Id == roomId && !r.IsDeleted, ct)
            ?? throw AppException.NotFound("Room not found.");
        if (room.OwnerId != actorId) throw AppException.Forbidden("Only the owner can share this room.");
        if (request.Role == RoomRole.Owner) throw AppException.BadRequest("The Owner role cannot be granted.");

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct)
            ?? throw AppException.NotFound("No account exists with that email address.");

        if (user.Id == actorId) throw AppException.BadRequest("You are already the owner of this room.");

        var existing = await _db.RoomMembers.FirstOrDefaultAsync(m => m.RoomId == roomId && m.UserId == user.Id, ct);
        if (existing is not null)
        {
            existing.Role = request.Role;
            await _db.SaveChangesAsync(ct);
            return new RoomMemberDto
            {
                Id = existing.Id, RoomId = roomId, Role = existing.Role,
                JoinedAt = existing.JoinedAt, User = user.ToBrief()
            };
        }

        var member = new RoomMember { RoomId = roomId, UserId = user.Id, Role = request.Role };
        _db.RoomMembers.Add(member);
        await _db.SaveChangesAsync(ct);

        await _notifications.CreateAsync(user.Id, NotificationType.RoomShared,
            $"{room.Name} was shared with you",
            $"You now have {request.Role.ToString().ToLowerInvariant()} access to this room.",
            $"/editor/{roomId}", actorId, ct);

        return new RoomMemberDto
        {
            Id = member.Id, RoomId = roomId, Role = member.Role,
            JoinedAt = member.JoinedAt, User = user.ToBrief()
        };
    }

    public async Task<RoomMemberDto> UpdateMemberRoleAsync(Guid roomId, string targetUserId, RoomRole role, string actorId, CancellationToken ct = default)
    {
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId && !r.IsDeleted, ct)
            ?? throw AppException.NotFound("Room not found.");
        if (room.OwnerId != actorId) throw AppException.Forbidden("Only the owner can change roles.");
        if (targetUserId == room.OwnerId) throw AppException.BadRequest("The owner's role cannot be changed.");
        if (role == RoomRole.Owner) throw AppException.BadRequest("The Owner role cannot be granted.");

        var member = await _db.RoomMembers
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.RoomId == roomId && m.UserId == targetUserId, ct)
            ?? throw AppException.NotFound("That person is not a member of this room.");

        member.Role = role;
        await _db.SaveChangesAsync(ct);

        return new RoomMemberDto
        {
            Id = member.Id, RoomId = roomId, Role = member.Role,
            JoinedAt = member.JoinedAt, User = member.User.ToBrief()
        };
    }

    public async Task RemoveMemberAsync(Guid roomId, string targetUserId, string actorId, CancellationToken ct = default)
    {
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId && !r.IsDeleted, ct)
            ?? throw AppException.NotFound("Room not found.");

        if (targetUserId != actorId && room.OwnerId != actorId)
            throw AppException.Forbidden("Only the owner can remove other members.");
        if (targetUserId == room.OwnerId)
            throw AppException.BadRequest("The owner cannot be removed from the room.");

        var member = await _db.RoomMembers
            .FirstOrDefaultAsync(m => m.RoomId == roomId && m.UserId == targetUserId, ct)
            ?? throw AppException.NotFound("That person is not a member of this room.");

        _db.RoomMembers.Remove(member);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<RoomStatsDto> GetStatsAsync(string userId, CancellationToken ct = default)
    {
        var owned = await _db.Rooms.CountAsync(r => !r.IsDeleted && r.OwnerId == userId, ct);
        var shared = await _db.Rooms.CountAsync(r => !r.IsDeleted && r.OwnerId != userId
            && r.Members.Any(m => m.UserId == userId), ct);

        var totalCollaborators = await _db.RoomMembers
            .Where(m => m.Room.OwnerId == userId || m.Room.Members.Any(x => x.UserId == userId))
            .Select(m => m.UserId)
            .Distinct()
            .CountAsync(ct);

        var roomIds = await _db.Rooms
            .Where(r => !r.IsDeleted && (r.OwnerId == userId || r.Members.Any(m => m.UserId == userId)))
            .Select(r => r.Id)
            .ToListAsync(ct);

        var onlineIds = new HashSet<string>();
        foreach (var roomId in roomIds)
        {
            foreach (var member in _presence.GetRoom(roomId))
                onlineIds.Add(member.UserId);
        }

        return new RoomStatsDto
        {
            MyRooms = owned,
            SharedRooms = shared,
            TotalCollaborators = Math.Max(0, totalCollaborators - 1),
            OnlineNow = onlineIds.Count(id => id != userId)
        };
    }

    public async Task<bool> HasAccessAsync(Guid roomId, string userId, CancellationToken ct = default) =>
        await GetRoleAsync(roomId, userId, ct) is not null;

    public async Task<RoomRole?> GetRoleAsync(Guid roomId, string userId, CancellationToken ct = default)
    {
        var room = await _db.Rooms.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == roomId && !r.IsDeleted, ct);
        if (room is null) return null;
        if (room.OwnerId == userId) return RoomRole.Owner;
        var member = await _db.RoomMembers.AsNoTracking()
            .FirstOrDefaultAsync(m => m.RoomId == roomId && m.UserId == userId, ct);
        return member?.Role;
    }

    private static void EnsureAccess(Room room, string userId)
    {
        var isMember = room.OwnerId == userId || room.Members.Any(m => m.UserId == userId);
        if (!isMember) throw AppException.Forbidden("You do not have access to this room.");
    }

    private RoomSummaryDto ToSummary(Room room, string viewerId)
    {
        var role = room.OwnerId == viewerId
            ? RoomRole.Owner
            : room.Members.FirstOrDefault(m => m.UserId == viewerId)?.Role ?? RoomRole.Viewer;

        return new RoomSummaryDto
        {
            Id = room.Id,
            Name = room.Name,
            Description = room.Description,
            ThumbnailUrl = room.ThumbnailUrl,
            AccentColor = room.AccentColor,
            Owner = room.Owner.ToBrief(),
            Role = role,
            IsOwner = room.OwnerId == viewerId,
            MemberCount = room.Members.Count,
            OnlineCount = room.Members.Count(m => _presence.IsOnline(room.Id, m.UserId)),
            DesignCount = room.Designs.Count,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt,
            RelativeUpdatedAt = Mappers.RelativeTime(room.UpdatedAt),
            PrimaryDesignId = room.Designs.OrderBy(d => d.CreatedAt).Select(d => (Guid?)d.Id).FirstOrDefault()
        };
    }
}
