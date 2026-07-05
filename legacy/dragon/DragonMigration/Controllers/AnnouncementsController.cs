using System;
using System.Threading.Tasks;
using Dragon.Models;
using Dragon.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dragon.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnnouncementsController : ControllerBase
    {
        private readonly IAnnouncementService _service;
        public AnnouncementsController(IAnnouncementService service) => _service = service;

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] Announcement ann)
        {
            try { return Ok(await _service.CreateAnnouncementAsync(ann)); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            try { return Ok(await _service.GetAnnouncementAsync(id)); }
            catch (Exception ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int limit = 10)
        {
            try { return Ok(await _service.GetAllAnnouncementsAsync(page, limit)); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Announcement ann)
        {
            try { return Ok(await _service.UpdateAnnouncementAsync(id, ann)); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try { return Ok(await _service.DeleteAnnouncementAsync(id)); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }
    }
}
