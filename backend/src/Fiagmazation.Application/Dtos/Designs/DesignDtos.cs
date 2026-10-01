using System.ComponentModel.DataAnnotations;
using Fiagmazation.Domain.Enums;

namespace Fiagmazation.Application.Dtos.Designs;

public class DesignSummaryDto
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
    public string BackgroundColor { get; set; } = "#FFFFFF";
    public DateTime UpdatedAt { get; set; }
    public int ElementCount { get; set; }
}

public class DesignDto : DesignSummaryDto
{
    public double Zoom { get; set; } = 1;
    public double PanX { get; set; }
    public double PanY { get; set; }
    public List<ElementDto> Elements { get; set; } = [];
    public string? UpdatedBy { get; set; }
}

public class ElementDto
{
    public Guid Id { get; set; }
    public ElementType Type { get; set; }
    [MaxLength(160)] public string Name { get; set; } = "Layer";
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public double Rotation { get; set; }
    public double Opacity { get; set; } = 1;
    [MaxLength(64)] public string? Fill { get; set; }
    [MaxLength(64)] public string? Stroke { get; set; }
    public double StrokeWidth { get; set; } = 1;
    public double CornerRadius { get; set; }
    [MaxLength(4000)] public string? Text { get; set; }
    [MaxLength(80)] public string FontFamily { get; set; } = "Inter";
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
    public DateTime UpdatedAt { get; set; }
}

public class CreateElementRequest
{
    [Required] public ElementType Type { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public double Rotation { get; set; }
    public double Opacity { get; set; } = 1;
    [MaxLength(64)] public string? Fill { get; set; }
    [MaxLength(64)] public string? Stroke { get; set; }
    public double StrokeWidth { get; set; } = 1;
    public double CornerRadius { get; set; }
    [MaxLength(4000)] public string? Text { get; set; }
    [MaxLength(80)] public string FontFamily { get; set; } = "Inter";
    public double FontSize { get; set; } = 24;
    public FontWeight FontWeight { get; set; } = FontWeight.Regular;
    public TextAlign TextAlign { get; set; } = TextAlign.Left;
    public double? LineHeight { get; set; }
    public string? Src { get; set; }
    public string? Points { get; set; }
    public bool? IsVisible { get; set; }
    public bool? IsLocked { get; set; }
    public Guid? ParentId { get; set; }
    [MaxLength(160)] public string? Name { get; set; }
    public Guid? LinkToDesignId { get; set; }
}

public class UpdateElementRequest
{
    [MaxLength(160)] public string? Name { get; set; }
    public double? X { get; set; }
    public double? Y { get; set; }
    public double? Width { get; set; }
    public double? Height { get; set; }
    public double? Rotation { get; set; }
    public double? Opacity { get; set; }
    [MaxLength(64)] public string? Fill { get; set; }
    [MaxLength(64)] public string? Stroke { get; set; }
    public double? StrokeWidth { get; set; }
    public double? CornerRadius { get; set; }
    [MaxLength(4000)] public string? Text { get; set; }
    [MaxLength(80)] public string? FontFamily { get; set; }
    public double? FontSize { get; set; }
    public FontWeight? FontWeight { get; set; }
    public TextAlign? TextAlign { get; set; }
    public double? LineHeight { get; set; }
    public string? Src { get; set; }
    public string? Points { get; set; }
    public int? ZIndex { get; set; }
    public bool? IsVisible { get; set; }
    public bool? IsLocked { get; set; }
    public Guid? ParentId { get; set; }
    public Guid? LinkToDesignId { get; set; }
}

public class SaveDesignRequest
{
    [MaxLength(120)] public string? Name { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    [MaxLength(24)] public string? BackgroundColor { get; set; }
    public double? Zoom { get; set; }
    public double? PanX { get; set; }
    public double? PanY { get; set; }
    public List<ElementDto>? Elements { get; set; }
}

public class ElementBatchRequest
{
    [Required, MinLength(1)] public List<Guid> Ids { get; set; } = [];
}

public class ReorderElementsRequest
{
    [Required, MinLength(1)] public List<Guid> Ids { get; set; } = [];
}

public class DesignSnapshotDto
{
    public List<ElementDto> Elements { get; set; } = [];
    public int Width { get; set; }
    public int Height { get; set; }
    public string BackgroundColor { get; set; } = "#FFFFFF";
    public string Name { get; set; } = string.Empty;
}

public class RevisionSummaryDto
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Label { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public int ElementCount { get; set; }
}

public class RevisionDetailDto : RevisionSummaryDto
{
    public DesignSnapshotDto Snapshot { get; set; } = new();
}

public class CreateRevisionRequest
{
    [MaxLength(100)] public string? Label { get; set; }
}

public class CreateRevisionResponse
{
    public bool Created { get; set; }
    public RevisionSummaryDto? Revision { get; set; }
}
