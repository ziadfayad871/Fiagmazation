using System.Text.Json;
using System.Text.Json.Serialization;
using Fiagmazation.Application.Common;
using Fiagmazation.Application.Dtos.Designs;
using Fiagmazation.Application.Interfaces;
using Fiagmazation.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Fiagmazation.Application.Services;

public class DesignService : IDesignService
{
    private readonly IAppDbContext _db;
    private readonly IRoomService _rooms;

    public DesignService(IAppDbContext db, IRoomService rooms)
    {
        _db = db;
        _rooms = rooms;
    }

    public async Task<DesignDto?> GetAsync(Guid designId, string userId, CancellationToken ct = default)
    {
        var design = await LoadAsync(designId, ct);
        if (design is null) return null;
        await EnsureAccessAsync(design.RoomId, userId, ct);
        return ToDto(design);
    }

    public async Task<DesignDto?> GetByRoomAsync(Guid roomId, string userId, Guid? designId = null, CancellationToken ct = default)
    {
        await EnsureAccessAsync(roomId, userId, ct);
        var query = _db.Designs.Include(d => d.Elements).Where(d => d.RoomId == roomId);
        var design = designId.HasValue
            ? await query.FirstOrDefaultAsync(d => d.Id == designId, ct)
            : await query.OrderBy(d => d.CreatedAt).FirstOrDefaultAsync(ct);
        return design is null ? null : ToDto(design);
    }

    public async Task<DesignDto> CreateAsync(Guid roomId, string name, string userId, CancellationToken ct = default)
    {
        var role = await _rooms.GetRoleAsync(roomId, userId, ct) ?? throw AppException.Forbidden();
        if (role == Domain.Enums.RoomRole.Viewer) throw AppException.Forbidden("Viewers cannot create designs.");

        var design = new Design
        {
            RoomId = roomId,
            Name = string.IsNullOrWhiteSpace(name) ? "New design" : name.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            UpdatedById = userId
        };
        _db.Designs.Add(design);
        await _db.SaveChangesAsync(ct);
        return ToDto(design);
    }

    public async Task<DesignDto> SaveAsync(Guid designId, SaveDesignRequest request, string userId, CancellationToken ct = default)
    {
        var design = await _db.Designs.Include(d => d.Elements)
            .FirstOrDefaultAsync(d => d.Id == designId, ct)
            ?? throw AppException.NotFound("Design not found.");
        await EnsureWritableAsync(design.RoomId, userId, ct);

        if (!string.IsNullOrWhiteSpace(request.Name)) design.Name = request.Name.Trim();
        if (request.Width is > 0) design.Width = request.Width.Value;
        if (request.Height is > 0) design.Height = request.Height.Value;
        if (!string.IsNullOrWhiteSpace(request.BackgroundColor)) design.BackgroundColor = request.BackgroundColor;
        if (request.Zoom is not null) design.Zoom = request.Zoom.Value;
        if (request.PanX is not null) design.PanX = request.PanX.Value;
        if (request.PanY is not null) design.PanY = request.PanY.Value;

        if (request.Elements is not null)
        {
            var incoming = request.Elements.Where(e => e is not null).ToList();
            var existing = design.Elements.ToDictionary(e => e.Id);
            var seen = new HashSet<Guid>();
            var hasExplicitOrder = incoming.Any(e => e.ZIndex != 0);
            var nextZ = 0;

            foreach (var dto in incoming)
            {
                var id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id;
                if (existing.TryGetValue(id, out var element))
                {
                    element.Apply(dto);
                    element.UpdatedAt = DateTime.UtcNow;
                    element.UpdatedById = userId;
                }
                else
                {
                    var created = new DesignElement
                    {
                        Id = id,
                        DesignId = design.Id,
                        UpdatedAt = DateTime.UtcNow,
                        UpdatedById = userId
                    };
                    created.Apply(dto);
                    if (!hasExplicitOrder) created.ZIndex = nextZ++;
                    _db.DesignElements.Add(created);
                }
                seen.Add(id);
            }

            var stale = design.Elements.Where(e => !seen.Contains(e.Id)).ToList();
            foreach (var element in stale) design.Elements.Remove(element);
        }

        design.UpdatedAt = DateTime.UtcNow;
        design.UpdatedById = userId;
        await _db.SaveChangesAsync(ct);
        return ToDto(design);
    }

    public async Task<DesignDto> RenameAsync(Guid designId, string name, string userId, CancellationToken ct = default)
    {
        var design = await _db.Designs.Include(d => d.Elements)
            .FirstOrDefaultAsync(d => d.Id == designId, ct)
            ?? throw AppException.NotFound("Design not found.");
        await EnsureWritableAsync(design.RoomId, userId, ct);
        design.Name = name.Trim();
        design.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ToDto(design);
    }

    public async Task DeleteAsync(Guid designId, string userId, CancellationToken ct = default)
    {
        var design = await _db.Designs.FirstOrDefaultAsync(d => d.Id == designId, ct)
            ?? throw AppException.NotFound("Design not found.");
        await EnsureWritableAsync(design.RoomId, userId, ct);
        _db.Designs.Remove(design);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<ElementDto> CreateElementAsync(Guid designId, CreateElementRequest request, string userId, CancellationToken ct = default)
    {
        var design = await _db.Designs.Include(d => d.Elements)
            .FirstOrDefaultAsync(d => d.Id == designId, ct)
            ?? throw AppException.NotFound("Design not found.");
        await EnsureWritableAsync(design.RoomId, userId, ct);

        var element = new DesignElement
        {
            DesignId = design.Id,
            Type = request.Type,
            Name = string.IsNullOrWhiteSpace(request.Name) ? DefaultName(request.Type) : request.Name.Trim(),
            X = request.X, Y = request.Y,
            Width = request.Width, Height = request.Height,
            Rotation = request.Rotation, Opacity = request.Opacity <= 0 ? 1 : request.Opacity,
            Fill = request.Fill, Stroke = request.Stroke,
            StrokeWidth = request.StrokeWidth, CornerRadius = request.CornerRadius,
            Text = request.Text, FontFamily = request.FontFamily,
            FontSize = request.FontSize, FontWeight = request.FontWeight,
            TextAlign = request.TextAlign,
            LineHeight = request.LineHeight ?? 1.4,
            Src = request.Src, Points = request.Points,
            IsVisible = request.IsVisible ?? true,
            IsLocked = request.IsLocked ?? false,
            ParentId = request.ParentId,
            LinkToDesignId = request.LinkToDesignId,
            ZIndex = design.Elements.Count == 0 ? 0 : design.Elements.Max(e => e.ZIndex) + 1,
            UpdatedAt = DateTime.UtcNow,
            UpdatedById = userId
        };

        _db.DesignElements.Add(element);
        design.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return element.ToDto();
    }

    public async Task<ElementDto> UpdateElementAsync(Guid designId, Guid elementId, UpdateElementRequest request, string userId, CancellationToken ct = default)
    {
        var design = await _db.Designs.Include(d => d.Elements)
            .FirstOrDefaultAsync(d => d.Id == designId, ct)
            ?? throw AppException.NotFound("Design not found.");
        await EnsureWritableAsync(design.RoomId, userId, ct);

        var element = design.Elements.FirstOrDefault(e => e.Id == elementId)
            ?? throw AppException.NotFound("Element not found.");

        element.Patch(request);
        element.UpdatedAt = DateTime.UtcNow;
        element.UpdatedById = userId;
        design.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return element.ToDto();
    }

    public async Task DeleteElementAsync(Guid designId, Guid elementId, string userId, CancellationToken ct = default)
    {
        await DeleteElementsAsync(designId, [elementId], userId, ct);
    }

    public async Task<IReadOnlyList<ElementDto>> DeleteElementsAsync(Guid designId, IReadOnlyCollection<Guid> ids, string userId, CancellationToken ct = default)
    {
        var design = await _db.Designs.Include(d => d.Elements)
            .FirstOrDefaultAsync(d => d.Id == designId, ct)
            ?? throw AppException.NotFound("Design not found.");
        await EnsureWritableAsync(design.RoomId, userId, ct);

        var targets = design.Elements.Where(e => ids.Contains(e.Id)).ToList();
        foreach (var element in targets) design.Elements.Remove(element);
        design.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return targets.Select(t => t.ToDto()).ToList();
    }

    public async Task<IReadOnlyList<ElementDto>> ReorderAsync(Guid designId, IReadOnlyList<Guid> ids, string userId, CancellationToken ct = default)
    {
        var design = await _db.Designs.Include(d => d.Elements)
            .FirstOrDefaultAsync(d => d.Id == designId, ct)
            ?? throw AppException.NotFound("Design not found.");
        await EnsureWritableAsync(design.RoomId, userId, ct);

        var index = 0;
        foreach (var id in ids)
        {
            var element = design.Elements.FirstOrDefault(e => e.Id == id);
            if (element is null) continue;
            element.ZIndex = index++;
        }
        design.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return design.Elements.OrderBy(e => e.ZIndex).Select(e => e.ToDto()).ToList();
    }

    public async Task<CreateRevisionResponse> CreateRevisionAsync(Guid designId, string? label, string userId, CancellationToken ct = default)
    {
        var design = await LoadAsync(designId, ct)
            ?? throw AppException.NotFound("Design not found.");
        await EnsureAccessAsync(design.RoomId, userId, ct);

        var trimmed = string.IsNullOrWhiteSpace(label) ? null : label.Trim();
        if (trimmed is { Length: > 100 }) trimmed = trimmed[..100];

        if (trimmed is null)
        {
            var latest = await _db.DesignRevisions.AsNoTracking()
                .Where(r => r.DesignId == designId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => (DateTime?)r.CreatedAt)
                .FirstOrDefaultAsync(ct);
            if (latest is not null && DateTime.UtcNow - latest.Value < RevisionThrottle)
                return new CreateRevisionResponse { Created = false };
        }

        var revision = await SaveSnapshotAsync(design, trimmed, userId, ct);
        var names = await LoadDisplayNamesAsync([revision.CreatedById], ct);
        return new CreateRevisionResponse { Created = true, Revision = ToSummary(revision, names) };
    }

    public async Task<IReadOnlyList<RevisionSummaryDto>> ListRevisionsAsync(Guid designId, string userId, CancellationToken ct = default)
    {
        var design = await _db.Designs.AsNoTracking().FirstOrDefaultAsync(d => d.Id == designId, ct)
            ?? throw AppException.NotFound("Design not found.");
        await EnsureAccessAsync(design.RoomId, userId, ct);

        var revisions = await _db.DesignRevisions.AsNoTracking()
            .Where(r => r.DesignId == designId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(50)
            .ToListAsync(ct);
        var names = await LoadDisplayNamesAsync(revisions.Select(r => r.CreatedById), ct);
        return revisions.Select(r => ToSummary(r, names)).ToList();
    }

    public async Task<RevisionDetailDto> GetRevisionAsync(Guid designId, Guid revisionId, string userId, CancellationToken ct = default)
    {
        var design = await _db.Designs.AsNoTracking().FirstOrDefaultAsync(d => d.Id == designId, ct)
            ?? throw AppException.NotFound("Design not found.");
        await EnsureAccessAsync(design.RoomId, userId, ct);

        var revision = await _db.DesignRevisions.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == revisionId && r.DesignId == designId, ct)
            ?? throw AppException.NotFound("Revision not found.");

        var names = await LoadDisplayNamesAsync([revision.CreatedById], ct);
        return new RevisionDetailDto
        {
            Id = revision.Id,
            CreatedAt = revision.CreatedAt,
            Label = revision.Label,
            CreatedByName = names.GetValueOrDefault(revision.CreatedById, string.Empty),
            ElementCount = revision.ElementCount,
            Snapshot = JsonSerializer.Deserialize<DesignSnapshotDto>(revision.SnapshotJson, SnapshotOptions)
                ?? throw AppException.NotFound("Revision snapshot is missing.")
        };
    }

    public async Task<DesignDto> RestoreRevisionAsync(Guid designId, Guid revisionId, string userId, CancellationToken ct = default)
    {
        var design = await LoadAsync(designId, ct)
            ?? throw AppException.NotFound("Design not found.");
        await EnsureWritableAsync(design.RoomId, userId, ct);

        var revision = await _db.DesignRevisions.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == revisionId && r.DesignId == designId, ct)
            ?? throw AppException.NotFound("Revision not found.");

        var snapshot = JsonSerializer.Deserialize<DesignSnapshotDto>(revision.SnapshotJson, SnapshotOptions)
            ?? throw AppException.BadRequest("Revision snapshot is invalid.");

        await SaveSnapshotAsync(design, BeforeRestoreLabel, userId, ct);

        return await SaveAsync(designId, new SaveDesignRequest
        {
            Name = snapshot.Name,
            Width = snapshot.Width,
            Height = snapshot.Height,
            BackgroundColor = snapshot.BackgroundColor,
            Elements = snapshot.Elements
        }, userId, ct);
    }

    private async Task<DesignRevision> SaveSnapshotAsync(Design design, string? label, string userId, CancellationToken ct)
    {
        var snapshot = new DesignSnapshotDto
        {
            Name = design.Name,
            Width = design.Width,
            Height = design.Height,
            BackgroundColor = design.BackgroundColor,
            Elements = design.Elements.OrderBy(e => e.ZIndex).Select(e => e.ToDto()).ToList()
        };

        var revision = new DesignRevision
        {
            DesignId = design.Id,
            SnapshotJson = JsonSerializer.Serialize(snapshot, SnapshotOptions),
            CreatedAt = DateTime.UtcNow,
            CreatedById = userId,
            Label = label,
            ElementCount = snapshot.Elements.Count
        };
        _db.DesignRevisions.Add(revision);
        await _db.SaveChangesAsync(ct);
        return revision;
    }

    private async Task<Dictionary<string, string>> LoadDisplayNamesAsync(IEnumerable<string> userIds, CancellationToken ct)
    {
        var ids = userIds.Distinct().ToList();
        if (ids.Count == 0) return [];
        return await _db.Users.AsNoTracking()
            .Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id,
                u => string.IsNullOrWhiteSpace(u.FullName) ? u.UserName ?? u.Id : u.FullName, ct);
    }

    private static RevisionSummaryDto ToSummary(DesignRevision revision, IReadOnlyDictionary<string, string> names) => new()
    {
        Id = revision.Id,
        CreatedAt = revision.CreatedAt,
        Label = revision.Label,
        CreatedByName = names.GetValueOrDefault(revision.CreatedById, string.Empty),
        ElementCount = revision.ElementCount
    };

    private static readonly TimeSpan RevisionThrottle = TimeSpan.FromSeconds(60);
    private const string BeforeRestoreLabel = "Before restore";

    private static readonly JsonSerializerOptions SnapshotOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private async Task<Design?> LoadAsync(Guid designId, CancellationToken ct) =>
        await _db.Designs.Include(d => d.Elements).AsSplitQuery()
            .FirstOrDefaultAsync(d => d.Id == designId, ct);
    private async Task EnsureAccessAsync(Guid roomId, string userId, CancellationToken ct)
    {
        if (!await _rooms.HasAccessAsync(roomId, userId, ct))
            throw AppException.Forbidden("You do not have access to this design.");
    }

    private async Task EnsureWritableAsync(Guid roomId, string userId, CancellationToken ct)
    {
        var role = await _rooms.GetRoleAsync(roomId, userId, ct) ?? throw AppException.Forbidden();
        if (role == Domain.Enums.RoomRole.Viewer)
            throw AppException.Forbidden("Viewers cannot modify this design.");
    }

    private static string DefaultName(Domain.Enums.ElementType type) => type switch
    {
        Domain.Enums.ElementType.Rectangle => "Rectangle",
        Domain.Enums.ElementType.Ellipse => "Ellipse",
        Domain.Enums.ElementType.Line => "Line",
        Domain.Enums.ElementType.Pencil => "Pencil",
        Domain.Enums.ElementType.Text => "Text",
        Domain.Enums.ElementType.Image => "Image",
        _ => "Frame"
    };

    private static DesignDto ToDto(Design design) => new()
    {
        Id = design.Id,
        RoomId = design.RoomId,
        Name = design.Name,
        Width = design.Width,
        Height = design.Height,
        BackgroundColor = design.BackgroundColor,
        Zoom = design.Zoom,
        PanX = design.PanX,
        PanY = design.PanY,
        UpdatedAt = design.UpdatedAt,
        ElementCount = design.Elements.Count,
        UpdatedBy = design.UpdatedById,
        Elements = design.Elements.OrderBy(e => e.ZIndex).Select(e => e.ToDto()).ToList()
    };
}
