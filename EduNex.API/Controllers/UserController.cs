using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;
namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IFileService _fileService;
        public UsersController(IUserService userService, IFileService fileService)
        {
            _userService = userService;
            _fileService = fileService;
        }

        [HttpPost("register")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Register([FromForm] UserRegistrationDto registrationDto, IFormFile citizenship, IFormFile? paymentReceipt)
        {
            string citizenshipUrl = null;
            string paymentUrl = null;

            try
            {
                if (citizenship == null || citizenship.Length == 0)
                    return BadRequest(new { success = false, message = "Citizenship file is required" });

                if (!_fileService.IsValidImage(citizenship))
                    return BadRequest(new { success = false, message = "Invalid citizenship file type (only jpg/jpeg/png allowed)" });

                if (paymentReceipt != null && !_fileService.IsValidImage(paymentReceipt))
                    return BadRequest(new { success = false, message = "Invalid payment file type (only jpg/jpeg/png allowed)" });

                // 2. SAVE FILES FIRST
                var citRes = await _fileService.UploadFileAsync(citizenship, folder:"uploads/citizenship");
                citizenshipUrl = citRes.Url;
                if (paymentReceipt != null)
                {
                    var res = await _fileService.UploadFileAsync(paymentReceipt, folder: "uploads/payments");
                    paymentUrl=res.Url;
                }
                    

                // 3. REGISTER USER
                var result = await _userService.RegisterAsync(
                    registrationDto,
                    citizenshipUrl,
                    paymentUrl
                );

                return Ok(new
                {
                    success = true,
                    message = "User registered successfully",
                    userId = result.User.Id
                });
            }
            catch (Exception ex)
            {
                // 4. ROLLBACK FILES IF ANY FAILURE
                if (!string.IsNullOrEmpty(citizenshipUrl))
                    await _fileService.DeleteFileSafe(citizenshipUrl);

                if (!string.IsNullOrEmpty(paymentUrl))
                    await _fileService.DeleteFileSafe(paymentUrl);

                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto)
        {
            try
            {
                var result = await _userService.LoginAsync(loginDto);
                return Ok(new
                {
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
        public async Task<IActionResult> GetUnverified() => Ok(await _userService.GetUserAsync("unverified"));

        [HttpGet("verified")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetVerified() => Ok(await _userService.GetUserAsync("verified"));

        [HttpPut("{userId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] updateUserDto updateData) => Ok(await _userService.UpdateUserAsync(userId, updateData));

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
