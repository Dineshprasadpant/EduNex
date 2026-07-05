using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Dragon.DTOs;
using Dragon.Models;
using Dragon.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using BC = BCrypt.Net.BCrypt;

namespace Dragon.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public UserService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto> RegisterAsync(UserRegistrationDto registrationDto, string citizenshipImageUrl, string paymentImageUrl = null)
        {
            var existingUser = await _userRepository.GetUserByEmailAsync(registrationDto.Email);
            if (existingUser != null) throw new Exception("Email already registered");

            var user = new User
            {
                Fullname = registrationDto.Fullname,
                Email = registrationDto.Email,
                Phone = registrationDto.Phone,
                PasswordHash = BC.HashPassword(registrationDto.Password),
                Role = Enum.Parse<UserRole>(registrationDto.Role, true),
                Plan = Enum.Parse<UserPlan>(registrationDto.Plan, true),
                CourseEnrolledId = registrationDto.CourseEnrolledId,
                CitizenshipImageUrl = citizenshipImageUrl,
                Status = UserStatus.Unverified
            };

            var userId = await _userRepository.CreateUserAsync(user);

            if (!string.IsNullOrEmpty(paymentImageUrl))
            {
                await _userRepository.SavePaymentImageAsync(userId, paymentImageUrl, 0);
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
            var user = await _userRepository.GetUserByEmailAsync(loginDto.Email);
            if (user == null || !BC.Verify(loginDto.Password, user.PasswordHash))
            {
                throw new Exception("Invalid email or password");
            }

            if (user.Status != UserStatus.Verified)
            {
                throw new Exception("Account not verified yet");
            }

            var token = GenerateJwtToken(user);

            return new AuthResponseDto
            {
                Token = token,
                User = MapToDto(user)
            };
        }

        public async Task<object> GetUserInformationAsync(Guid userId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null) throw new Exception("User not found");
            return new { success = true, users = MapToDto(user) };
        }

        public async Task<object> SearchUsersAsync(string searchTerm, int page, int limit)
        {
            var (users, total) = await _userRepository.SearchByFullnameAsync(searchTerm, page, limit);
            return new { users, total, page, totalPages = (int)Math.Ceiling((double)total / limit) };
        }

        public async Task<object> VerifyUserAsync(Guid userId, Guid batchId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null) throw new Exception("User not found");

            await _userRepository.UpdateUserStatusAsync(userId, batchId, UserStatus.Verified);
            await _userRepository.IncrementCourseStudentCountAsync(user.CourseEnrolledId);
            
            // Note: In real app, call AnalyticsService here
            
            return new { 
                success = true, 
                message = "User verified successfully", 
                user = new { id = user.Id, fullname = user.Fullname, email = user.Email, status = "verified" }
            };
        }

        public async Task<object> GetUnverifiedUsersAsync()
        {
            var users = await _userRepository.GetUnverifiedUsersAsync();
            return new { success = true, count = users.Count(), users };
        }

        public async Task<object> GetVerifiedUsersAsync()
        {
            var users = await _userRepository.GetVerifiedUsersAsync();
            return new { success = true, count = users.Count(), users };
        }

        public async Task<object> UpdateUserAsync(Guid userId, object updateData)
        {
            await _userRepository.UpdateUserAsync(userId, updateData);
            return new { success = true, message = "User updated successfully" };
        }

        public async Task<object> DeleteUserAsync(Guid userId)
        {
            await _userRepository.DeleteUserAsync(userId);
            return new { success = true, message = "User and associated files deleted successfully" };
        }

        public async Task<object> ResetPasswordAsync(Guid userId, string newPassword)
        {
            var hash = BC.HashPassword(newPassword);
            await _userRepository.UpdatePasswordAsync(userId, hash);
            return new { success = true, message = "Password reset successfully", userId };
        }

        public async Task<object> RegisterTeacherAsync(UserRegistrationDto dto)
        {
            var user = new User
            {
                Fullname = dto.Fullname,
                Email = dto.Email,
                Phone = dto.Phone,
                PasswordHash = BC.HashPassword(dto.Password),
                Role = UserRole.Teacher,
                Status = UserStatus.Verified,
                CourseEnrolledId = dto.CourseEnrolled,
                Plan = UserPlan.Full
            };
            await _userRepository.CreateUserAsync(user);
            return new { success = true, message = "Teacher registered successfully" };
        }

        public async Task<object> UpdateUserPlanAsync(Guid userId, string plan, string planUpgradedFrom, string paymentImageUrl)
        {
            await _userRepository.UpdateUserPlanAsync(userId, plan, planUpgradedFrom);
            if (!string.IsNullOrEmpty(paymentImageUrl))
            {
                await _userRepository.SavePaymentImageAsync(userId, paymentImageUrl, 0);
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
                Expires = DateTime.UtcNow.AddDays(1),
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
