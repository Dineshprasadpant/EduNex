using System;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/events")]
    public class EventController : ControllerBase
    {
        private readonly IEventService _service;
        public EventController(IEventService service) => _service = service;

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] Event @event)
        {
            try { return StatusCode(201, await _service.CreateEventAsync(@event)); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            try { 
                var ev = await _service.GetEventAsync(id);
                if (ev == null) return NotFound(new { message = "Event not found" });
                return Ok(ev);
            }
            catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpGet("get/byMonthAndYear")]
        public async Task<IActionResult> GetByMonthAndYear([FromQuery] string month, [FromQuery] string year)
        {
            try { return Ok(await _service.GetByMonthAndYearAsync(month, year)); }
            catch (Exception ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int limit = 10)
        {
            try { return Ok(await _service.GetAllEventsAsync(page, limit)); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Event @event)
        {
            try { return Ok(await _service.UpdateEventAsync(id, @event)); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try { return Ok(await _service.DeleteEventAsync(id)); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }
    }
}
