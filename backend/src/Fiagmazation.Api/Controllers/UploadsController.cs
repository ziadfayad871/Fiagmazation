using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Fiagmazation.Api.Controllers;

[Authorize]
[EnableRateLimiting("upload")]
public class UploadsController : ApiControllerBase
{
    private const long MaxBytes = 5 * 1024 * 1024;

    private static readonly Dictionary<string, string> Extensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/png"] = ".png",
        ["image/jpeg"] = ".jpg",
        ["image/webp"] = ".webp",
        ["image/gif"] = ".gif",
    };

    private readonly IWebHostEnvironment _env;

    public UploadsController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpPost("images")]
    [RequestSizeLimit(MaxBytes)]
    public async Task<IActionResult> UploadImage(IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Choose an image file to upload." });
        if (file.Length > MaxBytes)
            return BadRequest(new { message = "Images must be 5 MB or smaller." });
        if (!Extensions.TryGetValue(file.ContentType, out var extension))
            return BadRequest(new { message = "Only PNG, JPEG, WEBP or GIF images are supported." });

        await using var input = file.OpenReadStream();
        var header = new byte[12];
        var headerRead = 0;
        while (headerRead < header.Length)
        {
            var read = await input.ReadAsync(header.AsMemory(headerRead, header.Length - headerRead), ct);
            if (read == 0) break;
            headerRead += read;
        }
        if (!HasValidSignature(header[..headerRead], file.ContentType))
            return BadRequest(new { message = "That file does not look like a valid image." });

        var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);
        var fileName = $"{Guid.NewGuid():N}{extension}";
        await using (var output = new FileStream(Path.Combine(uploadsDir, fileName),
            FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true))
        {
            await output.WriteAsync(header.AsMemory(0, headerRead), ct);
            await input.CopyToAsync(output, ct);
        }

        var safeName = Path.GetFileName(file.FileName);
        if (safeName.Length > 120) safeName = safeName[..120];

        return Ok(new { url = $"/uploads/{fileName}", name = safeName, size = file.Length });
    }

    private static bool HasValidSignature(byte[] header, string contentType)
    {
        if (header.Length < 12) return false;
        switch (contentType.ToLowerInvariant())
        {
            case "image/png":
                return header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47;
            case "image/jpeg":
                return header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;
            case "image/gif":
                return header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x38;
            case "image/webp":
                return header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
                    && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50;
            default:
                return false;
        }
    }
}
