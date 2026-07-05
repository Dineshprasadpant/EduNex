using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/feedbacks")]
    public class FeedbackController : ControllerBase
    {
        private readonly IFeedbackService _service;
        public FeedbackController(IFeedbackService service) => _service = service;

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Feedback feedback)
        {
            try { return StatusCode(201, await _service.CreateFeedbackAsync(feedback)); }
            catch (Exception ex) { return BadRequest(new { status = "error", message = ex.Message }); }
        }

        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAll(int page = 1, int limit = 10)
        {
            try
            {
                var result = await _service.GetFeedbacksAsync(page, limit);
                return Ok(new { status = "success", data = result.Data, pagination = result.Pagination });
            }
            catch (Exception ex) { return StatusCode(500, new { status = "error", message = ex.Message }); }
        }

        [HttpGet("positive")]
        public async Task<IActionResult> GetPositive(int page = 1, int limit = 10)
        {
            try
            {
                var result = await _service.GetPositiveFeedbacksAsync(page, limit);
                return Ok(new { status = "success", data = result.Data, pagination = result.Pagination });
            }
            catch (Exception ex) { return StatusCode(500, new { status = "error", message = ex.Message }); }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try { return Ok(await _service.DeleteFeedbackAsync(id)); }
            catch (Exception ex)
            {
                int statusCode = ex.Message == "Feedback not found" ? 404 : 400;
                return StatusCode(statusCode, new { success = false, message = ex.Message });
            }
        }
    }
}