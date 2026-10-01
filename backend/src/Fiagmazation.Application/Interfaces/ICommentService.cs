using Fiagmazation.Application.Dtos.Comments;

namespace Fiagmazation.Application.Interfaces;

public interface ICommentService
{
    Task<IReadOnlyList<CommentDto>> ListAsync(Guid designId, string userId, bool includeResolved = true, CancellationToken ct = default);
    Task<CommentDto> CreateAsync(Guid designId, CreateCommentRequest request, string userId, CancellationToken ct = default);
    Task<CommentDto> UpdateAsync(Guid commentId, UpdateCommentRequest request, string userId, CancellationToken ct = default);
    Task<CommentDto> ResolveAsync(Guid commentId, bool resolved, string userId, CancellationToken ct = default);
    Task DeleteAsync(Guid commentId, string userId, CancellationToken ct = default);
}
