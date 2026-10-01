using Fiagmazation.Domain.Entities;
using Fiagmazation.Domain.Enums;
using Fiagmazation.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Fiagmazation.Infrastructure;

public class DbSeeder
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _users;
    private readonly IConfiguration _config;
    private readonly ILogger<DbSeeder> _logger;

    public DbSeeder(AppDbContext db, UserManager<ApplicationUser> users, IConfiguration config, ILogger<DbSeeder> logger)
    {
        _db = db;
        _users = users;
        _config = config;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        await _db.Database.MigrateAsync();

        if (!bool.TryParse(_config["Seed:Enabled"], out var enabled) || !enabled) return;

        var email = _config["Seed:DemoUser:Email"] ?? "mohamed@fiagmazation.dev";
        if (await _users.Users.AnyAsync(u => u.Email == email)) return;

        var user = new ApplicationUser
        {
            FirstName = "Mohamed",
            LastName = "Hassan",
            Email = email,
            UserName = "mohamed",
            EmailConfirmed = true,
            JobTitle = "Product Designer",
            CreatedAt = DateTime.UtcNow
        };

        var password = _config["Seed:DemoUser:Password"] ?? "Password123!";
        var result = await _users.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            _logger.LogWarning("Demo seed user could not be created: {Errors}",
                string.Join(", ", result.Errors.Select(e => e.Description)));
            return;
        }

        var rooms = new (string Name, string Desc, string Color, (ElementType Type, double X, double Y, double W, double H, string Fill)[] Shapes)[]
        {
            ("Website Redesign", "Marketing site refresh for Q4.", "#2563EB",
            [
                (ElementType.Rectangle, 120, 140, 320, 220, "#2563EB"),
                (ElementType.Ellipse, 520, 180, 200, 200, "#F97316"),
                (ElementType.Rectangle, 780, 160, 260, 300, "#7C3AED"),
                (ElementType.Text, 120, 420, 520, 80, "#0F172A")
            ]),
            ("Mobile App UI", "iOS + Android component library.", "#F97316",
            [
                (ElementType.Rectangle, 160, 120, 300, 560, "#0F172A"),
                (ElementType.Rectangle, 520, 160, 240, 240, "#EC4899"),
                (ElementType.Ellipse, 560, 460, 160, 160, "#10B981")
            ]),
            ("Brand Project", "Logo explorations and colour system.", "#7C3AED",
            [
                (ElementType.Ellipse, 200, 200, 260, 260, "#7C3AED"),
                (ElementType.Rectangle, 520, 220, 300, 180, "#F97316"),
                (ElementType.Line, 200, 540, 600, 0, "#0F172A")
            ]),
            ("Personal Designs", "Side project scratch pad.", "#10B981",
            [
                (ElementType.Rectangle, 180, 180, 220, 220, "#0EA5E9"),
                (ElementType.Ellipse, 460, 220, 180, 180, "#EF4444")
            ])
        };

        var index = 0;
        foreach (var (name, desc, color, shapes) in rooms)
        {
            index++;
            var room = new Room
            {
                Name = name,
                Description = desc,
                AccentColor = color,
                OwnerId = user.Id,
                CreatedAt = DateTime.UtcNow.AddHours(-index * 7),
                UpdatedAt = DateTime.UtcNow.AddHours(-index * 3)
            };
            room.Members.Add(new RoomMember { RoomId = room.Id, UserId = user.Id, Role = RoomRole.Owner });

            var design = new Design
            {
                RoomId = room.Id,
                Name = "Design 1",
                Width = 1440,
                Height = 900,
                BackgroundColor = "#FFFFFF",
                UpdatedAt = room.UpdatedAt
            };

            var z = 0;
            foreach (var shape in shapes)
            {
                design.Elements.Add(new DesignElement
                {
                    Type = shape.Type,
                    Name = shape.Type.ToString(),
                    X = shape.X, Y = shape.Y,
                    Width = shape.W, Height = shape.H,
                    Fill = shape.Type == ElementType.Line ? null : shape.Fill,
                    Stroke = shape.Type == ElementType.Line ? shape.Fill : null,
                    StrokeWidth = shape.Type == ElementType.Line ? 3 : 1,
                    Text = shape.Type == ElementType.Text ? "Design Together, Create More." : null,
                    FontSize = shape.Type == ElementType.Text ? 40 : 24,
                    FontWeight = shape.Type == ElementType.Text ? FontWeight.Bold : FontWeight.Regular,
                    ZIndex = z++,
                    Opacity = 1,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            design.UpdatedById = user.Id;
            room.Designs.Add(design);
            _db.Rooms.Add(room);
        }

        _db.Notifications.Add(new Notification
        {
            UserId = user.Id,
            Type = NotificationType.System,
            Title = "Welcome to Fiagmazation",
            Body = "Invite teammates from the Share dialog inside any room.",
            LinkUrl = "/dashboard",
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("Seeded demo user {Email} with {Count} rooms.", email, rooms.Length);
    }
}
