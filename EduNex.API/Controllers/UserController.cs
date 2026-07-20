using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EduNex.Common;
using EduNex.Models;
using EduNex.Services;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _service;

        public UsersController(IUserService service)
        {
            _service = service;
        }

        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> List([FromQuery] ListUsersQuery query)
        {
            var (data, total, page, limit) = await _service.ListAsync(query);
            var meta = PaginationMeta.Create(total, page, limit);
            return Ok(new ApiListResponse<UserListItemDto> { Data = data, Meta = meta });
        }

        [HttpGet("teachers/about")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTeachersForAbout()
        {
            var teachers = await _service.GetTeachersForAboutAsync();
            return Ok(new ApiDataResponse<object> { Data = teachers });
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetById(string id)
        {
            var user = await _service.GetByIdAsync(Guid.Parse(id));
            return Ok(new ApiDataResponse<UserDto> { Data = user });
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest input)
        {
            var created = await _service.CreateAsync(input);
            return StatusCode(201, new ApiDataResponse<UserDto> { Data = created });
        }


        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest input)
        {
            var updated = await _service.UpdateAsync(Guid.Parse(id), input);
            return Ok(new ApiDataResponse<UserDto> { Data = updated });
        }

        [HttpPut("{id}/verify")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Verify(string id)
        {
            var user = await _service.VerifyAsync(Guid.Parse(id));
            return Ok(new ApiDataResponse<UserDto> { Data = user });
        }

        [HttpPut("{id}/block")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Block(string id, [FromBody] BlockUserRequest input)
        {
            var user = await _service.BlockAsync(Guid.Parse(id), input.Blocked);
            return Ok(new ApiDataResponse<UserDto> { Data = user });
        }

        [HttpPut("{id}/unlock")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Unlock(string id)
        {
            var user = await _service.UnlockAsync(Guid.Parse(id));
            return Ok(new ApiDataResponse<UserDto> { Data = user });
        }

        [HttpPost("{id}/reset-password")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ResetPassword(string id, [FromBody] ResetPasswordRequest input)
        {
            var result = await _service.ResetPasswordAsync(Guid.Parse(id), input.NewPassword);
            return Ok(new ApiDataResponse<ResetPasswordResultDto> { Data = result });
        }

        [HttpGet("{id}/profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile(string id)
        {
            var profile = await _service.GetProfileAsync(Guid.Parse(id), GetRequesterId(), GetRequesterRole());
            return Ok(new ApiDataResponse<object?> { Data = profile });
        }

        [HttpPut("{id}/profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile(string id, [FromBody] UpdateProfileRequest input)
        {
            var profile = await _service.UpdateProfileAsync(Guid.Parse(id), input, GetRequesterId(), GetRequesterRole());
            return Ok(new ApiDataResponse<TeacherProfileDto> { Data = profile });
        }

        [HttpPut("{id}/enrollment")]
        [Authorize]
        public async Task<IActionResult> UpdateEnrollment(string id, [FromBody] UpdateEnrollmentRequest input)
        {
            var profile = await _service.UpdateEnrollmentAsync(Guid.Parse(id), input, GetRequesterId(), GetRequesterRole());
            return Ok(new ApiDataResponse<StudentProfile> { Data = profile });
        }

        private Guid GetRequesterId()
        {
            var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedException("Missing user identity claim");
            return Guid.Parse(value);
        }

        private string GetRequesterRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value
                ?? throw new UnauthorizedException("Missing role claim");
        }
    }
}