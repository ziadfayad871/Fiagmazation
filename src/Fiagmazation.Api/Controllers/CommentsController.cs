using Fiagmazation.Application.Dtos.Comments;
using Fiagmazation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fiagmazation.Api.Controllers;

[Authorize]
public class CommentsController : ApiControllerBase
{
    private readonly ICommentService _comments;

    public CommentsController(ICommentService comments) => _comments = comments;

    [HttpGet("/api/designs/{designId:guid}/comments")]
    public async Task<ActionResult<IReadOnlyList<CommentDto>>> List(Guid designId, bool includeResolved = true, CancellationToken ct = default) =>
        Ok(await _comments.ListAsync(designId, UserId, includeResolved, ct));

    [HttpPost("/api/designs/{designId:guid}/comments")]
    public async Task<ActionResult<CommentDto>> Create(Guid designId, CreateCommentRequest request, CancellationToken ct) =>
        Ok(await _comments.CreateAsync(designId, request, UserId, ct));

    [HttpPut("/api/comments/{id:guid}")]
    public async Task<ActionResult<CommentDto>> Update(Guid id, UpdateCommentRequest request, CancellationToken ct) =>
        Ok(await _comments.UpdateAsync(id, request, UserId, ct));

    [HttpPost("/api/comments/{id:guid}/resolve")]
    public async Task<ActionResult<CommentDto>> Resolve(Guid id, ResolveCommentRequest request, CancellationToken ct) =>
        Ok(await _comments.ResolveAsync(id, request.Resolved, UserId, ct));

    [HttpDelete("/api/comments/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _comments.DeleteAsync(id, UserId, ct);
        return NoContent();
    }
}
