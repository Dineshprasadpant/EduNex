using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
using EduNex.Models;
namespace EduNex.DataAccess
{
    public interface IUserDal
    {
        Task<(List<UserListItemDto> Data, int Total)> ListAsync(
            string? role, string? search, bool? isVerified, int limit, int offset);

        Task<User?> GetByIdAsync(Guid id);
        Task<bool> EmailExistsAsync(string email, Guid? excludeId = null);
        Task<bool> PhoneExistsAsync(string phone, Guid? excludeId = null);
        Task<User> InsertUserAsync(User user);
        Task<User?> UpdateUserAsync(User user);
        Task<User?> SetVerifiedAsync(Guid id);
        Task<User?> SetBlockedAsync(Guid id, bool blocked);
        Task<User?> UnlockAsync(Guid id);
        Task UpdatePasswordHashAsync(Guid id, string passwordHash);
        Task RevokeAllRefreshTokensAsync(Guid userId);

        Task<StudentProfile?> GetStudentProfileByUserIdAsync(Guid userId);
        Task<StudentProfile> InsertStudentProfileAsync(StudentProfile profile);
        Task<StudentProfile?> UpdateStudentProfileFieldsAsync(
            Guid userId, string? plan, Guid? courseId, string? paymentImage, string? citizenshipCertificate);
        Task SetStudentInitialVerificationAsync(Guid userId);

        Task<TeacherProfile?> GetTeacherProfileByUserIdAsync(Guid userId);
        Task<TeacherProfile> InsertTeacherProfileAsync(TeacherProfile profile);
        Task<TeacherProfile?> UpdateTeacherProfileFieldsAsync(
            Guid userId, string? bio, string? specialization, bool? enableDisplayInAbout);

        Task<List<TeacherCourseDto>> GetTeacherCoursesAsync(Guid teacherProfileId);
        Task InsertTeacherCoursesAsync(Guid teacherProfileId, IEnumerable<Guid> courseIds);
        Task DeleteTeacherCoursesAsync(Guid teacherProfileId);

        Task<Course?> GetCourseByIdAsync(Guid id);
        Task<List<TeacherAboutDto>> GetTeachersForAboutAsync();
    }

    public class UserDal : IUserDal
    {
        private readonly string _connectionString;

        public UserDal(string connectionString)
        {
            _connectionString = connectionString;
        }

        private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

        // ---- List / read -------------------------------------------------

        public async Task<(List<UserListItemDto> Data, int Total)> ListAsync(
            string? role, string? search, bool? isVerified, int limit, int offset)
        {
            using IDbConnection db = CreateConnection();

            var conditions = new List<string>();
            if (role != null) conditions.Add("role = @Role");
            if (isVerified.HasValue) conditions.Add("is_verified = @IsVerified");
            if (!string.IsNullOrEmpty(search))
                conditions.Add("(first_name LIKE @Search OR last_name LIKE @Search OR email LIKE @Search)");

            var whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";
            var searchPattern = string.IsNullOrEmpty(search) ? null : $"%{search}%";

            var rowsSql = $@"
                SELECT id, first_name, last_name, email, phone, role, image,
                       is_verified, is_blocked, login_locked, last_login_at, created_at, updated_at
                FROM dbo.users
                {whereClause}
                ORDER BY created_at DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            var countSql = $"SELECT COUNT(*) FROM dbo.users {whereClause};";

            var parameters = new { Role = role, IsVerified = isVerified, Search = searchPattern, Offset = offset, Limit = limit };

            var rows = (await db.QueryAsync<UserListItemDto>(rowsSql, parameters)).ToList();
            var total = await db.ExecuteScalarAsync<int>(countSql, parameters);

            return (rows, total);
        }

        public async Task<User?> GetByIdAsync(Guid id)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT * FROM dbo.users WHERE id = @Id";
            return await db.QuerySingleOrDefaultAsync<User>(sql, new { Id = id });
        }

        public async Task<bool> EmailExistsAsync(string email, Guid? excludeId = null)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT COUNT(1) FROM dbo.users WHERE email = @Email AND (@ExcludeId IS NULL OR id <> @ExcludeId)";
            var count = await db.ExecuteScalarAsync<int>(sql, new { Email = email, ExcludeId = excludeId });
            return count > 0;
        }

        public async Task<bool> PhoneExistsAsync(string phone, Guid? excludeId = null)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT COUNT(1) FROM dbo.users WHERE phone = @Phone AND (@ExcludeId IS NULL OR id <> @ExcludeId)";
            var count = await db.ExecuteScalarAsync<int>(sql, new { Phone = phone, ExcludeId = excludeId });
            return count > 0;
        }

        // ---- User write ---------------------------------------------------

        public async Task<User> InsertUserAsync(User user)
        {
            using IDbConnection db = CreateConnection();

            user.Id = Guid.NewGuid();
            user.CreatedAt = DateTimeOffset.UtcNow;
            user.UpdatedAt = DateTimeOffset.UtcNow;

            const string sql = @"
                INSERT INTO dbo.users
                    (id, first_name, last_name, email, phone, password_hash, role, image,
                     is_verified, is_blocked, login_locked, failed_login_attempts, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES
                    (@Id, @FirstName, @LastName, @Email, @Phone, @PasswordHash, @Role, @Image,
                     @IsVerified, @IsBlocked, @LoginLocked, @FailedLoginAttempts, @CreatedAt, @UpdatedAt);";

            return await db.QuerySingleAsync<User>(sql, user);
        }

        public async Task<User?> UpdateUserAsync(User user)
        {
            using IDbConnection db = CreateConnection();

            user.UpdatedAt = DateTimeOffset.UtcNow;

            const string sql = @"
                UPDATE dbo.users
                SET first_name = @FirstName,
                    last_name = @LastName,
                    email = @Email,
                    phone = @Phone,
                    image = @Image,
                    is_verified = @IsVerified,
                    is_blocked = @IsBlocked,
                    login_locked = @LoginLocked,
                    updated_at = @UpdatedAt
                OUTPUT INSERTED.*
                WHERE id = @Id;";

            return await db.QuerySingleOrDefaultAsync<User>(sql, user);
        }

        public async Task<User?> SetVerifiedAsync(Guid id)
        {
            using IDbConnection db = CreateConnection();
            const string sql = @"
                UPDATE dbo.users
                SET is_verified = 1, updated_at = @Now
                OUTPUT INSERTED.*
                WHERE id = @Id;";
            return await db.QuerySingleOrDefaultAsync<User>(sql, new { Id = id, Now = DateTimeOffset.UtcNow });
        }

        public async Task<User?> SetBlockedAsync(Guid id, bool blocked)
        {
            using IDbConnection db = CreateConnection();
            const string sql = @"
                UPDATE dbo.users
                SET is_blocked = @Blocked, updated_at = @Now
                OUTPUT INSERTED.*
                WHERE id = @Id;";
            return await db.QuerySingleOrDefaultAsync<User>(sql, new { Id = id, Blocked = blocked, Now = DateTimeOffset.UtcNow });
        }

        public async Task<User?> UnlockAsync(Guid id)
        {
            using IDbConnection db = CreateConnection();
            const string sql = @"
                UPDATE dbo.users
                SET login_locked = 0, failed_login_attempts = 0, updated_at = @Now
                OUTPUT INSERTED.*
                WHERE id = @Id;";
            return await db.QuerySingleOrDefaultAsync<User>(sql, new { Id = id, Now = DateTimeOffset.UtcNow });
        }

        public async Task UpdatePasswordHashAsync(Guid id, string passwordHash)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "UPDATE dbo.users SET password_hash = @PasswordHash, updated_at = @Now WHERE id = @Id";
            await db.ExecuteAsync(sql, new { Id = id, PasswordHash = passwordHash, Now = DateTimeOffset.UtcNow });
        }

        public async Task RevokeAllRefreshTokensAsync(Guid userId)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "UPDATE dbo.refresh_tokens SET is_revoked = 1 WHERE user_id = @UserId";
            await db.ExecuteAsync(sql, new { UserId = userId });
        }

        // ---- Student profile ------------------------------------------------

        public async Task<StudentProfile?> GetStudentProfileByUserIdAsync(Guid userId)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT * FROM dbo.student_profiles WHERE user_id = @UserId";
            return await db.QuerySingleOrDefaultAsync<StudentProfile>(sql, new { UserId = userId });
        }

        public async Task<StudentProfile> InsertStudentProfileAsync(StudentProfile profile)
        {
            using IDbConnection db = CreateConnection();

            profile.Id = Guid.NewGuid();
            profile.CreatedAt = DateTimeOffset.UtcNow;
            profile.UpdatedAt = DateTimeOffset.UtcNow;

            const string sql = @"
                INSERT INTO dbo.student_profiles
                    (id, user_id, plan, course_id, payment_image, citizenship_certificate,
                     initial_verification, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES
                    (@Id, @UserId, @Plan, @CourseId, @PaymentImage, @CitizenshipCertificate,
                     @InitialVerification, @CreatedAt, @UpdatedAt);";

            return await db.QuerySingleAsync<StudentProfile>(sql, profile);
        }

        public async Task<StudentProfile?> UpdateStudentProfileFieldsAsync(
            Guid userId, string? plan, Guid? courseId, string? paymentImage, string? citizenshipCertificate)
        {
            using IDbConnection db = CreateConnection();
            const string sql = @"
                UPDATE dbo.student_profiles
                SET plan = @Plan,
                    course_id = @CourseId,
                    payment_image = @PaymentImage,
                    citizenship_certificate = @CitizenshipCertificate,
                    updated_at = @Now
                OUTPUT INSERTED.*
                WHERE user_id = @UserId;";

            return await db.QuerySingleOrDefaultAsync<StudentProfile>(sql, new
            {
                UserId = userId,
                Plan = plan,
                CourseId = courseId,
                PaymentImage = paymentImage,
                CitizenshipCertificate = citizenshipCertificate,
                Now = DateTimeOffset.UtcNow
            });
        }

        public async Task SetStudentInitialVerificationAsync(Guid userId)
        {
            using IDbConnection db = CreateConnection();
            const string sql = @"
                UPDATE dbo.student_profiles
                SET initial_verification = 1, updated_at = @Now
                WHERE user_id = @UserId;";
            await db.ExecuteAsync(sql, new { UserId = userId, Now = DateTimeOffset.UtcNow });
        }

        // ---- Teacher profile ------------------------------------------------

        public async Task<TeacherProfile?> GetTeacherProfileByUserIdAsync(Guid userId)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT * FROM dbo.teacher_profiles WHERE user_id = @UserId";
            return await db.QuerySingleOrDefaultAsync<TeacherProfile>(sql, new { UserId = userId });
        }

        public async Task<TeacherProfile> InsertTeacherProfileAsync(TeacherProfile profile)
        {
            using IDbConnection db = CreateConnection();

            profile.Id = Guid.NewGuid();
            profile.CreatedAt = DateTimeOffset.UtcNow;
            profile.UpdatedAt = DateTimeOffset.UtcNow;

            const string sql = @"
                INSERT INTO dbo.teacher_profiles
                    (id, user_id, bio, specialization, enable_display_in_about, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES
                    (@Id, @UserId, @Bio, @Specialization, @EnableDisplayInAbout, @CreatedAt, @UpdatedAt);";

            return await db.QuerySingleAsync<TeacherProfile>(sql, profile);
        }

        public async Task<TeacherProfile?> UpdateTeacherProfileFieldsAsync(
            Guid userId, string? bio, string? specialization, bool? enableDisplayInAbout)
        {
            using IDbConnection db = CreateConnection();
            const string sql = @"
                UPDATE dbo.teacher_profiles
                SET bio = @Bio,
                    specialization = @Specialization,
                    enable_display_in_about = @EnableDisplayInAbout,
                    updated_at = @Now
                OUTPUT INSERTED.*
                WHERE user_id = @UserId;";

            return await db.QuerySingleOrDefaultAsync<TeacherProfile>(sql, new
            {
                UserId = userId,
                Bio = bio,
                Specialization = specialization,
                EnableDisplayInAbout = enableDisplayInAbout ?? false,
                Now = DateTimeOffset.UtcNow
            });
        }

        // ---- Teacher courses ------------------------------------------------

        public async Task<List<TeacherCourseDto>> GetTeacherCoursesAsync(Guid teacherProfileId)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT * FROM dbo.teacher_courses WHERE teacher_profile_id = @TeacherProfileId";
            var rows = await db.QueryAsync<TeacherCourseDto>(sql, new { TeacherProfileId = teacherProfileId });
            return rows.ToList();
        }

        public async Task InsertTeacherCoursesAsync(Guid teacherProfileId, IEnumerable<Guid> courseIds)
        {
            var ids = courseIds.ToList();
            if (ids.Count == 0) return;

            using IDbConnection db = CreateConnection();
            const string sql = @"
                INSERT INTO dbo.teacher_courses (id, teacher_profile_id, course_id, assigned_at)
                VALUES (@Id, @TeacherProfileId, @CourseId, @AssignedAt);";

            var now = DateTimeOffset.UtcNow;
            var rows = ids.Select(courseId => new
            {
                Id = Guid.NewGuid(),
                TeacherProfileId = teacherProfileId,
                CourseId = courseId,
                AssignedAt = now
            });

            await db.ExecuteAsync(sql, rows);
        }

        public async Task DeleteTeacherCoursesAsync(Guid teacherProfileId)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "DELETE FROM dbo.teacher_courses WHERE teacher_profile_id = @TeacherProfileId";
            await db.ExecuteAsync(sql, new { TeacherProfileId = teacherProfileId });
        }

        // ---- Courses (for verification mail content) --------------------

        public async Task<Course?> GetCourseByIdAsync(Guid id)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT * FROM dbo.courses WHERE id = @Id";
            return await db.QuerySingleOrDefaultAsync<Course>(sql, new { Id = id });
        }

        // ---- Public "about" listing ---------------------------------------

        public async Task<List<TeacherAboutDto>> GetTeachersForAboutAsync()
        {
            using IDbConnection db = CreateConnection();

            const string profilesSql = @"
                SELECT
                    tp.id, tp.user_id, tp.bio, tp.specialization,
                    u.first_name, u.last_name, u.image
                FROM dbo.teacher_profiles tp
                INNER JOIN dbo.users u ON u.id = tp.user_id
                WHERE tp.enable_display_in_about = 1;";

            var profiles = (await db.QueryAsync<TeacherAboutDto>(profilesSql)).ToList();
            if (profiles.Count == 0) return profiles;

            // Same N+1 pattern as usersRepository.findTeachersForAbout
            // (Promise.all over profiles.map(...)) - not optimized into a
            // single join here on purpose, to keep behavior identical.
            const string coursesSql = @"
                SELECT tc.course_id AS CourseId, c.title AS Title
                FROM dbo.teacher_courses tc
                INNER JOIN dbo.courses c ON c.id = tc.course_id
                WHERE tc.teacher_profile_id = @TeacherProfileId;";

            foreach (var profile in profiles)
            {
                var courses = await db.QueryAsync<TeacherAboutCourseDto>(coursesSql, new { TeacherProfileId = profile.Id });
                profile.Courses = courses.ToList();
            }

            return profiles;
        }
    }
}