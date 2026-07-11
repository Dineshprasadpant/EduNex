using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EduNex.Common;
using EduNex.Models;
using EduNex.Services;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _service;

        public AnalyticsController(IAnalyticsService service)
        {
            _service = service;
        }

        // POST api/analytics/heartbeat - any authenticated user, no role
        // restriction (matches `authenticate` with no `requireRole`).
        [HttpPost("heartbeat")]
        [Authorize]
        public async Task<IActionResult> Heartbeat([FromBody] HeartbeatRequest input)
        {
            var userId = GetRequesterId();
            var (ipAddress, userAgent) = GetClientInfo();

            var result = await _service.HeartbeatAsync(userId, input.SessionToken, input.PagePath, ipAddress, userAgent);
            return Ok(new ApiDataResponse<OkResultDto> { Data = result });
        }

        // POST api/analytics/pageview - fully public, no auth at all.
        [HttpPost("pageview")]
        [AllowAnonymous]
        public async Task<IActionResult> RecordPageview([FromBody] PageviewRequest input)
        {
            var (ipAddress, _) = GetClientInfo();

            var result = await _service.RecordPageviewAsync(input.SessionToken, input.PagePath, input.UtmSource, ipAddress);
            return Ok(new ApiDataResponse<OkResultDto> { Data = result });
        }

        // GET api/analytics/active-now
        [HttpGet("active-now")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> GetActiveNow()
        {
            var result = await _service.GetActiveNowAsync();
            return Ok(new ApiDataResponse<ActiveNowDto> { Data = result });
        }

        // GET api/analytics/daily?from=&to=
        [HttpGet("daily")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> GetDailyStats([FromQuery] DailyStatsQuery query)
        {
            var result = await _service.GetDailyStatsAsync(query.From, query.To);
            return Ok(new ApiDataResponse<object> { Data = result });
        }

        // GET api/analytics/summary
        [HttpGet("summary")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> GetDashboardSummary()
        {
            var result = await _service.GetDashboardSummaryAsync();
            return Ok(new ApiDataResponse<DashboardSummaryDto> { Data = result });
        }

        // ---- Helpers -----------------------------------------------------

        private Guid GetRequesterId()
        {
            var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedException("Missing user identity claim");
            return Guid.Parse(value);
        }

        // Mirrors: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        //          ?? req.socket.remoteAddress
        private (string? IpAddress, string? UserAgent) GetClientInfo()
        {
            var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            var ipAddress = !string.IsNullOrEmpty(forwardedFor)
                ? forwardedFor.Split(',')[0].Trim()
                : HttpContext.Connection.RemoteIpAddress?.ToString();

            var userAgent = Request.Headers["User-Agent"].FirstOrDefault();

            return (ipAddress, userAgent);
        }
    }
}