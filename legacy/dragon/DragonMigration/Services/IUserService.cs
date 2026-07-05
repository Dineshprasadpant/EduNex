using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dragon.DTOs;

namespace Dragon.Services
{
    public interface IUserService
    {
        Task<AuthResponseDto> RegisterAsync(UserRegistrationDto registrationDto, string citizenshipImageUrl, string paymentImageUrl = null);
        Task<AuthResponseDto> LoginAsync(UserLoginDto loginDto);
        Task<object> GetUserInformationAsync(Guid userId);
        Task<object> SearchUsersAsync(string searchTerm, int page, int limit);
        
        // Admin actions
        Task<object> VerifyUserAsync(Guid userId, Guid batchId);
        Task<object> GetUnverifiedUsersAsync();
        Task<object> GetVerifiedUsersAsync();
        Task<object> UpdateUserAsync(Guid userId, object updateData);
        Task<object> DeleteUserAsync(Guid userId);
        Task<object> ResetPasswordAsync(Guid userId, string newPassword);
        Task<object> RegisterTeacherAsync(UserRegistrationDto teacherDto);
        
        // Plan Management
        Task<object> UpdateUserPlanAsync(Guid userId, string plan, string planUpgradedFrom, string paymentImageUrl);
    }
}
