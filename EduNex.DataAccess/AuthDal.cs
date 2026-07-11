using System.Data;
using Dapper;
using EduNex.Api.Model;
using EduNex.Models;

namespace EduNex.Api.DataAccess
{
    public interface IAuthDal
    {
        Task<User?> FindUserByEmailAsync(string email);
        Task<User?> FindUserByPhoneAsync(string phone);
        Task<User?> FindUserByIdAsync(Guid id);
        Task<UserAuthState?> GetUserAuthStateAsync(Guid id);

        Task<User> CreateUserAsync(User user);
        Task<StudentProfile> CreateStudentProfileAsync(StudentProfile profile);

        Task<(User User, StudentProfile Profile)> CreateUserWithStudentProfileAsync(
            User user, StudentProfile profile);

        Task<string?> FindCourseTitleByIdAsync(Guid courseId);

        Task RecordFailedLoginAsync(Guid userId, int attempts, bool locked);
        Task RecordSuccessfulLoginAsync(Guid userId);

        Task InsertRefreshTokenAsync(RefreshToken token);
        Task<ActiveRefreshTokenWithUser?> FindActiveRefreshTokenWithUserAsync(string hashedToken);
        Task RevokeRefreshTokenByIdAsync(Guid id);
        Task RevokeRefreshTokenByTokenAsync(string hashedToken);
        Task RevokeAllRefreshTokensForUserAsync(Guid userId);
    }
    public class AuthDal : IAuthDal
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public AuthDal(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<User?> FindUserByEmailAsync(string email)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = "SELECT * FROM dbo.users WHERE email = @Email";
            return await connection.QueryFirstOrDefaultAsync<User>(sql, new { Email = email });
        }

        public async Task<User?> FindUserByPhoneAsync(string phone)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = "SELECT * FROM dbo.users WHERE phone = @Phone";
            return await connection.QueryFirstOrDefaultAsync<User>(sql, new { Phone = phone });
        }

        public async Task<User?> FindUserByIdAsync(Guid id)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = "SELECT * FROM dbo.users WHERE id = @Id";
            return await connection.QueryFirstOrDefaultAsync<User>(sql, new { Id = id });
        }

        // Lightweight per-request auth check (mirrors getUserAuthState).
        public async Task<UserAuthState?> GetUserAuthStateAsync(Guid id)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = "SELECT id AS Id, is_blocked AS IsBlocked FROM dbo.users WHERE id = @Id";
            return await connection.QueryFirstOrDefaultAsync<UserAuthState>(sql, new { Id = id });
        }

        public async Task<User> CreateUserAsync(User user)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await InsertUserAsync(connection, null, user);
        }

        public async Task<StudentProfile> CreateStudentProfileAsync(StudentProfile profile)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await InsertStudentProfileAsync(connection, null, profile);
        }

        public async Task<(User User, StudentProfile Profile)> CreateUserWithStudentProfileAsync(
            User user, StudentProfile profile)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();
            try
            {
                var createdUser = await InsertUserAsync(connection, transaction, user);

                profile.UserId = createdUser.Id;
                var createdProfile = await InsertStudentProfileAsync(connection, transaction, profile);

                transaction.Commit();
                return (createdUser, createdProfile);
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        private static async Task<User> InsertUserAsync(IDbConnection connection, IDbTransaction? transaction, User user)
        {
            const string sql = @"
                INSERT INTO dbo.users
                    (id, first_name, last_name, email, phone, password_hash, role, is_verified, is_blocked)
                OUTPUT INSERTED.*
                VALUES
                    (NEWID(), @FirstName, @LastName, @Email, @Phone, @PasswordHash, @Role, @IsVerified, @IsBlocked)";

            return await connection.QuerySingleAsync<User>(sql, user, transaction);
        }

        private static async Task<StudentProfile> InsertStudentProfileAsync(
            IDbConnection connection, IDbTransaction? transaction, StudentProfile profile)
        {
            const string sql = @"
                INSERT INTO dbo.student_profiles
                    (id, user_id, plan, course_id, payment_image, citizenship_certificate)
                OUTPUT INSERTED.*
                VALUES
                    (NEWID(), @UserId, @Plan, @CourseId, @PaymentImage, @CitizenshipCertificate)";

            return await connection.QuerySingleAsync<StudentProfile>(sql, profile, transaction);
        }

        public async Task<string?> FindCourseTitleByIdAsync(Guid courseId)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = "SELECT title FROM dbo.courses WHERE id = @CourseId";
            return await connection.QueryFirstOrDefaultAsync<string>(sql, new { CourseId = courseId });
        }

        public async Task RecordFailedLoginAsync(Guid userId, int attempts, bool locked)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = @"
                UPDATE dbo.users
                SET failed_login_attempts = @Attempts,
                    login_locked = @Locked,
                    updated_at = SYSDATETIMEOFFSET()
                WHERE id = @UserId";
            await connection.ExecuteAsync(sql, new { UserId = userId, Attempts = attempts, Locked = locked });
        }

        public async Task RecordSuccessfulLoginAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = @"
                UPDATE dbo.users
                SET failed_login_attempts = 0,
                    last_login_at = SYSDATETIMEOFFSET(),
                    updated_at = SYSDATETIMEOFFSET()
                WHERE id = @UserId";
            await connection.ExecuteAsync(sql, new { UserId = userId });
        }

        public async Task InsertRefreshTokenAsync(RefreshToken token)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = @"
                INSERT INTO dbo.refresh_tokens (id, user_id, token, expires_at, is_revoked)
                VALUES (NEWID(), @UserId, @Token, @ExpiresAt, 0)";
            await connection.ExecuteAsync(sql, token);
        }

        public async Task<ActiveRefreshTokenWithUser?> FindActiveRefreshTokenWithUserAsync(string hashedToken)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = @"
                SELECT
                    rt.id            AS Id,
                    rt.user_id       AS UserId,
                    rt.expires_at    AS ExpiresAt,
                    u.role           AS Role,
                    u.is_blocked     AS IsBlocked
                FROM dbo.refresh_tokens rt
                INNER JOIN dbo.users u ON u.id = rt.user_id
                WHERE rt.token = @Token AND rt.is_revoked = 0";
            return await connection.QueryFirstOrDefaultAsync<ActiveRefreshTokenWithUser>(
                sql, new { Token = hashedToken });
        }

        public async Task RevokeRefreshTokenByIdAsync(Guid id)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = "UPDATE dbo.refresh_tokens SET is_revoked = 1 WHERE id = @Id";
            await connection.ExecuteAsync(sql, new { Id = id });
        }

        public async Task RevokeRefreshTokenByTokenAsync(string hashedToken)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = "UPDATE dbo.refresh_tokens SET is_revoked = 1 WHERE token = @Token";
            await connection.ExecuteAsync(sql, new { Token = hashedToken });
        }

        public async Task RevokeAllRefreshTokensForUserAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            const string sql = "UPDATE dbo.refresh_tokens SET is_revoked = 1 WHERE user_id = @UserId";
            await connection.ExecuteAsync(sql, new { UserId = userId });
        }
    }
}