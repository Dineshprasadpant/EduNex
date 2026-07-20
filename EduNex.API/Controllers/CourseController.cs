using EduNex.Api.Filters;
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
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

        private Guid GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (claim is null || !Guid.TryParse(claim, out var userId))
                throw new UnauthorizedAccessException("Invalid or expired token");
            return userId;
        }

        // Public: active courses only, trending first. Never exposes Information.
        [HttpGet]
        [ProducesResponseType(typeof(ApiListResponse<CourseListDto>), 200)]
        public async Task<IActionResult> List([FromQuery] ListCoursesQueryDto query)
        {
            var (data, meta) = await _courseService.ListCoursesAsync(query);
            return Ok(new ApiListResponse<CourseListDto> { Data = data, Meta = meta });
        }

        [HttpGet("slug/{slug}")]
        [ProducesResponseType(typeof(ApiDataResponse<CourseListDto>), 200)]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var course = await _courseService.GetCourseBySlugAsync(slug);
            return Ok(new ApiDataResponse<CourseListDto> { Data = course });
        }

        // The logged-in student's own enrolled course, including Information.
        [HttpGet("me")]
        [Authorize]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(typeof(ApiDataResponse<CourseDetailDto?>), 200)]
        public async Task<IActionResult> GetMyCourse()
        {
            var course = await _courseService.GetMyCourseAsync(GetUserId());
            return Ok(new ApiDataResponse<CourseDetailDto?> { Data = course });
        }

        // Public: record a page view (dedupe handled client-side).
        [HttpPost("{id:guid}/view")]
        [ProducesResponseType(typeof(ApiDataResponse<ViewResultDto>), 200)]
        public async Task<IActionResult> RecordView(Guid id)
        {
            var result = await _courseService.RecordViewAsync(id);
            return Ok(new ApiDataResponse<ViewResultDto> { Data = result });
        }

        // Admin analytics: courses ranked by view count.
        [HttpGet("admin/views")]
        [Authorize(Roles = "admin")]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(typeof(ApiDataResponse<List<TopViewedCourseDto>>), 200)]
        public async Task<IActionResult> TopViewed([FromQuery] int? limit)
        {
            var effectiveLimit = Math.Min(limit ?? 10, 50);
            var data = await _courseService.GetTopViewedAsync(effectiveLimit);
            return Ok(new ApiDataResponse<List<TopViewedCourseDto>> { Data = data });
        }

        [HttpGet("admin/all")]
        [Authorize(Roles = "admin")]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(typeof(ApiListResponse<CourseListDto>), 200)]
        public async Task<IActionResult> ListAll([FromQuery] ListCoursesQueryDto query)
        {
            var (data, meta) = await _courseService.ListAllCoursesAsync(query);
            return Ok(new ApiListResponse<CourseListDto> { Data = data, Meta = meta });
        }

        [HttpGet("{id:guid}")]
        [Authorize(Roles ="admin")]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(typeof(ApiDataResponse<CourseDetailDto>), 200)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var course = await _courseService.GetCourseByIdAsync(id);
            return Ok(new ApiDataResponse<CourseDetailDto> { Data = course });
        }

        [HttpPost]
        [Authorize(Roles ="admin")]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(typeof(ApiDataResponse<Course>), 201)]
        public async Task<IActionResult> Create([FromBody] CreateCourseRequestDto request)
        {
            var course = await _courseService.CreateCourseAsync(request);
            return StatusCode(201, new ApiDataResponse<Course> { Data = course });
        }

        [HttpPatch("{id:guid}")]
        [Authorize(Roles ="admin")]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(typeof(ApiDataResponse<Course>), 200)]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCourseRequestDto request)
        {
            var course = await _courseService.UpdateCourseAsync(id, request);
            return Ok(new ApiDataResponse<Course> { Data = course });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles ="admin")]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(204)]
        public async Task<IActionResult> Remove(Guid id)
        {
            await _courseService.DeleteCourseAsync(id);
            return NoContent();
        }
    }
}