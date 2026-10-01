using Fiagmazation.Application.Dtos.Designs;

namespace Fiagmazation.Application.Interfaces;

public interface IDesignService
{
    Task<DesignDto?> GetAsync(Guid designId, string userId, CancellationToken ct = default);
    Task<DesignDto?> GetByRoomAsync(Guid roomId, string userId, Guid? designId = null, CancellationToken ct = default);
    Task<DesignDto> CreateAsync(Guid roomId, string name, string userId, CancellationToken ct = default);
    Task<DesignDto> SaveAsync(Guid designId, SaveDesignRequest request, string userId, CancellationToken ct = default);
    Task<DesignDto> RenameAsync(Guid designId, string name, string userId, CancellationToken ct = default);
    Task DeleteAsync(Guid designId, string userId, CancellationToken ct = default);

    Task<ElementDto> CreateElementAsync(Guid designId, CreateElementRequest request, string userId, CancellationToken ct = default);
    Task<ElementDto> UpdateElementAsync(Guid designId, Guid elementId, UpdateElementRequest request, string userId, CancellationToken ct = default);
    Task DeleteElementAsync(Guid designId, Guid elementId, string userId, CancellationToken ct = default);
    Task<IReadOnlyList<ElementDto>> DeleteElementsAsync(Guid designId, IReadOnlyCollection<Guid> ids, string userId, CancellationToken ct = default);
    Task<IReadOnlyList<ElementDto>> ReorderAsync(Guid designId, IReadOnlyList<Guid> ids, string userId, CancellationToken ct = default);

    Task<CreateRevisionResponse> CreateRevisionAsync(Guid designId, string? label, string userId, CancellationToken ct = default);
    Task<IReadOnlyList<RevisionSummaryDto>> ListRevisionsAsync(Guid designId, string userId, CancellationToken ct = default);
    Task<RevisionDetailDto> GetRevisionAsync(Guid designId, Guid revisionId, string userId, CancellationToken ct = default);
    Task<DesignDto> RestoreRevisionAsync(Guid designId, Guid revisionId, string userId, CancellationToken ct = default);
}
