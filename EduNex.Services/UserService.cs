using EduNex.Models;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EduNex.DataAccess;
namespace EduNex.Services
{
    public interface IUserService
    {
        Task<AuthResponseDto> RegisterAsync(UserRegistrationDto registrationDto, string citizenshipImageUrl, string paymentImageUrl = null);
        Task<AuthResponseDto> LoginAsync(UserLoginDto loginDto);
        Task<object> GetUserInformationAsync(Guid userId);
        Task<object> SearchUsersAsync(string searchTerm, int page, int limit);

        // Admin actions
        Task<object> VerifyUserAsync(Guid userId, Guid batchId);
        Task<object> GetUserAsync(string mode);
        Task<object> UpdateUserAsync(Guid userId, updateUserDto updateData);
        Task<object> DeleteUserAsync(Guid userId);
        Task<object> ResetPasswordAsync(Guid userId, string newPassword);
        Task<object> RegisterTeacherAsync(UserRegistrationDto teacherDto);

        // Plan Management
        Task<object> UpdateUserPlanAsync(Guid userId, string plan, string planUpgradedFrom, string paymentImageUrl);
    }
    public class UserService : IUserService
    {
        private readonly IUserDal _userDal;
        private readonly IConfiguration _configuration;
        private readonly AppState _appState;
        public UserService(IUserDal userRepository, IConfiguration configuration , AppState appState)
        {
            _userDal = userRepository;
            _configuration = configuration;
            _appState = appState;
        }

        public async Task<AuthResponseDto> RegisterAsync(UserRegistrationDto registrationDto, string citizenshipImageUrl, string paymentImageUrl = null)
        {
            var existingUser = await _userDal.GetUserByEmailAsync(registrationDto.Email);
            if (existingUser != null) throw new Exception("Email already registered");

            var user = new User
            {
                Fullname = registrationDto.Fullname,
                Email = registrationDto.Email,
                Phone = registrationDto.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registrationDto.Password),
                Role = Enum.Parse<UserRole>(registrationDto.Role, true),
                Plan = Enum.Parse<UserPlan>(registrationDto.Plan, true),
                CourseEnrolledId = registrationDto.CourseEnrolled,
                CitizenshipImageUrl = citizenshipImageUrl,
                Status = UserStatus.Unverified
            };

            var userId = await _userDal.CreateUserAsync(user);

            if (!string.IsNullOrEmpty(paymentImageUrl))
            {
                await _userDal.SavePaymentImageAsync(userId, paymentImageUrl, 0);
            }

            // Note: In original Node app, register returns success message + userId. 
            // Often registration auto-logins or just returns success. 
            // Matching the Node userService.registerUser return: { success: true, message, userId }

            return new AuthResponseDto
            {
                User = MapToDto(user)
            };
        }

        public async Task<AuthResponseDto> LoginAsync(UserLoginDto loginDto)
        {
            var user = await _userDal.GetUserByEmailAsync(loginDto.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                throw new Exception("Invalid email or password");
            }

            if (user.Status != UserStatus.Verified)
            {
                throw new Exception("Account not verified yet");
            }

            var token = GenerateJwtToken(user);
            _appState.SetUser($"Bearer {token}", new SessionUser
            {
                Id = user.Id,
                Email = user.Email,
                Role = user.Role.ToString().ToLower(),
                Plan = user.Plan.ToString().ToLower(),
                BatchId = user.BatchId,
                CourseEnrolledId = user.CourseEnrolledId
            });
            return new AuthResponseDto
            {
                Token = token,
                User = MapToDto(user)
            };
        }

        public async Task<object> GetUserInformationAsync(Guid userId)
        {
            var user = await _userDal.GetUserByIdAsync(userId);
            if (user == null) throw new Exception("User not found");
            return new { success = true, users = MapToDto(user) };
        }

        public async Task<object> SearchUsersAsync(string searchTerm, int page, int limit)
        {
            var (users, total) = await _userDal.SearchByFullnameAsync(searchTerm, page, limit);
            return new {success=true,date= new { users, total, page, totalPages = (int)Math.Ceiling((double)total / limit) }};
        }

        public async Task<object> VerifyUserAsync(Guid userId, Guid batchId)
        {
            var user = await _userDal.GetUserByIdAsync(userId);
            if (user == null) throw new Exception("User not found");

            await _userDal.UpdateUserStatusAsync(userId, batchId, UserStatus.Verified);
            await _userDal.IncrementCourseStudentCountAsync(user.CourseEnrolledId);

            // Note: In real app, call AnalyticsService here

            return new
            {
                success = true,
                message = "User verified successfully",
                user = new { id = user.Id, fullname = user.Fullname, email = user.Email, status = "verified" }
            };
        }

        public async Task<object> GetUserAsync(string mode)
        {
            var users = await _userDal.GetUsersAsync(mode);
            return new { success = true, count = users.Count(), users };
        }

        public async Task<object> UpdateUserAsync(Guid userId, updateUserDto updateData)
        {
            if (await _userDal.GetUserByIdAsync(userId) == null)
                return new { status = "error", message = "userid invalid" };
            updateData.Id=userId;
            await _userDal.UpdateUserAsync(updateData);
            
            return new { success = true, message = "User updated successfully" ,user=await _userDal.GetUserById(userId)};
        }

        public async Task<object> DeleteUserAsync(Guid userId)
        {
            await _userDal.DeleteUserAsync(userId);
            return new { success = true, message = "User and associated files deleted successfully" };
        }

        public async Task<object> ResetPasswordAsync(Guid userId, string newPassword)
        {
            var hash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _userDal.UpdatePasswordAsync(userId, hash);
            return new { success = true, message = "Password reset successfully", userId };
        }

        public async Task<object> RegisterTeacherAsync(UserRegistrationDto dto)
        {
            var user = new User
            {
                Fullname = dto.Fullname,
                Email = dto.Email,
                Phone = dto.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = UserRole.Teacher,
                Status = UserStatus.Verified,
                CourseEnrolledId = dto.CourseEnrolled,
                CitizenshipImageUrl=dto.CitizenshipImageUrl,
                Plan = UserPlan.Full
            };
            await _userDal.CreateUserAsync(user);
            return new { success = true, message = "Teacher registered successfully" };
        }

        public async Task<object> UpdateUserPlanAsync(Guid userId, string plan, string planUpgradedFrom, string paymentImageUrl)
        {
            await _userDal.UpdateUserPlanAsync(userId, plan, planUpgradedFrom);
            if (!string.IsNullOrEmpty(paymentImageUrl))
            {
                await _userDal.SavePaymentImageAsync(userId, paymentImageUrl, 0);
            }
            return new { success = true, message = "Plan Changed Sucessfully" };
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Secret"]);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("id", user.Id.ToString()),
                    new Claim(ClaimTypes.Role, user.Role.ToString().ToLower())
                }),
                Expires = DateTime.UtcNow.AddDays(10),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private UserDto MapToDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Fullname = user.Fullname,
                Email = user.Email,
                Phone = user.Phone,
                Role = user.Role.ToString().ToLower(),
                Status = user.Status.ToString().ToLower(),
                Plan = user.Plan.ToString().ToLower(),
                Batch = user.BatchId, // Matches Node field name 'batch'
                CourseEnrolled = user.CourseEnrolledId // Matches Node field name 'courseEnrolled'
            };
        }
    }
}
