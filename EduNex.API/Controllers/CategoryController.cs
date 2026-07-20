using EduNex.Api.Filters;
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
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
        [ProducesResponseType(typeof(ApiListResponse<Category>), 200)]
        public async Task<IActionResult> List([FromQuery] ListCategoriesQueryDto query)
        {
            var (data, meta) = await _categoryService.ListAsync(query.Page, query.Limit);
            return Ok(new ApiListResponse<Category> { Data = data, Meta = meta });
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(ApiDataResponse<Category>), 200)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var category = await _categoryService.GetByIdAsync(id);
            return Ok(new ApiDataResponse<Category> { Data = category });
        }

        [HttpPost]
        //[Authorize(Roles ="admin")]
        //[ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(typeof(ApiDataResponse<Category>), 201)]
        public async Task<IActionResult> Create([FromBody] CreateCategoryRequestDto request)
        {
            var category = await _categoryService.CreateAsync(request);
            return StatusCode(201, new ApiDataResponse<Category> { Data = category });
        }

        [HttpPatch("{id:guid}")]
        [Authorize(Roles ="admin")]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(typeof(ApiDataResponse<Category>), 200)]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryRequestDto request)
        {
            var category = await _categoryService.UpdateAsync(id, request);
            return Ok(new ApiDataResponse<Category> { Data = category });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles ="admin")]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(204)]
        public async Task<IActionResult> Remove(Guid id)
        {
            await _categoryService.RemoveAsync(id);
            return NoContent();
        }
    }
}