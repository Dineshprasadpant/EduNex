using EduNex.Models;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.AspNetCore.Http.Features;

namespace EduNex.DataAccess
{
    public interface IUserDal
    {
        Task<User> GetUserByEmailAsync(string email);
        Task<User> GetUserByIdAsync(Guid id);
        Task<UserDto> GetUserById(Guid id);
        Task<Guid> CreateUserAsync(User user);
        Task<bool> UpdateUserStatusAsync(Guid userId, Guid batchId, UserStatus status);
        Task SavePaymentImageAsync(Guid userId, string imageUrl, int batchIndex);

        // Management
        Task<(IEnumerable<UserDto> Users, int Total)> SearchByFullnameAsync(string searchTerm, int page, int limit);
        Task<IEnumerable<dynamic>> GetUsersAsync(string status);
        Task<bool> UpdateUserAsync(updateUserDto updateData);
        Task<bool> DeleteUserAsync(Guid id);
        Task<bool> UpdatePasswordAsync(Guid id, string passwordHash);
        Task<bool> UpdateUserPlanAsync(Guid id, string plan, string planUpgradedFrom);

        // Relational updates
        Task IncrementCourseStudentCountAsync(Guid courseId);
    }
    public class UserDal : IUserDal
    {
        private readonly string _connectionString;

        public UserDal(string connectionString)
        {
            _connectionString = connectionString;
        }

        public async Task<User> GetUserByEmailAsync(string email)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = "SELECT * FROM Users WHERE Email = @Email";
                return await conn.QueryFirstOrDefaultAsync<User>(sql, new { Email = email });
            }
        }

        public async Task<User> GetUserByIdAsync(Guid id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = "SELECT * FROM Users WHERE Id = @Id";
                return await conn.QueryFirstOrDefaultAsync<User>(sql, new { Id = id });
            }
        }
        public async Task<UserDto> GetUserById(Guid id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = "SELECT * FROM Users WHERE Id = @Id";
                return await conn.QueryFirstOrDefaultAsync<UserDto>(sql, new { Id = id });
            }
        }

        public async Task<Guid> CreateUserAsync(User user)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    INSERT INTO Users (Id, Fullname, Email, Phone, PasswordHash, Role, Status, 
                                     PlatformPreference, CourseEnrolledId, CitizenshipImageUrl, 
                                     PlanType, CreatedAt)
                    VALUES (@Id, @Fullname, @Email, @Phone, @PasswordHash, @Role, @Status, 
                            @PlatformPreference, @CourseEnrolledId, @CitizenshipImageUrl, 
                            @PlanType, @CreatedAt);
                    SELECT @Id;";

                if (user.Id == Guid.Empty) user.Id = Guid.NewGuid();

                await conn.ExecuteAsync(sql, new
                {
                    user.Id,
                    user.Fullname,
                    user.Email,
                    user.Phone,
                    user.PasswordHash,
                    Role = user.Role.ToString().ToLower(),
                    Status = user.Status.ToString().ToLower(),
                    PlatformPreference = user.PlatformPreference?.ToString().ToLower(),
                    user.CourseEnrolledId,
                    user.CitizenshipImageUrl,
                    PlanType = user.Plan.ToString().ToLower(),
                    user.CreatedAt
                });

                return user.Id;
            }
        }

        public async Task<bool> UpdateUserStatusAsync(Guid userId, Guid batchId, UserStatus status)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = "UPDATE Users SET BatchId = @BatchId, Status = @Status WHERE Id = @Id";
                var rows = await conn.ExecuteAsync(sql, new
                {
                    Id = userId,
                    BatchId = batchId,
                    Status = status.ToString().ToLower()
                });
                return rows > 0;
            }
        }

        public async Task SavePaymentImageAsync(Guid userId, string imageUrl, int batchIndex)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = "INSERT INTO UserPaymentImages (UserId, ImageUrl, BatchIndex) VALUES (@UserId, @ImageUrl, @BatchIndex)";
                await conn.ExecuteAsync(sql, new { UserId = userId, ImageUrl = imageUrl, BatchIndex = batchIndex });
            }
        }

        public async Task<(IEnumerable<UserDto> Users, int Total)> SearchByFullnameAsync(string searchTerm, int page, int limit)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT COUNT(*) FROM Users WHERE Fullname LIKE @Search;
                    SELECT u.*, b.BatchName, c.Title as CourseTitle
                    FROM Users u
                    LEFT JOIN Batches b ON u.BatchId = b.Id
                    LEFT JOIN Courses c ON u.CourseEnrolledId = c.Id
                    WHERE u.Fullname LIKE @Search
                    ORDER BY u.Fullname
                    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

                using (var multi = await conn.QueryMultipleAsync(sql, new
                {
                    Search = $"%{searchTerm}%",
                    Offset = (page - 1) * limit,
                    Limit = limit
                }))
                {
                    var total = await multi.ReadFirstAsync<int>();
                    var items=await multi.ReadAsync<UserDto>();
                    return (items, total);
                }
            }
        }

        public async Task<IEnumerable<dynamic>> GetUsersAsync(string status)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
        SELECT
    u.Id AS [_id],
    u.Fullname AS [fullname],
    u.Role AS [role],
    u.Email AS [email],
    u.PlatformPreference AS [platformPreference],
    u.Phone AS [phone],
    u.Status AS [status],

    c.Id AS [CourseId],
    c.Title AS [CourseTitle],

    u.CitizenshipImageUrl AS [citizenshipImageUrl],
    u.PlanType AS [plan],
    u.CreatedAt AS [createdAt]

FROM Users u
LEFT JOIN Courses c
    ON u.CourseEnrolledId = c.Id
WHERE u.Status = @status
  AND u.Role = 'user';";

                return await conn.QueryAsync<dynamic>(sql, new {status});
            }
        }

        public async Task<IEnumerable<dynamic>> GetVerifiedUsersAsync()
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT u.*, b.BatchName, c.Title as CourseTitle
                    FROM Users u
                    LEFT JOIN Batches b ON u.BatchId = b.Id
                    LEFT JOIN Courses c ON u.CourseEnrolledId = c.Id
                    WHERE u.Status = 'verified';";
                return await conn.QueryAsync<dynamic>(sql);
            }
        }

        public async Task<bool> UpdateUserAsync(updateUserDto updateData)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                // Simple implementation, in real app would use a more dynamic Dapper builder
                const string sql = "UPDATE Users SET Fullname = @Fullname, Email = @Email, Phone = @Phone, Role = @Role, Status = @Status, PlanType = @Plan, BatchId = @Batch WHERE Id = @Id;";
                return await conn.ExecuteAsync(sql,updateData ) > 0;
            }
        }

        public async Task<bool> DeleteUserAsync(Guid id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                return await conn.ExecuteAsync("DELETE FROM Users WHERE Id = @Id", new { Id = id }) > 0;
            }
        }

        public async Task<bool> UpdatePasswordAsync(Guid id, string passwordHash)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                return await conn.ExecuteAsync("UPDATE Users SET PasswordHash = @Hash WHERE Id = @Id", new { Id = id, Hash = passwordHash }) > 0;
            }
        }

        public async Task<bool> UpdateUserPlanAsync(Guid id, string plan, string planUpgradedFrom)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = "UPDATE Users SET PlanType = @Plan, PlanUpgradedFrom = @OldPlan, Status = 'unverified' WHERE Id = @Id";
                return await conn.ExecuteAsync(sql, new { Id = id, Plan = plan, OldPlan = planUpgradedFrom }) > 0;
            }
        }

        public async Task IncrementCourseStudentCountAsync(Guid courseId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.ExecuteAsync("UPDATE Courses SET StudentsEnrolled = StudentsEnrolled + 1 WHERE Id = @Id", new { Id = courseId });
            }
        }
    }

}
