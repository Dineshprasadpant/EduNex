using EduNex.Api.Filters;
using EduNex.Api.Service;
using EduNex.Models; 
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ITokenService _tokenService;

        public AuthController(IAuthService authService, ITokenService tokenService)
        {
            _authService = authService;
            _tokenService = tokenService;
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(ApiDataResponse<LoginResultDto>), 200)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var outcome = await _authService.LoginAsync(request);

            if (!outcome.Success)
            {
                var statusCode = outcome.IsAccountIssue ? 403 : 401;
                return StatusCode(statusCode, new { success = false, message = outcome.Message });
            }

            return Ok(new ApiDataResponse<LoginResultDto> { Data = outcome.Result! });
        }

        [HttpPost("register")]
        [RequestSizeLimit(8 * 1024 * 1024)] 
        [VerifyTurnstile]
        [ProducesResponseType(typeof(ApiDataResponse<RegisterResponseDto>), 201)]
        public async Task<IActionResult> Register([FromForm] RegisterRequestDto request)
        {
            var user = await _authService.RegisterAsync(request);
            var response = new RegisterResponseDto
            {
                User = user,
                Message = "Registration successful. Awaiting admin verification.",
            };
            return StatusCode(201, new ApiDataResponse<RegisterResponseDto> { Data = response });
        }

        [HttpPost("refresh")]
        [ProducesResponseType(typeof(ApiDataResponse<TokenPairDto>), 200)]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequestDto request)
        {
            var tokens = await _tokenService.RotateRefreshTokenAsync(request.RefreshToken);
            return Ok(new ApiDataResponse<TokenPairDto> { Data = tokens });
        }

        [HttpPost("logout")]
        [Authorize]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(204)]
        public async Task<IActionResult> Logout([FromBody] LogoutRequestDto request)
        {
            await _tokenService.RevokeOneAsync(request.RefreshToken);
            return NoContent();
        }

        [HttpGet("me")]
        [Authorize]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(typeof(ApiDataResponse<UserDto>), 200)]
        public async Task<IActionResult> GetMe()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedException("Invalid or expired token");

            var user = await _authService.GetMeAsync(userId);
            return Ok(new ApiDataResponse<UserDto> { Data = user });
        }
    }
}