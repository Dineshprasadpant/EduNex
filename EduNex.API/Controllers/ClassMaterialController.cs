using EduNex.Common;
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClassMaterialsController : ControllerBase
    {
        private readonly IClassMaterialService _service;

        public ClassMaterialsController(IClassMaterialService service)
        {
            _service = service;
        }
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List([FromQuery] ListMaterialsQuery query)
        {
            var (userId, role) = GetRequester();
            var (data, total, page, limit) = await _service.ListAsync(userId, role, query);
            var meta = PaginationMeta.Create(total, page, limit);
            return Ok(new ApiListResponse<ClassMaterialResponseDto> { Data = data, Meta = meta });
        }

        [HttpGet("{id}/view-url")]
        [Authorize]
        public async Task<IActionResult> ViewUrl(string id)
        {
            var (userId, role) = GetRequester();
            if (!Guid.TryParse(id, out var guid))
            {
                return BadRequest("Invalid guid format.");  
            }
            var result = await _service.ViewUrlAsync(userId, role, guid);
            return Ok(new ApiDataResponse<ViewUrlResultDto> { Data = result });
        }


        [HttpGet("{id}/stream")]
        [Authorize]
        public async Task<IActionResult> Stream(string id)
        {
            var (userId, role) = GetRequester();
            if (!Guid.TryParse(id, out var guid))
            {
                return BadRequest("Invalid guid format.");
            }
            var result = await _service.StreamAsync(userId, role, guid);

            Response.Headers["Content-Disposition"] = "inline";
            Response.Headers["Cache-Control"] = "private, no-store, max-age=0";

            return File(result.Body, result.MimeType, enableRangeProcessing: false);
        }

        [HttpGet("{id}/download")]
        [Authorize(Roles = ("admin,teacher"))]
        public async Task<IActionResult> Download(string id)
        {
            var (userId, role) = GetRequester();
            if (!Guid.TryParse(id, out var guid))
            {
                return BadRequest("Invalid guid format.");
            }
            var result = await _service.DownloadAsync(userId, role, guid);
            return Ok(new ApiDataResponse<DownloadResultDto> { Data = result });
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(string id)
        {
            var (userId, role) = GetRequester();
            if (!Guid.TryParse(id, out var guid))
            {
                return BadRequest("Invalid guid format.");
            }
            var material = await _service.GetByIdAsync(userId, role, guid);
            return Ok(new ApiDataResponse<ClassMaterialResponseDto> { Data = material });
        }

        [HttpPost]
        [Authorize(Roles = ("admin,teacher"))]
        public async Task<IActionResult> Create([FromBody] CreateClassMaterialRequest input)
        {
            var (userId, _) = GetRequester();
            var created = await _service.CreateAsync(input, userId);
            return StatusCode(201, new ApiDataResponse<ClassMaterialRawDto> { Data = created });
        }

        [HttpPut("{id}")]
        [Authorize(Roles =("admin,teacher"))]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateClassMaterialRequest input)
        {
            if (!Guid.TryParse(id, out var guid))
            {
                return BadRequest("Invalid guid format.");
            }
            var updated = await _service.UpdateAsync(guid, input);
            return Ok(new ApiDataResponse<ClassMaterialRawDto> { Data = updated });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles =("admin,teacher"))]
        public async Task<IActionResult> Remove(string id)
        {
            if (!Guid.TryParse(id, out var guid))
            {
                return BadRequest("Invalid guid format.");
            }
            await _service.DeleteAsync(guid);
            return NoContent();
        }

        private (Guid UserId, string Role) GetRequester()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedException("Missing user identity claim");
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value
                ?? throw new UnauthorizedException("Missing role claim");

            return (Guid.Parse(idClaim), roleClaim);
        }
    }
}