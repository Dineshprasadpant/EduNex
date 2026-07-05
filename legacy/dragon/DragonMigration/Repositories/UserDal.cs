using System;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using Dragon.Models;
using Microsoft.Data.SqlClient;

namespace Dragon.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly string _connectionString;

        public UserRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        private IDbConnection Connection => new SqlConnection(_connectionString);

        public async Task<User> GetUserByEmailAsync(string email)
        {
            using (var db = Connection)
            {
                const string sql = "SELECT * FROM Users WHERE Email = @Email";
                return await db.QueryFirstOrDefaultAsync<User>(sql, new { Email = email });
            }
        }

        public async Task<User> GetUserByIdAsync(Guid id)
        {
            using (var db = Connection)
            {
                const string sql = "SELECT * FROM Users WHERE Id = @Id";
                return await db.QueryFirstOrDefaultAsync<User>(sql, new { Id = id });
            }
        }

        public async Task<Guid> CreateUserAsync(User user)
        {
            using (var db = Connection)
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
                
                await db.ExecuteAsync(sql, new {
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
            using (var db = Connection)
            {
                const string sql = "UPDATE Users SET BatchId = @BatchId, Status = @Status WHERE Id = @Id";
                var rows = await db.ExecuteAsync(sql, new { 
                    Id = userId, 
                    BatchId = batchId, 
                    Status = status.ToString().ToLower() 
                });
                return rows > 0;
            }
        }

        public async Task SavePaymentImageAsync(Guid userId, string imageUrl, int batchIndex)
        {
            using (var db = Connection)
            {
                const string sql = "INSERT INTO UserPaymentImages (UserId, ImageUrl, BatchIndex) VALUES (@UserId, @ImageUrl, @BatchIndex)";
                await db.ExecuteAsync(sql, new { UserId = userId, ImageUrl = imageUrl, BatchIndex = batchIndex });
            }
        }

        public async Task<(IEnumerable<dynamic> Users, int Total)> SearchByFullnameAsync(string searchTerm, int page, int limit)
        {
            using (var db = Connection)
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
                
                using (var multi = await db.QueryMultipleAsync(sql, new { 
                    Search = $"%{searchTerm}%", 
                    Offset = (page - 1) * limit, 
                    Limit = limit 
                }))
                {
                    return (await multi.ReadAsync<dynamic>(), await multi.ReadFirstAsync<int>());
                }
            }
        }

        public async Task<IEnumerable<dynamic>> GetUnverifiedUsersAsync()
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT u.*, b.BatchName, c.Title as CourseTitle
                    FROM Users u
                    LEFT JOIN Batches b ON u.BatchId = b.Id
                    LEFT JOIN Courses c ON u.CourseEnrolledId = c.Id
                    WHERE u.Status = 'unverified' AND u.Role = 'user';";
                return await db.QueryAsync<dynamic>(sql);
            }
        }

        public async Task<IEnumerable<dynamic>> GetVerifiedUsersAsync()
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT u.*, b.BatchName, c.Title as CourseTitle
                    FROM Users u
                    LEFT JOIN Batches b ON u.BatchId = b.Id
                    LEFT JOIN Courses c ON u.CourseEnrolledId = c.Id
                    WHERE u.Status = 'verified';";
                return await db.QueryAsync<dynamic>(sql);
            }
        }

        public async Task<bool> UpdateUserAsync(Guid id, object updateData)
        {
            using (var db = Connection)
            {
                // Simple implementation, in real app would use a more dynamic Dapper builder
                const string sql = "UPDATE Users SET Fullname = @Fullname, Phone = @Phone WHERE Id = @Id";
                return await db.ExecuteAsync(sql, new { Id = id, Fullname = ((dynamic)updateData).Fullname, Phone = ((dynamic)updateData).Phone }) > 0;
            }
        }

        public async Task<bool> DeleteUserAsync(Guid id)
        {
            using (var db = Connection)
            {
                return await db.ExecuteAsync("DELETE FROM Users WHERE Id = @Id", new { Id = id }) > 0;
            }
        }

        public async Task<bool> UpdatePasswordAsync(Guid id, string passwordHash)
        {
            using (var db = Connection)
            {
                return await db.ExecuteAsync("UPDATE Users SET PasswordHash = @Hash WHERE Id = @Id", new { Id = id, Hash = passwordHash }) > 0;
            }
        }

        public async Task<bool> UpdateUserPlanAsync(Guid id, string plan, string planUpgradedFrom)
        {
            using (var db = Connection)
            {
                const string sql = "UPDATE Users SET PlanType = @Plan, PlanUpgradedFrom = @OldPlan, Status = 'unverified' WHERE Id = @Id";
                return await db.ExecuteAsync(sql, new { Id = id, Plan = plan, OldPlan = planUpgradedFrom }) > 0;
            }
        }

        public async Task IncrementCourseStudentCountAsync(Guid courseId)
        {
            using (var db = Connection)
            {
                await db.ExecuteAsync("UPDATE Courses SET StudentsEnrolled = StudentsEnrolled + 1 WHERE Id = @Id", new { Id = courseId });
            }
        }
    }
}
