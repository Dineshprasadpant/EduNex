using EduNex.Models;
using EduNex.Models.Dtos;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/class-materials")]
    public class ClassMaterialsController : ControllerBase
    {
        private readonly IClassMaterialService _service;

        public ClassMaterialsController(IClassMaterialService service) => _service = service;

        [HttpGet]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var (data, meta) = await _service.ListAsync(page, limit);
            return Ok(new ApiListResponse<ClassMaterialDto> { Data = data, Meta = (PaginationMeta?)meta });
        }

        [HttpGet("batch/{batchId:guid}")]
        [Authorize]
        public async Task<IActionResult> GetByBatch(Guid batchId, [FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var (data, meta) = await _service.ListByBatchAsync(batchId, page, limit);
            return Ok(new ApiListResponse<ClassMaterialDto> { Data = data, Meta = (PaginationMeta?)meta });
        }

        [HttpGet("{id:guid}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Get(Guid id)
        {
            var mat = await _service.GetByIdAsync(id);
            return Ok(new ApiDataResponse<ClassMaterialDto> { Data = mat });
        }

        [HttpPost]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Create([FromBody] CreateClassMaterialDto request)
        {
            var mat = await _service.CreateAsync(request);
            return StatusCode(201, new ApiDataResponse<ClassMaterialDto> { Data = mat });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClassMaterialDto request)
        {
            var mat = await _service.UpdateAsync(id, request);
            return Ok(new ApiDataResponse<ClassMaterialDto> { Data = mat });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
