using System.Threading.Tasks;
using Dragon.Services;
using Microsoft.AspNetCore.Mvc;

namespace Dragon.Controllers
{
    [ApiController]
    [Route("api")]
    public class PublicController : ControllerBase
    {
        private readonly IPublicService _publicService;

        public PublicController(IPublicService publicService)
        {
            _publicService = publicService;
        }

        [HttpGet("announcements")]
        public async Task<IActionResult> GetAnnouncements(int page = 1, int limit = 10)
        {
            return Ok(await _publicService.GetAnnouncementsAsync(page, limit));
        }

        [HttpGet("courses/summary")]
        public async Task<IActionResult> GetCourseSummary(int page = 1, int limit = 10)
        {
            return Ok(await _publicService.GetCourseSummaryAsync(page, limit));
        }

        [HttpGet("advertisements")]
        public async Task<IActionResult> GetAdvertisements(int page = 1, int limit = 10)
        {
            return Ok(await _publicService.GetAdvertisementsAsync(page, limit));
        }

        [HttpPost("analytics/visits")]
        public async Task<IActionResult> RecordVisit([FromBody] VisitRequest request)
        {
            await _publicService.RecordVisitAsync(request.IsNewVisitor, request.Source);
            return Ok(new { message = "Analytics Captured" });
        }
    }

    public class VisitRequest
    {
        public bool IsNewVisitor { get; set; }
        public string Source { get; set; }
    }
}
