using System;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/gallery")]
    public class GalleryController : ControllerBase
    {
        private readonly IGalleryService _service;
        public GalleryController(IGalleryService service) => _service = service;

        // Public — no auth, matches router.get('/') with no middleware.
        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] int page = 1, [FromQuery] int limit = 20, [FromQuery] string? isActive = null)
        {
            bool? isActiveFilter = isActive switch
            {
                "true" => true,
                "false" => false,
                _ => null
            };

            var (data, meta) = await _service.ListAsync(page, limit, isActiveFilter);
            return Ok(new { data, meta = new { meta.Page, meta.Limit, meta.Total, meta.TotalPages } });
        }

        // Public — no auth, matches router.get('/:id').
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var item = await _service.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Gallery item not found" });
            return Ok(item);
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] CreateGalleryRequest request)
        {
            var item = await _service.CreateAsync(request);
            return Created(string.Empty, item);
        }

        // PUT and PATCH both route to the same update logic, matching Node
        // (both wired to galleryController.update).
        [HttpPut("{id:guid}")]
        [HttpPatch("{id:guid}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGalleryRequest request)
        {
            var item = await _service.UpdateAsync(id, request);
            if (item == null) return NotFound(new { message = "Gallery item not found" });
            return Ok(item);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Remove(Guid id)
        {
            var removed = await _service.RemoveAsync(id);
            if (!removed) return NotFound(new { message = "Gallery item not found" });
            return NoContent();
        }
    }
}