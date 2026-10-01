using Fiagmazation.Application.Dtos.Auth;
using Fiagmazation.Application.Dtos.Comments;
using Fiagmazation.Application.Dtos.Designs;
using Fiagmazation.Application.Dtos.Rooms;
using Fiagmazation.Domain.Entities;

namespace Fiagmazation.Application.Common;

public static class Mappers
{
    private static readonly string[] Palette =
        ["#2563EB", "#F97316", "#7C3AED", "#EC4899", "#10B981", "#EF4444", "#0EA5E9", "#F59E0B", "#8B5CF6"];

    public static string ColorFor(string key)
    {
        if (string.IsNullOrWhiteSpace(key)) return Palette[0];
        var hash = 0;
        foreach (var c in key) hash = (hash * 31) + c;
        return Palette[Math.Abs(hash) % Palette.Length];
    }

    public static UserBriefDto ToBrief(this ApplicationUser user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        DisplayName = string.IsNullOrWhiteSpace(user.FullName) ? user.UserName ?? user.Id : user.FullName,
        AvatarUrl = user.AvatarUrl,
        Color = ColorFor(user.Id),
        Email = user.Email ?? string.Empty
    };
    public static UserBriefAuthorDto ToAuthor(this ApplicationUser user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        DisplayName = string.IsNullOrWhiteSpace(user.FullName) ? user.UserName ?? user.Id : user.FullName,
        AvatarUrl = user.AvatarUrl,
        Color = ColorFor(user.Id)
    };

    public static UserDto ToDto(this ApplicationUser user) => new()
    {
        Id = user.Id,
        Email = user.Email ?? string.Empty,
        UserName = user.UserName ?? string.Empty,
        FirstName = user.FirstName,
        LastName = user.LastName,
        FullName = user.FullName,
        AvatarUrl = user.AvatarUrl,
        JobTitle = user.JobTitle,
        DisplayName = string.IsNullOrWhiteSpace(user.FullName) ? user.UserName ?? user.Id : user.FullName,
        CreatedAt = user.CreatedAt
    };

    public static ElementDto ToDto(this DesignElement e) => new()
    {
        Id = e.Id,
        Type = e.Type,
        Name = e.Name,
        X = e.X,
        Y = e.Y,
        Width = e.Width,
        Height = e.Height,
        Rotation = e.Rotation,
        Opacity = e.Opacity,
        Fill = e.Fill,
        Stroke = e.Stroke,
        StrokeWidth = e.StrokeWidth,
        CornerRadius = e.CornerRadius,
        Text = e.Text,
        FontFamily = e.FontFamily,
        FontSize = e.FontSize,
        FontWeight = e.FontWeight,
        TextAlign = e.TextAlign,
        LineHeight = e.LineHeight,
        Src = e.Src,
        Points = e.Points,
        ZIndex = e.ZIndex,
        IsVisible = e.IsVisible,
        IsLocked = e.IsLocked,
        ParentId = e.ParentId,
        LinkToDesignId = e.LinkToDesignId,
        UpdatedAt = e.UpdatedAt
    };

    public static void Apply(this DesignElement e, ElementDto d)
    {
        e.Type = d.Type;
        e.Name = d.Name;
        e.X = d.X;
        e.Y = d.Y;
        e.Width = d.Width;
        e.Height = d.Height;
        e.Rotation = d.Rotation;
        e.Opacity = d.Opacity;
        e.Fill = d.Fill;
        e.Stroke = d.Stroke;
        e.StrokeWidth = d.StrokeWidth;
        e.CornerRadius = d.CornerRadius;
        e.Text = d.Text;
        e.FontFamily = d.FontFamily;
        e.FontSize = d.FontSize;
        e.FontWeight = d.FontWeight;
        e.TextAlign = d.TextAlign;
        e.LineHeight = d.LineHeight;
        e.Src = d.Src;
        e.Points = d.Points;
        e.ZIndex = d.ZIndex;
        e.IsVisible = d.IsVisible;
        e.IsLocked = d.IsLocked;
        e.ParentId = d.ParentId;
        e.LinkToDesignId = d.LinkToDesignId;
    }

    public static void Patch(this DesignElement e, UpdateElementRequest d)
    {
        if (d.Name is not null) e.Name = d.Name;
        if (d.X is not null) e.X = d.X.Value;
        if (d.Y is not null) e.Y = d.Y.Value;
        if (d.Width is not null) e.Width = d.Width.Value;
        if (d.Height is not null) e.Height = d.Height.Value;
        if (d.Rotation is not null) e.Rotation = d.Rotation.Value;
        if (d.Opacity is not null) e.Opacity = d.Opacity.Value;
        if (d.Fill is not null) e.Fill = d.Fill;
        if (d.Stroke is not null) e.Stroke = d.Stroke;
        if (d.StrokeWidth is not null) e.StrokeWidth = d.StrokeWidth.Value;
        if (d.CornerRadius is not null) e.CornerRadius = d.CornerRadius.Value;
        if (d.Text is not null) e.Text = d.Text;
        if (d.FontFamily is not null) e.FontFamily = d.FontFamily;
        if (d.FontSize is not null) e.FontSize = d.FontSize.Value;
        if (d.FontWeight is not null) e.FontWeight = d.FontWeight.Value;
        if (d.TextAlign is not null) e.TextAlign = d.TextAlign.Value;
        if (d.LineHeight is not null) e.LineHeight = d.LineHeight.Value;
        if (d.Src is not null) e.Src = d.Src;
        if (d.Points is not null) e.Points = d.Points;
        if (d.ZIndex is not null) e.ZIndex = d.ZIndex.Value;
        if (d.IsVisible is not null) e.IsVisible = d.IsVisible.Value;
        if (d.IsLocked is not null) e.IsLocked = d.IsLocked.Value;
        if (d.ParentId is not null) e.ParentId = d.ParentId;
        e.LinkToDesignId = d.LinkToDesignId;
    }

    public static string RelativeTime(DateTime utc)
    {
        var span = DateTime.UtcNow - utc;
        if (span.TotalSeconds < 60) return "just now";
        if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes} minute{((int)span.TotalMinutes == 1 ? "" : "s")} ago";
        if (span.TotalHours < 24) return $"{(int)span.TotalHours} hour{((int)span.TotalHours == 1 ? "" : "s")} ago";
        if (span.TotalDays < 7) return $"{(int)span.TotalDays} day{((int)span.TotalDays == 1 ? "" : "s")} ago";
        if (span.TotalDays < 30) return $"{(int)(span.TotalDays / 7)} week{((int)(span.TotalDays / 7) == 1 ? "" : "s")} ago";
        return utc.ToLocalTime().ToString("MMM d, yyyy");
    }
}
