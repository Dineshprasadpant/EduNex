using System;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/classMaterial")]
    public class ClassMaterialController : ControllerBase
    {
        private readonly IClassMaterialService _service;
        public ClassMaterialController(IClassMaterialService service) => _service = service;

        [HttpGet]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> GetAll(int page = 1, int limit = 10) => Ok(await _service.GetAllPaginatedClassMaterialsAsync(page, limit));

        [HttpGet("{id}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Get(Guid id)
        {
            var mat = await _service.GetClassMaterialAsync(id);
            if (mat == null) return NotFound(new { message = "Class material not found" });
            return Ok(mat);
        }

        [HttpPost]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Create([FromBody] ClassMaterial material) => Ok(await _service.CreateClassMaterialAsync(material));

        [HttpPut("{id}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ClassMaterial material) => Ok(await _service.UpdateClassMaterialAsync(id, material));

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await _service.DeleteClassMaterialAsync(id);
            if (!success) return NotFound(new { message = "Class material not found" });
            return Ok(new { message = "Class material deleted successfully" });
        }

        [HttpGet("batch/{batchId}")]
        [Authorize]
        public async Task<IActionResult> GetByBatch(Guid batchId, int page = 1, int limit = 10) => Ok(await _service.GetPaginatedClassMaterialsAsync(batchId, page, limit));
    }
}
