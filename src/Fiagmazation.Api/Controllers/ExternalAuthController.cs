using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Fiagmazation.Application.Common;
using Fiagmazation.Application.Dtos.Auth;
using Fiagmazation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fiagmazation.Api.Controllers;

/// <summary>
/// Standard OAuth 2.0 authorization-code endpoints for Google, GitHub and Microsoft.
/// Providers are only usable once ClientId/ClientSecret are supplied through configuration.
/// </summary>
[AllowAnonymous]
[Route("api/auth/external")]
public class ExternalAuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpFactory;

    public ExternalAuthController(IAuthService auth, IConfiguration config, IHttpClientFactory httpFactory)
    {
        _auth = auth;
        _config = config;
        _httpFactory = httpFactory;
    }

    private sealed record ProviderEndpoints(string Authorize, string Token, string UserInfo, string Scope);

    private static ProviderEndpoints? EndpointsFor(string provider) => provider.ToLowerInvariant() switch
    {
        "google" => new ProviderEndpoints(
            "https://accounts.google.com/o/oauth2/v2/auth",
            "https://oauth2.googleapis.com/token",
            "https://openidconnect.googleapis.com/v1/userinfo",
            "openid email profile"),
        "github" => new ProviderEndpoints(
            "https://github.com/login/oauth/authorize",
            "https://github.com/login/oauth/access_token",
            "https://api.github.com/user",
            "read:user user:email"),
        "microsoft" => new ProviderEndpoints(
            "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            "https://graph.microsoft.com/oidc/userinfo",
            "openid email profile offline_access User.Read"),
        _ => null
    };

    private string FrontendUrl
    {
        get
        {
            var configured = _config["Frontend:Url"];
            if (!string.IsNullOrWhiteSpace(configured)) return configured.TrimEnd('/');
            var origins = _config["Cors:Origins"] ?? "http://localhost:3000";
            return origins.Split(',')[0].Trim().TrimEnd('/');
        }
    }

    [HttpGet("{provider}")]
    public IActionResult Authorize(string provider)
    {
        var endpoints = EndpointsFor(provider);
        if (endpoints is null) return BadRequest(new { title = "Unknown provider.", code = "unknown_provider" });

        var clientId = _config[$"OAuth:{provider}:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
            return BadRequest(new
            {
                title = $"{provider} sign-in is not configured. Add OAuth:{provider}:ClientId to appsettings.json.",
                code = "provider_not_configured"
            });

        var redirectUri = _config[$"OAuth:{provider}:RedirectUri"];
        if (string.IsNullOrWhiteSpace(redirectUri))
            redirectUri = $"{Request.Scheme}://{Request.Host}/api/auth/external/{provider.ToLowerInvariant()}/callback";

        var state = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("+", "-").Replace("/", "_").Replace("=", string.Empty);

        Response.Cookies.Append("fiag_oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            IsEssential = true,
            Expires = DateTimeOffset.UtcNow.AddMinutes(10),
            Secure = Request.IsHttps
        });

        var url = new StringBuilder(endpoints.Authorize)
            .Append("?response_type=code")
            .Append("&client_id=").Append(Uri.EscapeDataString(clientId))
            .Append("&redirect_uri=").Append(Uri.EscapeDataString(redirectUri))
            .Append("&scope=").Append(Uri.EscapeDataString(endpoints.Scope))
            .Append("&state=").Append(state);

        if (provider.Equals("google", StringComparison.OrdinalIgnoreCase))
            url.Append("&access_type=offline&prompt=select_account");

        return Redirect(url.ToString());
    }

    [HttpGet("{provider}/callback")]
    public async Task<IActionResult> Callback(string provider, [FromQuery] string? code, [FromQuery] string? state,
        [FromQuery] string? error, CancellationToken ct)
    {
        var endpoints = EndpointsFor(provider);
        if (endpoints is null) return RedirectWithError("unknown_provider", "Unknown provider.");

        if (!string.IsNullOrWhiteSpace(error))
            return RedirectWithError("provider_error", error);

        var expected = Request.Cookies["fiag_oauth_state"];
        if (string.IsNullOrWhiteSpace(state) || state != expected)
            return RedirectWithError("invalid_state", "The sign-in state could not be verified.");

        Response.Cookies.Delete("fiag_oauth_state");

        if (string.IsNullOrWhiteSpace(code))
            return RedirectWithError("missing_code", "The provider did not return an authorisation code.");

        var clientId = _config[$"OAuth:{provider}:ClientId"];
        var clientSecret = _config[$"OAuth:{provider}:ClientSecret"];
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
            return RedirectWithError("provider_not_configured", $"{provider} is not configured.");

        var redirectUri = _config[$"OAuth:{provider}:RedirectUri"];
        if (string.IsNullOrWhiteSpace(redirectUri))
            redirectUri = $"{Request.Scheme}://{Request.Host}/api/auth/external/{provider.ToLowerInvariant()}/callback";

        var client = _httpFactory.CreateClient();
        using var tokenRequest = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code!,
            ["redirect_uri"] = redirectUri,
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret
        });
        var tokenResponse = await client.PostAsync(endpoints.Token, tokenRequest, ct);
        var tokenBody = await tokenResponse.Content.ReadAsStringAsync(ct);
        if (!tokenResponse.IsSuccessStatusCode)
            return RedirectWithError("token_exchange_failed", "Could not exchange the authorisation code.");

        using var tokenDoc = JsonDocument.Parse(tokenBody);
        if (!tokenDoc.RootElement.TryGetProperty("access_token", out var accessTokenElement))
            return RedirectWithError("token_exchange_failed", "The provider did not return an access token.");
        var accessToken = accessTokenElement.GetString();

        using var profileRequest = new HttpRequestMessage(HttpMethod.Get, endpoints.UserInfo);
        profileRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        profileRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        if (provider.Equals("github", StringComparison.OrdinalIgnoreCase))
            profileRequest.Headers.UserAgent.ParseAdd("Fiagmazation");

        var profileResponse = await client.SendAsync(profileRequest, ct);
        if (!profileResponse.IsSuccessStatusCode)
            return RedirectWithError("profile_failed", "Could not read the provider profile.");

        using var profile = JsonDocument.Parse(await profileResponse.Content.ReadAsStringAsync(ct));
        var root = profile.RootElement;

        var email = ReadString(root, "email") ?? ReadString(root, "preferred_username") + "@users.noreply.github.com";
        var userName = ReadString(root, "preferred_username") ?? ReadString(root, "login") ?? email.Split('@')[0];
        var firstName = ReadString(root, "given_name") ?? ReadString(root, "first_name")
            ?? (ReadString(root, "name")?.Split(' ')[0]) ?? userName;
        var lastName = ReadString(root, "family_name") ?? ReadString(root, "last_name")
            ?? (ReadString(root, "name") is { } full && full.Contains(' ') ? full[(full.IndexOf(' ') + 1)..] : string.Empty);
        var avatar = ReadString(root, "avatar_url") ?? ReadString(root, "picture");

        if (string.IsNullOrWhiteSpace(email))
            return RedirectWithError("no_email", "The provider did not return an email address.");

        AuthResponse response;
        try
        {
            response = await _auth.SignInExternalAsync(provider, email, userName, firstName, lastName, avatar,
                HttpContext.Connection.RemoteIpAddress?.ToString(), ct);
        }
        catch (AppException ex)
        {
            return RedirectWithError(ex.Code, ex.Message);
        }

        var hash = "#access_token=" + Uri.EscapeDataString(response.AccessToken)
                   + "&refresh_token=" + Uri.EscapeDataString(response.RefreshToken)
                   + "&expires_at=" + Uri.EscapeDataString(response.ExpiresAt.ToString("o"));
        return Redirect($"{FrontendUrl}/auth/callback{hash}");
    }

    private IActionResult RedirectWithError(string code, string message) =>
        Redirect($"{FrontendUrl}/auth/callback#error={Uri.EscapeDataString(code)}&message={Uri.EscapeDataString(message)}");

    private static string? ReadString(JsonElement element, string name) =>
        element.ValueKind == JsonValueKind.Object &&
        element.TryGetProperty(name, out var value) &&
        value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
}
