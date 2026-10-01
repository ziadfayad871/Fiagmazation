using Fiagmazation.Domain.Enums;

namespace Fiagmazation.Domain.Entities;

public class DesignElement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ElementType Type { get; set; }
    public string Name { get; set; } = "Layer";

    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public double Rotation { get; set; }
    public double Opacity { get; set; } = 1;

    public string? Fill { get; set; }
    public string? Stroke { get; set; }
    public double StrokeWidth { get; set; } = 1;
    public double CornerRadius { get; set; }

    public string? Text { get; set; }
    public string FontFamily { get; set; } = "Inter";
    public double FontSize { get; set; } = 24;
    public FontWeight FontWeight { get; set; } = FontWeight.Regular;
    public TextAlign TextAlign { get; set; } = TextAlign.Left;
    public double LineHeight { get; set; } = 1.4;

    public string? Src { get; set; }
    public string? Points { get; set; }

    public int ZIndex { get; set; }
    public bool IsVisible { get; set; } = true;
    public bool IsLocked { get; set; }
    public Guid? ParentId { get; set; }
    public Guid? LinkToDesignId { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? UpdatedById { get; set; }

    public Guid DesignId { get; set; }
    public Design Design { get; set; } = null!;
}
