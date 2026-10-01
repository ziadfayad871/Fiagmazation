using Fiagmazation.Application.Interfaces;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Fiagmazation.Infrastructure.Services;

public class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;
    private readonly IHostEnvironment _environment;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger, IHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
    }

    public Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        if (_environment.IsDevelopment())
            _logger.LogInformation("Outgoing email\n  To: {To}\n  Subject: {Subject}\n  Body: {Body}",
                to, subject, htmlBody);
        else
            _logger.LogInformation("Outgoing email sent to {To} with subject {Subject}", to, subject);
        return Task.CompletedTask;
    }
}
