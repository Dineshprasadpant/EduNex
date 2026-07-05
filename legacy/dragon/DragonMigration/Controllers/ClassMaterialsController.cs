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
    public class ClassMaterialsController : ControllerBase
    {
        private readonly IClassMaterialService _service;
        public ClassMaterialsController(IClassMaterialService service) => _service = service;

        [HttpGet]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> GetAll(int page = 1, int limit = 10)
        {
            try { return Ok(await _service.GetAllPaginatedClassMaterialsAsync(page, limit)); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Get(Guid id)
        {
            try
            {
                var mat = await _service.GetClassMaterialAsync(id);
                if (mat == null) return NotFound(new { message = "Class material not found" });
                return Ok(mat);
            }
            catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpPost]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Create([FromBody] ClassMaterial material)
        {
            try
            {
                if (string.IsNullOrEmpty(material.Title) || string.IsNullOrEmpty(material.FileUrl))
                    return BadRequest(new { message = "Missing required fields" });

                return Ok(await _service.CreateClassMaterialAsync(material));
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ClassMaterial material)
        {
            try
            {
                var result = await _service.UpdateClassMaterialAsync(id, material);
                if (result == null) return NotFound(new { message = "Class material not found" });
                return Ok(result);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var success = await _service.DeleteClassMaterialAsync(id);
                if (!success) return NotFound(new { message = "Class material not found" });
                return Ok(new { message = "Class material deleted successfully" });
            }
            catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpGet("batch/{batchId}")]
        [Authorize]
        public async Task<IActionResult> GetByBatch(Guid batchId, int page = 1, int limit = 10)
        {
            try { return Ok(await _service.GetPaginatedClassMaterialsAsync(batchId, page, limit)); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }
    }
}
