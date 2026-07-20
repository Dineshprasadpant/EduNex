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
    public class AnnouncementsController : ControllerBase
    {
        private readonly IAnnouncementService _service;

        public AnnouncementsController(IAnnouncementService service)
        {
            _service = service;
        }

        // GET api/announcements?page=&limit=&search=&privacy=
        // optionalAuthenticate equivalent: no [Authorize], but claims are
        // read if a valid token was presented. See GetOptionalRequester.
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> List([FromQuery] ListAnnouncementsQuery query)
        {
            var requester = GetOptionalRequester();
            var (data, total, page, limit) = await _service.ListAsync(query, requester);
            var meta = PaginationMeta.Create(total, page, limit);
            return Ok(new ApiListResponse<AnnouncementDto> { Data = data, Meta = meta });
        }

        // GET api/announcements/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(string id)
        {
            var requester = GetOptionalRequester();
            var announcement = await _service.GetByIdAsync(Guid.Parse(id), requester);
            return Ok(new ApiDataResponse<AnnouncementDetailDto> { Data = announcement });
        }

        // POST api/announcements
        [HttpPost]
        [Authorize(Roles =" admin")]
        public async Task<IActionResult> Create([FromBody] CreateAnnouncementRequest input)
        {
            var created = await _service.CreateAsync(input);
            return StatusCode(201, new ApiDataResponse<Announcement> { Data = created });
        }

        // PUT api/announcements/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateAnnouncementRequest input)
        {
            var updated = await _service.UpdateAsync(Guid.Parse(id), input);
            return Ok(new ApiDataResponse<Announcement> { Data = updated });
        }

        // DELETE api/announcements/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Remove(string id)
        {
            await _service.DeleteAsync(Guid.Parse(id));
            return NoContent();
        }

        // ---- Helpers -----------------------------------------------------

        // Mirrors optionalAuthenticate + req.user: returns null for a
        // genuinely anonymous caller, or (userId, role) if a valid token
        // was presented. Assumes standard ASP.NET JWT bearer behavior -
        // no [Authorize] means the request always proceeds, and `User`
        // gets populated only if a valid token was attached. If your JWT
        // middleware is configured to hard-reject invalid (not just
        // missing) tokens even here, this won't match optionalAuthenticate
        // exactly - worth verifying against your actual middleware.
        private (Guid UserId, string Role)? GetOptionalRequester()
        {
            if (User.Identity?.IsAuthenticated != true) return null;

            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            if (idClaim == null || roleClaim == null) return null;

            return (Guid.Parse(idClaim), roleClaim);
        }
    }
}