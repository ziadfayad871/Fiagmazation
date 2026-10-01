using Fiagmazation.Application.Common;
using Fiagmazation.Application.Dtos.Rooms;

namespace Fiagmazation.Application.Interfaces;

public interface IRoomService
{
    Task<PagedResult<RoomSummaryDto>> ListAsync(RoomListQuery query, string userId, CancellationToken ct = default);
    Task<RoomDetailDto> GetAsync(Guid roomId, string userId, CancellationToken ct = default);
    Task<RoomSummaryDto> CreateAsync(CreateRoomRequest request, string userId, CancellationToken ct = default);
    Task<RoomSummaryDto> UpdateAsync(Guid roomId, UpdateRoomRequest request, string userId, CancellationToken ct = default);
    Task DeleteAsync(Guid roomId, string userId, CancellationToken ct = default);
    Task<RoomSummaryDto> DuplicateAsync(Guid roomId, string userId, CancellationToken ct = default);
    Task<IReadOnlyList<RoomMemberDto>> GetMembersAsync(Guid roomId, string userId, CancellationToken ct = default);
    Task<RoomMemberDto> AddMemberAsync(Guid roomId, ShareRoomRequest request, string actorId, CancellationToken ct = default);
    Task<RoomMemberDto> UpdateMemberRoleAsync(Guid roomId, string targetUserId, Domain.Enums.RoomRole role, string actorId, CancellationToken ct = default);
    Task RemoveMemberAsync(Guid roomId, string targetUserId, string actorId, CancellationToken ct = default);
    Task<RoomStatsDto> GetStatsAsync(string userId, CancellationToken ct = default);
    Task<bool> HasAccessAsync(Guid roomId, string userId, CancellationToken ct = default);
    Task<Domain.Enums.RoomRole?> GetRoleAsync(Guid roomId, string userId, CancellationToken ct = default);
}
