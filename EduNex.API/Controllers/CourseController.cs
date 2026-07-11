using EduNex.Models;
using EduNex.Models.Dtos;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/courses")]
    public class CourseController : ControllerBase
    {
        private readonly ICourseService _courseService;

        public CourseController(ICourseService courseService)
        {
            _courseService = courseService;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int limit = 20, [FromQuery] bool? isActive = true)
        {
            var (data, meta) = await _courseService.ListAsync(page, limit, isActive);
            return Ok(new ApiListResponse<CourseDto> { Data = data, Meta = (PaginationMeta?)meta });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var course = await _courseService.GetByIdAsync(id);
            return Ok(new ApiDataResponse<CourseDto> { Data = course });
        }

        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var course = await _courseService.GetBySlugAsync(slug);
            return Ok(new ApiDataResponse<CourseDto> { Data = course });
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] CreateCourseDto request)
        {
            var course = await _courseService.CreateAsync(request);
            return StatusCode(201, new ApiDataResponse<CourseDto> { Data = course });
        }

        [HttpPatch("{id:guid}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCourseDto request)
        {
            var course = await _courseService.UpdateAsync(id, request);
            return Ok(new ApiDataResponse<CourseDto> { Data = course });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Remove(Guid id)
        {
            await _courseService.DeleteAsync(id);
            return NoContent();
        }

        [HttpPost("{id:guid}/view")]
        public async Task<IActionResult> RecordView(Guid id)
        {
            var views = await _courseService.RecordViewAsync(id);
            return Ok(new { views });
        }
    }
}
