using EduNex.Api.Filters;
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
    [Route("api/events")]
    public class EventController : ControllerBase
    {
        private readonly IEventService _eventService;

        public EventController(IEventService eventService)
        {
            _eventService = eventService;
        }

        private Guid? GetOptionalUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }

        private string? GetOptionalRole() => User.FindFirst(ClaimTypes.Role)?.Value;

        [HttpGet]
        [ProducesResponseType(typeof(ApiListResponse<EventDto>), 200)]
        public async Task<IActionResult> List([FromQuery] ListEventsQueryDto query)
        {
            var (data, meta) = await _eventService.ListAsync(query, GetOptionalUserId(), GetOptionalRole());
            return Ok(new ApiListResponse<EventDto> { Data = data, Meta = meta });
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(ApiDataResponse<EventDto>), 200)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var ev = await _eventService.GetByIdAsync(id, GetOptionalUserId(), GetOptionalRole());
            return Ok(new ApiDataResponse<EventDto> { Data = ev });
        }

        [HttpPost]
        [Authorize(Roles="admin")]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(typeof(ApiDataResponse<Event>), 201)]
        public async Task<IActionResult> Create([FromBody] CreateEventRequestDto request)
        {
            var ev = await _eventService.CreateAsync(request);
            return StatusCode(201, new ApiDataResponse<Event> { Data = ev });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles="admin")]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(typeof(ApiDataResponse<Event>), 200)]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEventRequestDto request)
        {
            var ev = await _eventService.UpdateAsync(id, request);
            return Ok(new ApiDataResponse<Event> { Data = ev });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles="admin")]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(204)]
        public async Task<IActionResult> Remove(Guid id)
        {
            await _eventService.RemoveAsync(id);
            return NoContent();
        }
    }
}