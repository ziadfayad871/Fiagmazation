namespace Fiagmazation.Domain.Entities;

public class Design
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "Design";
    public int Width { get; set; } = 1440;
    public int Height { get; set; } = 900;
    public string BackgroundColor { get; set; } = "#FFFFFF";
    public double Zoom { get; set; } = 1;
    public double PanX { get; set; }
    public double PanY { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? UpdatedById { get; set; }

    public Guid RoomId { get; set; }
    public Room Room { get; set; } = null!;

    public ICollection<DesignElement> Elements { get; set; } = new List<DesignElement>();
}
