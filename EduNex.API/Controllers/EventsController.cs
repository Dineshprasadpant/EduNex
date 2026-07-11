using EduNex.Models;
using EduNex.Models.Dtos;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/events")]
    public class EventsController : ControllerBase
    {
        private readonly IEventService _service;
        public EventsController(IEventService service) => _service = service;

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] CreateEventDto request)
        {
            var ev = await _service.CreateAsync(request);
            return StatusCode(201, new ApiDataResponse<EventDto> { Data = ev });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var ev = await _service.GetByIdAsync(id);
            return Ok(new ApiDataResponse<EventDto> { Data = ev });
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 10, [FromQuery] string? privacy = null, [FromQuery] string? search = null)
        {
            var (data, meta) = await _service.ListAsync(page, limit, privacy, search);
            return Ok(new ApiListResponse<EventDto> { Data = data, Meta = (PaginationMeta?)meta });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEventDto request)
        {
            var ev = await _service.UpdateAsync(id, request);
            return Ok(new ApiDataResponse<EventDto> { Data = ev });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
