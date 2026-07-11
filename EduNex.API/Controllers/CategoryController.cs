using EduNex.Api.Filters;
using EduNex.Models;
using EduNex.Models.Dtos;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.Api.Controllers
{
    [ApiController]
    [Route("api/categories")]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoryController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiListResponse<CategoryDto>), 200)]
        public async Task<IActionResult> List([FromQuery] int? page, [FromQuery] int? limit)
        {
            var (data, meta) = await _categoryService.ListAsync(page, limit);
            return Ok(new ApiListResponse<Category> { Data = data, Meta = (PaginationMeta?)meta });
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiDataResponse<Category>), 200)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var category = await _categoryService.GetByIdAsync(id);
            return Ok(new ApiDataResponse<Category> { Data = category });
        }

        [HttpPost]
        [Authorize]
        // [ServiceFilter(typeof(AdminRoleFilter))] // Assuming AdminRoleFilter exists
        [ProducesResponseType(typeof(ApiDataResponse<Category>), 201)]
        public async Task<IActionResult> Create([FromBody] CreateCategoryDto request)
        {
            var category = await _categoryService.CreateAsync(request);
            return StatusCode(201, new ApiDataResponse<Category> { Data = category });
        }

        [HttpPatch("{id}")]
        [Authorize]
        // [ServiceFilter(typeof(AdminRoleFilter))]
        [ProducesResponseType(typeof(ApiDataResponse<Category>), 200)]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryDto request)
        {
            var category = await _categoryService.UpdateAsync(id, request);
            return Ok(new ApiDataResponse<Category> { Data = category });
        }

        [HttpDelete("{id}")]
        [Authorize]
        // [ServiceFilter(typeof(AdminRoleFilter))]
        [ProducesResponseType(204)]
        public async Task<IActionResult> Remove(Guid id)
        {
            await _categoryService.DeleteAsync(id);
            return NoContent();
        }
    }
}
