using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dragon.Models;

namespace Dragon.Repositories
{
    public interface IUserRepository
    {
        Task<User> GetUserByEmailAsync(string email);
        Task<User> GetUserByIdAsync(Guid id);
        Task<Guid> CreateUserAsync(User user);
        Task<bool> UpdateUserStatusAsync(Guid userId, Guid batchId, UserStatus status);
        Task SavePaymentImageAsync(Guid userId, string imageUrl, int batchIndex);
        
        // Management
        Task<(IEnumerable<dynamic> Users, int Total)> SearchByFullnameAsync(string searchTerm, int page, int limit);
        Task<IEnumerable<dynamic>> GetUnverifiedUsersAsync();
        Task<IEnumerable<dynamic>> GetVerifiedUsersAsync();
        Task<bool> UpdateUserAsync(Guid id, object updateData);
        Task<bool> DeleteUserAsync(Guid id);
        Task<bool> UpdatePasswordAsync(Guid id, string passwordHash);
        Task<bool> UpdateUserPlanAsync(Guid id, string plan, string planUpgradedFrom);
        
        // Relational updates
        Task IncrementCourseStudentCountAsync(Guid courseId);
    }
}
