using System.Text.Json;
using Fiagmazation.Application.Common;

namespace Fiagmazation.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException)
        {
            if (context.Response.HasStarted) throw;
            _logger.LogDebug("Request canceled for {Method} {Path}", context.Request.Method, context.Request.Path);
            context.Response.StatusCode = 499;
        }
        catch (AppException ex)
        {
            if (context.Response.HasStarted) throw;
            context.Response.StatusCode = ex.StatusCode;
            context.Response.ContentType = "application/problem+json";
            var payload = new
            {
                title = ex.Message,
                status = ex.StatusCode,
                code = ex.Code,
                errors = ex.Errors
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload, SerializerOptions));
        }
        catch (BadHttpRequestException ex)
        {
            if (context.Response.HasStarted) throw;
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                title = "The request payload was invalid.",
                status = 400,
                code = "bad_request",
                detail = ex.Message
            }, SerializerOptions));
        }
        catch (Exception ex)
        {
            if (context.Response.HasStarted) throw;
            _logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                title = "Something went wrong on our side.",
                status = 500,
                code = "server_error",
                detail = _env.IsDevelopment() ? ex.Message : null
            }, SerializerOptions));
        }
    }
}
