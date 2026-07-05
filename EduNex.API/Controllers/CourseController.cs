// ===== Controllers/CourseController.cs =====
using System;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/courses")]
    public class CourseController : ControllerBase
    {
        private readonly ICourseService _service;
        public CourseController(ICourseService service) => _service = service;

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(int page = 1, int limit = 10)
        {
            try { return Ok(new { status = "success", data = await _service.GetCoursesSummaryAsync(page, limit) }); }
            catch (Exception ex) { return BadRequest(new { status = "error", message = ex.Message }); }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int limit = 9)
        {
            try { return Ok(new { status = "success", data = await _service.GetCoursesFullDetailsAsync(page, limit) }); }
            catch (Exception ex) { return BadRequest(new { status = "error", message = ex.Message }); }
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] Course course)
        {
            try { return Ok(await _service.CreateCourseAsync(course)); }
            catch (Exception ex) { return BadRequest(new { status = "error", message = ex.Message }); }
        }

        [HttpGet("getById/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try { return Ok(await _service.GetCourseByIdAsync(id)); }
            catch (Exception ex) { return NotFound(new { status = "error", message = ex.Message }); }
        }

        [HttpGet("deliveryMode/{mode}")]
        public async Task<IActionResult> GetByMode(string mode, int page = 1, int limit = 10)
        {
            try { return Ok(new { status = "success", data = await _service.GetByDeliveryModeAsync(mode, page, limit) }); }
            catch (Exception ex) { return NotFound(new { status = "error", message = ex.Message }); }
        }

        [HttpPatch("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Course course)
        {
            try { return Ok(await _service.UpdateCourseAsync(id, course)); }
            catch (Exception ex) { return BadRequest(new { status = "error", message = ex.Message }); }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try { return Ok(await _service.DeleteCourseAsync(id)); }
            catch (Exception ex) { return BadRequest(new { status = "error", message = ex.Message }); }
        }
    }
}