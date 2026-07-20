using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/media")]
    [Authorize(Roles = "admin")]
    public class MediaController : ControllerBase
    {
        private readonly IMediaService _service;
        public MediaController(IMediaService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] int page = 1, [FromQuery] int limit = 20,
            [FromQuery] string? search = null, [FromQuery] string? mimeType = null)
        {
            var (data, meta) = await _service.ListMediaAsync(page, limit, search, mimeType);
            return Ok(new { data, meta = new { meta.Page, meta.Limit, meta.Total, meta.TotalPages } });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var item = await _service.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Media not found" });
            return Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateMediaRequest request)
        {
            var userId = GetUserId(); // see extension below
            var item = await _service.CreateMediaAsync(request, userId);
            return Created(string.Empty, item);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Remove(Guid id)
        {
            var deleted = await _service.DeleteMediaAsync(id);
            if (!deleted) return NotFound(new { message = "Media not found" });
            return NoContent();
        }
        private Guid GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (claim is null || !Guid.TryParse(claim, out var userId))
                throw new UnauthorizedAccessException("Invalid or expired token");
            return userId;
        }
    }
}