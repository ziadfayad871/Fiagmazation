using Fiagmazation.Application.Dtos.Designs;
using Fiagmazation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fiagmazation.Api.Controllers;

[Authorize]
public class DesignsController : ApiControllerBase
{
    private readonly IDesignService _designs;

    public DesignsController(IDesignService designs) => _designs = designs;

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DesignDto>> Get(Guid id, CancellationToken ct)
    {
        var design = await _designs.GetAsync(id, UserId, ct);
        return design is null ? NotFound() : Ok(design);
    }

    [HttpGet("/api/rooms/{roomId:guid}/design")]
    public async Task<ActionResult<DesignDto>> GetPrimary(Guid roomId, Guid? designId, CancellationToken ct)
    {
        var design = await _designs.GetByRoomAsync(roomId, UserId, designId, ct);
        return design is null ? NotFound() : Ok(design);
    }

    [HttpPost("/api/rooms/{roomId:guid}/designs")]
    public async Task<ActionResult<DesignDto>> Create(Guid roomId, [FromBody] CreateDesignRequest request, CancellationToken ct)
    {
        var design = await _designs.CreateAsync(roomId, request.Name ?? "New design", UserId, ct);
        return CreatedAtAction(nameof(Get), new { id = design.Id }, design);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DesignDto>> Save(Guid id, SaveDesignRequest request, CancellationToken ct) =>
        Ok(await _designs.SaveAsync(id, request, UserId, ct));

    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<DesignDto>> Rename(Guid id, [FromBody] RenameDesignRequest request, CancellationToken ct) =>
        Ok(await _designs.RenameAsync(id, request.Name, UserId, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _designs.DeleteAsync(id, UserId, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/elements")]
    public async Task<ActionResult<ElementDto>> CreateElement(Guid id, CreateElementRequest request, CancellationToken ct) =>
        Ok(await _designs.CreateElementAsync(id, request, UserId, ct));

    [HttpPatch("{id:guid}/elements/{elementId:guid}")]
    public async Task<ActionResult<ElementDto>> UpdateElement(Guid id, Guid elementId, UpdateElementRequest request, CancellationToken ct) =>
        Ok(await _designs.UpdateElementAsync(id, elementId, request, UserId, ct));

    [HttpDelete("{id:guid}/elements/{elementId:guid}")]
    public async Task<IActionResult> DeleteElement(Guid id, Guid elementId, CancellationToken ct)
    {
        await _designs.DeleteElementAsync(id, elementId, UserId, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/elements/bulk-delete")]
    public async Task<ActionResult<IReadOnlyList<ElementDto>>> BulkDelete(Guid id, ElementBatchRequest request, CancellationToken ct) =>
        Ok(await _designs.DeleteElementsAsync(id, request.Ids, UserId, ct));

    [HttpPut("{id:guid}/elements/order")]
    public async Task<ActionResult<IReadOnlyList<ElementDto>>> Reorder(Guid id, ReorderElementsRequest request, CancellationToken ct) =>
        Ok(await _designs.ReorderAsync(id, request.Ids, UserId, ct));

    [HttpPost("{id:guid}/revisions")]
    public async Task<ActionResult<CreateRevisionResponse>> CreateRevision(Guid id, CreateRevisionRequest? request, CancellationToken ct) =>
        Ok(await _designs.CreateRevisionAsync(id, request?.Label, UserId, ct));

    [HttpGet("{id:guid}/revisions")]
    public async Task<ActionResult<IReadOnlyList<RevisionSummaryDto>>> ListRevisions(Guid id, CancellationToken ct) =>
        Ok(await _designs.ListRevisionsAsync(id, UserId, ct));

    [HttpGet("{id:guid}/revisions/{revisionId:guid}")]
    public async Task<ActionResult<RevisionDetailDto>> GetRevision(Guid id, Guid revisionId, CancellationToken ct) =>
        Ok(await _designs.GetRevisionAsync(id, revisionId, UserId, ct));

    [HttpPost("{id:guid}/revisions/{revisionId:guid}/restore")]
    public async Task<ActionResult<DesignDto>> RestoreRevision(Guid id, Guid revisionId, CancellationToken ct) =>
        Ok(await _designs.RestoreRevisionAsync(id, revisionId, UserId, ct));

    public class CreateDesignRequest
    {
        public string? Name { get; set; }
    }

    public class RenameDesignRequest
    {
        public string Name { get; set; } = string.Empty;
    }
}
