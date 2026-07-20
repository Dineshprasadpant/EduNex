using EduNex.Common;
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        private readonly IFeedbackService _service;
        private readonly ITurnstileVerifier _turnstile;

        public FeedbackController(IFeedbackService service, ITurnstileVerifier turnstile)
        {
            _service = service;
            _turnstile = turnstile;
        }

        // GET api/feedback/public
        [HttpGet("public")]
        [AllowAnonymous]
        public async Task<IActionResult> ListPublic()
        {
            var data = await _service.ListPublicFeedbackAsync();
            return Ok(new ApiDataResponse<List<Feedback>> { Data = data });
        }

        // POST api/feedback - public, gated by Turnstile instead of auth.
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Create([FromBody] CreateFeedbackRequest input)
        {
            var remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString();
            if (!await _turnstile.VerifyAsync(input.TurnstileToken, remoteIp))
                throw new ForbiddenException("Turnstile verification failed");

            var entry = await _service.CreateFeedbackAsync(input);
            return StatusCode(201, new ApiDataResponse<Feedback> { Data = entry });
        }

        [HttpGet("stats")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetStats()
        {
            var stats = await _service.GetStatsAsync();
            return Ok(new ApiDataResponse<FeedbackStatsDto> { Data = stats });
        }

        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> List([FromQuery] ListFeedbackQuery query)
        {
            var (data, total, page, limit) = await _service.ListFeedbackAsync(query);
            var meta = PaginationMeta.Create(total, page, limit);
            return Ok(new ApiListResponse<Feedback> { Data = data, Meta = meta });
        }

        [HttpPost("{id}/reply")]
        [Authorize(Roles ="admin")]
        public async Task<IActionResult> Reply(string id, [FromBody] ReplyFeedbackRequest input)
        {
            if (!Guid.TryParse(id, out Guid guid))
                return BadRequest("Invalid feedback ID");

            var entry = await _service.ReplyFeedbackAsync(guid, input.Reply);
            return Ok(new ApiDataResponse<Feedback> { Data = entry });
        }
        [HttpDelete("{id}")]
        [Authorize(Roles ="admin")]
        public async Task<IActionResult> Remove(string id)
        {
            await _service.DeleteFeedbackAsync(Guid.Parse(id));
            return NoContent();
        }
    }
}