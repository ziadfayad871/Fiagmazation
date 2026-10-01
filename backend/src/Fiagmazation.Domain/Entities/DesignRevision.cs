namespace Fiagmazation.Domain.Entities;

public class DesignRevision
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DesignId { get; set; }
    public string SnapshotJson { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedById { get; set; } = string.Empty;
    public string? Label { get; set; }
    public int ElementCount { get; set; }

    public Design Design { get; set; } = null!;
}
