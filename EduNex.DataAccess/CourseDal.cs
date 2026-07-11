using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
using EduNex.Models;
using EduNex.Models.Dtos;

namespace EduNex.DataAccess
{
    public interface ICourseDal
    {
        Task<(List<CourseDto> Data, int Total)> ListAsync(int limit, int offset, bool? isActive);
        Task<CourseDto?> GetByIdAsync(Guid id);
        Task<CourseDto?> GetBySlugAsync(string slug);
        Task<CourseDto> InsertAsync(CourseDto course);
        Task<CourseDto?> UpdateAsync(Guid id, CourseDto course);
        Task DeleteAsync(Guid id);
        Task<List<string>> GetAllSlugsAsync();
        Task<int> IncrementViewsAsync(Guid id);
    }

    public class CourseDal : ICourseDal
    {
        private readonly string _connectionString;

        public CourseDal(string connectionString)
        {
            _connectionString = connectionString;
        }

        private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

        public async Task<(List<CourseDto> Data, int Total)> ListAsync(int limit, int offset, bool? isActive)
        {
            using IDbConnection db = CreateConnection();
            
            var conditions = new List<string>();
            if (isActive.HasValue) conditions.Add("is_active = @IsActive");
            var whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";

            var rowsSql = $@"
                SELECT * FROM dbo.courses
                {whereClause}
                ORDER BY created_at DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            var countSql = $"SELECT COUNT(*) FROM dbo.courses {whereClause};";

            var rows = (await db.QueryAsync<CourseDto>(rowsSql, new { Offset = offset, Limit = limit, IsActive = isActive })).ToList();
            var total = await db.ExecuteScalarAsync<int>(countSql, new { IsActive = isActive });

            return (rows, total);
        }

        public async Task<CourseDto?> GetByIdAsync(Guid id)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT * FROM dbo.courses WHERE id = @Id";
            return await db.QuerySingleOrDefaultAsync<CourseDto>(sql, new { Id = id });
        }

        public async Task<CourseDto?> GetBySlugAsync(string slug)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT * FROM dbo.courses WHERE slug = @Slug";
            return await db.QuerySingleOrDefaultAsync<CourseDto>(sql, new { Slug = slug });
        }

        public async Task<CourseDto> InsertAsync(CourseDto course)
        {
            using IDbConnection db = CreateConnection();

            course.Id = Guid.NewGuid();
            course.CreatedAt = DateTimeOffset.UtcNow;
            course.UpdatedAt = DateTimeOffset.UtcNow;

            const string sql = @"
                INSERT INTO dbo.courses (id, title, slug, overview, price, discount, duration_days, course_type, description, information, category_id, image, media_id, is_trending, is_active, views, free_features, half_features, paid_features, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (@Id, @Title, @Slug, @Overview, @Price, @Discount, @DurationDays, @CourseType, @Description, @Information, @CategoryId, @Image, @MediaId, @IsTrending, @IsActive, @Views, @FreeFeatures, @HalfFeatures, @PaidFeatures, @CreatedAt, @UpdatedAt);";

            return await db.QuerySingleAsync<CourseDto>(sql, course);
        }

        public async Task<CourseDto?> UpdateAsync(Guid id, CourseDto course)
        {
            using IDbConnection db = CreateConnection();

            course.UpdatedAt = DateTimeOffset.UtcNow;
            course.Id = id;

            const string sql = @"
                UPDATE dbo.courses
                SET title = @Title,
                    slug = @Slug,
                    overview = @Overview,
                    price = @Price,
                    discount = @Discount,
                    duration_days = @DurationDays,
                    course_type = @CourseType,
                    description = @Description,
                    information = @Information,
                    category_id = @CategoryId,
                    image = @Image,
                    media_id = @MediaId,
                    is_trending = @IsTrending,
                    is_active = @IsActive,
                    free_features = @FreeFeatures,
                    half_features = @HalfFeatures,
                    paid_features = @PaidFeatures,
                    updated_at = @UpdatedAt
                OUTPUT INSERTED.*
                WHERE id = @Id;";

            return await db.QuerySingleOrDefaultAsync<CourseDto>(sql, course);
        }

        public async Task DeleteAsync(Guid id)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "DELETE FROM dbo.courses WHERE id = @Id";
            await db.ExecuteAsync(sql, new { Id = id });
        }

        public async Task<List<string>> GetAllSlugsAsync()
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT slug FROM dbo.courses";
            var slugs = await db.QueryAsync<string>(sql);
            return slugs.ToList();
        }

        public async Task<int> IncrementViewsAsync(Guid id)
        {
            using IDbConnection db = CreateConnection();
            const string sql = @"
                UPDATE dbo.courses SET views = views + 1 WHERE id = @Id;
                SELECT views FROM dbo.courses WHERE id = @Id;";
            return await db.ExecuteScalarAsync<int>(sql, new { Id = id });
        }
    }
}
