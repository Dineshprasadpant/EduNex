using System;
using System.Threading.Tasks;
using Dragon.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dragon.Controllers
{
    [ApiController]
    [Route("api/analytics")]
    public class UserAnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _service;
        public UserAnalyticsController(IAnalyticsService service) => _service = service;

        [HttpPost("visits")]
        public async Task<IActionResult> RecordVisit([FromBody] VisitRequest request)
        {
            try { await _service.TrackVisitAsync(request.IsNewVisitor, request.Source); return Ok(new { message = "Analytics Captured" }); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpPost("subscribers")]
        public async Task<IActionResult> RecordSubscriber()
        {
            try { await _service.TrackSubscriberAsync(); return Ok(new { message = "Subscriber Recorded Sucessfully" }); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpGet("monthly")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetMonthly(int month, int year) => Ok(await _service.FetchMonthlyDataAsync(month, year));

        [HttpGet("yearly")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetYearly(int year) => Ok(await _service.FetchYearlyDataAsync(year));

        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAll() => Ok(await _service.FetchAllDataAsync());
    }

    public class VisitRequest { public bool IsNewVisitor { get; set; } public string Source { get; set; } }
}
