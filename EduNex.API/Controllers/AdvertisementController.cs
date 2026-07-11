using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;
using System;
using System.Threading.Tasks;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdvertisementsController : ControllerBase
    {
        private readonly IAdvertisementService _service;

        public AdvertisementsController(IAdvertisementService service)
        {
            _service = service;
        }
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> List([FromQuery] string? page, [FromQuery] string? limit, [FromQuery] string? isActive)
        {
            try
            {
                var pagination = Paginator.Paginate(page, limit);
                var offset = pagination.Offset;
                var resolvedLimit = pagination.Limit;
                var resolvedPage = pagination.Page;

                bool? isActiveFilter = isActive switch
                {
                    "true" => true,
                    "false" => false,
                    _ => null
                };

                var result = await _service.ListAsync(isActiveFilter, resolvedPage, resolvedLimit, offset);
                var meta = PaginationMeta.Create(result.Total, resolvedPage, resolvedLimit);

                return Ok(new ApiListResponse<AdvertisementDto> { Data = result.Data, Meta = meta });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(string id)
        {
            try
            {
                var guid = ParseGuidParam(id);
                var ad = await _service.GetByIdAsync(guid);
                return Ok(new ApiDataResponse<AdvertisementDto> { Data = ad });
            }
            catch (Exception ex)
            {
                return NotFound(new { status = "error", message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateAdvertisementRequest input)
        {
            try
            {
                var created = await _service.CreateAsync(input);
                return StatusCode(201, new ApiDataResponse<AdvertisementDto> { Data = created });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePut(string id, [FromBody] UpdateAdvertisementRequest input)
        {
            try
            {
                var guid = ParseGuidParam(id);
                var updated = await _service.UpdateAsync(guid, input);
                return Ok(new ApiDataResponse<AdvertisementDto> { Data = updated });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpPatch("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePatch(string id, [FromBody] UpdateAdvertisementRequest input)
        {
            try
            {
                var guid = ParseGuidParam(id);
                var updated = await _service.UpdateAsync(guid, input);
                return Ok(new ApiDataResponse<AdvertisementDto> { Data = updated });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Remove(string id)
        {
            try
            {
                var guid = ParseGuidParam(id);
                await _service.DeleteAsync(guid);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        private static Guid ParseGuidParam(string id)
        {
            if (!Guid.TryParse(id, out var guid))
                throw new BadRequestException("Missing or invalid param: id");
            return guid;
        }
    }
}