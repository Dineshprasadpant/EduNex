using System;
using System.Threading.Tasks;
using Dragon.DTOs;
using Dragon.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Dragon.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost("register")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Register([FromForm] UserRegistrationDto registrationDto, IFormFile citizenship, IFormFile paymentReceipt)
        {
            try
            {
                // In a real app, you'd use a FileService to save these to disk/S3
                // For this migration demo, we'll assume they are uploaded and return a dummy URL
                string citizenshipUrl = $"uploads/citizenship/{Guid.NewGuid()}_{citizenship.FileName}";
                string paymentUrl = paymentReceipt != null ? $"uploads/payments/{Guid.NewGuid()}_{paymentReceipt.FileName}" : null;

                var result = await _userService.RegisterAsync(registrationDto, citizenshipUrl, paymentUrl);
                
                return Ok(new { 
                    success = true, 
                    message = "User registered successfully", 
                    userId = result.User.Id 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto)
        {
            try
            {
                var result = await _userService.LoginAsync(loginDto);
                return Ok(new {
                    success = true,
                    token = result.Token,
                    user = result.User
                });
            }
            catch (Exception ex)
            {
                return Unauthorized(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("userInfo/{userId}")]
        public async Task<IActionResult> GetUserInfo(Guid userId) => Ok(await _userService.GetUserInformationAsync(userId));

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string name, int page = 1, int limit = 10) => Ok(await _userService.SearchUsersAsync(name, page, limit));

        [HttpGet("unverified")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetUnverified() => Ok(await _userService.GetUnverifiedUsersAsync());

        [HttpGet("verified")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetVerified() => Ok(await _userService.GetVerifiedUsersAsync());

        [HttpPut("{userId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] object updateData) => Ok(await _userService.UpdateUserAsync(userId, updateData));

        [HttpDelete("{userId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteUser(Guid userId) => Ok(await _userService.DeleteUserAsync(userId));

        [HttpPost("{userId}/reset-password")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ResetPassword(Guid userId, [FromBody] PasswordResetRequest request) => Ok(await _userService.ResetPasswordAsync(userId, request.NewPassword));

        [HttpPost("registerTeachers")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> RegisterTeacher([FromBody] UserRegistrationDto dto) => Ok(await _userService.RegisterTeacherAsync(dto));

        [HttpPut("verify/{userId}/batch/{batchId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> VerifyUser(Guid userId, Guid batchId) => Ok(await _userService.VerifyUserAsync(userId, batchId));

        [HttpPut("{id}/plan")]
        [Authorize]
        public async Task<IActionResult> UpdatePlan(Guid id, [FromBody] PlanUpdateRequest request) 
        {
            return Ok(await _userService.UpdateUserPlanAsync(id, request.Plan, request.PlanUpgradedFrom, request.PaymentImage));
        }
    }

    public class PasswordResetRequest { public string NewPassword { get; set; } }
    public class PlanUpdateRequest { public string Plan { get; set; } public string PlanUpgradedFrom { get; set; } public string PaymentImage { get; set; } }
}
