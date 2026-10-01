namespace Fiagmazation.Application.Common;

public class AppException : Exception
{
    public int StatusCode { get; }
    public string Code { get; }
    public IDictionary<string, string[]>? Errors { get; }

    public AppException(int statusCode, string code, string message,
        IDictionary<string, string[]>? errors = null) : base(message)
    {
        StatusCode = statusCode;
        Code = code;
        Errors = errors;
    }

    public static AppException NotFound(string message = "Resource not found.") =>
        new(404, "not_found", message);

    public static AppException BadRequest(string message, IDictionary<string, string[]>? errors = null) =>
        new(400, "bad_request", message, errors);

    public static AppException Forbidden(string message = "You do not have permission to do that.") =>
        new(403, "forbidden", message);

    public static AppException Unauthorized(string message = "Authentication required.") =>
        new(401, "unauthorized", message);

    public static AppException Conflict(string message) =>
        new(409, "conflict", message);
}
