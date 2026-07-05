using System;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CoursesController : ControllerBase
    {
        private readonly ICourseService _service;
        public CoursesController(ICourseService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int limit = 10) => Ok(await _service.GetCoursesFullDetailsAsync(page, limit));

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] Course course) => Ok(await _service.CreateCourseAsync(course));

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(int page = 1, int limit = 10) => Ok(await _service.GetCoursesSummaryAsync(page, limit));

        [HttpGet("getById/{id}")]
        public async Task<IActionResult> GetById(Guid id) => Ok(await _service.GetCourseByIdAsync(id));

        [HttpGet("deliveryMode/{mode}")]
        public async Task<IActionResult> GetByMode(string mode, int page = 1, int limit = 10) => Ok(await _service.GetByDeliveryModeAsync(mode, page, limit));

        [HttpPatch("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Course course) => Ok(await _service.UpdateCourseAsync(id, course));

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(Guid id) => Ok(await _service.DeleteCourseAsync(id));
    }
}
