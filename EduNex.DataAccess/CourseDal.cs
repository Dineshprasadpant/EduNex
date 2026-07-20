using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using EduNex.Api.DataAccess;
using EduNex.Models;
using Microsoft.Data.SqlClient;

namespace EduNex.DataAccess
{
    public class CourseFilters
    {
        public string? CourseType { get; set; }
        public string? Search { get; set; }
        public bool? IsTrending { get; set; }
        public bool ActiveOnly { get; set; }
        public Guid? CategoryId { get; set; }
        public bool Uncategorized { get; set; }
    }

    public interface ICourseDal
    {
        Task<(List<CourseListDto> Data, int Total)> FindAllAsync(CourseFilters filters, DalPagination pagination);
        Task<CourseDetailDto?> FindByIdAsync(Guid id);
        Task<CourseListDto?> FindBySlugAsync(string slug);
        Task<CourseDetailDto?> FindEnrolledByUserAsync(Guid userId);
        Task<Course> CreateAsync(CreateCourseRequestDto data, string slug);
        Task<Course?> UpdateAsync(Guid id, UpdateCourseRequestDto data, string? newSlug);
        Task RemoveAsync(Guid id);
        Task<List<string>> FindSlugsAsync();
        Task<int?> IncrementViewsAsync(Guid id);
        Task<List<TopViewedCourseDto>> FindTopViewedAsync(int limit);
    }
    public class CourseDal(IDbConnectionFactory _dbconn) : ICourseDal
    {
        private class CourseListFlatRow
        {
            public Guid Id { get; set; }
            public string Slug { get; set; } = "";
            public string Title { get; set; } = "";
            public string Overview { get; set; } = "";
            public decimal? Price { get; set; }
            public int Discount { get; set; }
            public int DurationDays { get; set; }
            public string CourseTypeValue { get; set; } = CourseType.Offline;
            public string Description { get; set; } = "";
            public Guid? CategoryId { get; set; }
            public string? Image { get; set; }
            public Guid? MediaId { get; set; }
            public bool IsTrending { get; set; }
            public bool IsActive { get; set; }
            public int Views { get; set; }
            public string? FreeFeatures { get; set; }
            public string? HalfFeatures { get; set; }
            public string? PaidFeatures { get; set; }
            public DateTimeOffset CreatedAt { get; set; }
            public DateTimeOffset UpdatedAt { get; set; }
            public string? MediaUrl { get; set; }
            public string? MediaFilename { get; set; }
            public string? MediaMimeType { get; set; }
            public string? CategoryName { get; set; }
            public string? CategorySlug { get; set; }
        }

        private class CourseFullFlatRow : CourseListFlatRow
        {
            public string? Information { get; set; }
        }

        // Equivalent of shapeRow(): nests the flat media_*/category_* columns.
        private static void ShapeInto(CourseListDto dto, CourseListFlatRow r)
        {
            dto.Id = r.Id;
            dto.Slug = r.Slug;
            dto.Title = r.Title;
            dto.Overview = r.Overview;
            dto.Price = r.Price;
            dto.Discount = r.Discount;
            dto.DurationDays = r.DurationDays;
            dto.CourseTypeValue = r.CourseTypeValue;
            dto.Description = r.Description;
            dto.Image = r.Image;
            dto.MediaId = r.MediaId;
            dto.CategoryId = r.CategoryId;
            dto.IsTrending = r.IsTrending;
            dto.IsActive = r.IsActive;
            dto.Views = r.Views;
            dto.FreeFeatures = r.FreeFeatures;
            dto.HalfFeatures = r.HalfFeatures;
            dto.PaidFeatures = r.PaidFeatures;
            dto.CreatedAt = r.CreatedAt;
            dto.UpdatedAt = r.UpdatedAt;
            dto.Media = r.MediaId.HasValue
                ? new MediaSummaryDto { Id = r.MediaId.Value, Url = r.MediaUrl ?? "", Filename = r.MediaFilename ?? "", MimeType = r.MediaMimeType ?? "" }
                : null;
            dto.Category = r.CategoryId.HasValue
                ? new CategorySummaryDto { Id = r.CategoryId.Value, Name = r.CategoryName ?? "", Slug = r.CategorySlug ?? "" }
                : null;
        }

        private static CourseListDto MapListItem(CourseListFlatRow r)
        {
            var dto = new CourseListDto();
            ShapeInto(dto, r);
            return dto;
        }

        private static CourseDetailDto MapDetail(CourseFullFlatRow r)
        {
            var dto = new CourseDetailDto { Information = r.Information };
            ShapeInto(dto, r);
            return dto;
        }

        private const string BaseSelect = @"
            SELECT c.id AS Id, c.slug AS Slug, c.title AS Title, c.overview AS Overview, c.price AS Price,
                   c.discount AS Discount, c.duration_days AS DurationDays, c.course_type AS CourseTypeValue,
                   c.description AS Description, c.category_id AS CategoryId, c.image AS Image, c.media_id AS MediaId,
                   c.is_trending AS IsTrending, c.is_active AS IsActive, c.views AS Views,
                   c.free_features AS FreeFeatures, c.half_features AS HalfFeatures, c.paid_features AS PaidFeatures,
                   c.created_at AS CreatedAt, c.updated_at AS UpdatedAt,
                   m.url AS MediaUrl, m.filename AS MediaFilename, m.mime_type AS MediaMimeType,
                   cat.name AS CategoryName, cat.slug AS CategorySlug
            FROM dbo.courses c
            LEFT JOIN dbo.media m ON m.id = c.media_id
            LEFT JOIN dbo.categories cat ON cat.id = c.category_id";


        public async Task<(List<CourseListDto> Data, int Total)> FindAllAsync(CourseFilters filters, DalPagination pagination)
        {
            var conditions = new List<string>();
            var p = new DynamicParameters();

            if (!string.IsNullOrWhiteSpace(filters.CourseType))
            {
                conditions.Add("c.course_type = @CourseType");
                p.Add("CourseType", filters.CourseType);
            }
            if (!string.IsNullOrWhiteSpace(filters.Search))
            {
                conditions.Add("c.title LIKE @Search");
                p.Add("Search", $"%{filters.Search}%");
            }
            if (filters.IsTrending.HasValue)
            {
                conditions.Add("c.is_trending = @IsTrending");
                p.Add("IsTrending", filters.IsTrending.Value);
            }
            if (filters.ActiveOnly)
            {
                conditions.Add("c.is_active = 1");
            }
            if (filters.CategoryId.HasValue)
            {
                conditions.Add("c.category_id = @CategoryId");
                p.Add("CategoryId", filters.CategoryId.Value);
            }
            if (filters.Uncategorized)
            {
                conditions.Add("c.category_id IS NULL");
            }

            var whereSql = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";
            p.Add("Offset", pagination.Offset);
            p.Add("Limit", pagination.Limit);

            using var connection = _dbconn.CreateConnection();

            var dataSql = $@"
                {BaseSelect}
                {whereSql}
                ORDER BY c.is_trending DESC, c.created_at DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY";
            var rows = (await connection.QueryAsync<CourseListFlatRow>(dataSql, p)).ToList();

            var countSql = $"SELECT COUNT(*) FROM dbo.courses c {whereSql}";
            var total = await connection.QueryFirstOrDefaultAsync<int>(countSql, p);

            return (rows.Select(MapListItem).ToList(), total);
        }

        public async Task<CourseDetailDto?> FindByIdAsync(Guid id)
        {
            using var connection = _dbconn.CreateConnection();
            var row = await connection.QueryFirstOrDefaultAsync<CourseFullFlatRow>(
                $"{BaseSelect} WHERE c.id = @Id", new { Id = id });
            return row is null ? null : MapDetail(row);
        }

        public async Task<CourseListDto?> FindBySlugAsync(string slug)
        {
            using var connection = _dbconn.CreateConnection();
            var row = await connection.QueryFirstOrDefaultAsync<CourseListFlatRow>(
                $"{BaseSelect} WHERE c.slug = @Slug", new { Slug = slug });
            return row is null ? null : MapListItem(row);
        }

        public async Task<CourseDetailDto?> FindEnrolledByUserAsync(Guid userId)
        {
            using var connection = _dbconn.CreateConnection();
            var courseId = await connection.QueryFirstOrDefaultAsync<Guid?>(
                "SELECT TOP 1 course_id FROM dbo.student_profiles WHERE user_id = @UserId", new { UserId = userId });
            if (courseId is null) return null;

            var row = await connection.QueryFirstOrDefaultAsync<CourseFullFlatRow>(
                $"{BaseSelect} WHERE c.id = @Id", new { Id = courseId.Value });
            return row is null ? null : MapDetail(row);
        }

        public async Task<Course> CreateAsync(CreateCourseRequestDto data, string slug)
        {
            using var connection = _dbconn.CreateConnection();
            const string sql = @"
                INSERT INTO dbo.courses
                    (id, slug, title, overview, price, discount, duration_days, course_type, description,
                     information, category_id, image, media_id, is_trending, is_active,
                     free_features, half_features, paid_features)
                OUTPUT INSERTED.*
                VALUES
                    (NEWID(), @Slug, @Title, @Overview, @Price, @Discount, @DurationDays, @CourseTypeValue, @Description,
                     @Information, @CategoryId, @Image, @MediaId, @IsTrending, @IsActive,
                     @FreeFeatures, @HalfFeatures, @PaidFeatures)";
            return await connection.QuerySingleAsync<Course>(sql, new
            {
                Slug = slug,
                data.Title,
                data.Overview,
                data.Price,
                data.Discount,
                data.DurationDays,
                data.CourseTypeValue,
                data.Description,
                data.Information,
                data.CategoryId,
                data.Image,
                data.MediaId,
                data.IsTrending,
                data.IsActive,
                data.FreeFeatures,
                data.HalfFeatures,
                data.PaidFeatures,
            });
        }

        public async Task<Course?> UpdateAsync(Guid id, UpdateCourseRequestDto data, string? newSlug)
        {
            var sets = new List<string> { "updated_at = SYSDATETIMEOFFSET()" };
            var p = new DynamicParameters();
            p.Add("Id", id);

            if (newSlug is not null) { sets.Add("slug = @Slug"); p.Add("Slug", newSlug); }
            if (data.Title is not null) { sets.Add("title = @Title"); p.Add("Title", data.Title); }
            if (data.Overview is not null) { sets.Add("overview = @Overview"); p.Add("Overview", data.Overview); }
            if (data.Price.HasValue) { sets.Add("price = @Price"); p.Add("Price", data.Price.Value); }
            if (data.Discount.HasValue) { sets.Add("discount = @Discount"); p.Add("Discount", data.Discount.Value); }
            if (data.DurationDays.HasValue) { sets.Add("duration_days = @DurationDays"); p.Add("DurationDays", data.DurationDays.Value); }
            if (data.CourseTypeValue is not null) { sets.Add("course_type = @CourseTypeValue"); p.Add("CourseTypeValue", data.CourseTypeValue); }
            if (data.Description is not null) { sets.Add("description = @Description"); p.Add("Description", data.Description); }
            if (data.Information is not null) { sets.Add("information = @Information"); p.Add("Information", data.Information); }
            if (data.CategoryId.HasValue) { sets.Add("category_id = @CategoryId"); p.Add("CategoryId", data.CategoryId.Value); }
            if (data.Image is not null) { sets.Add("image = @Image"); p.Add("Image", data.Image); }
            if (data.MediaId.HasValue) { sets.Add("media_id = @MediaId"); p.Add("MediaId", data.MediaId.Value); }
            if (data.IsTrending.HasValue) { sets.Add("is_trending = @IsTrending"); p.Add("IsTrending", data.IsTrending.Value); }
            if (data.IsActive.HasValue) { sets.Add("is_active = @IsActive"); p.Add("IsActive", data.IsActive.Value); }
            if (data.FreeFeatures is not null) { sets.Add("free_features = @FreeFeatures"); p.Add("FreeFeatures", data.FreeFeatures); }
            if (data.HalfFeatures is not null) { sets.Add("half_features = @HalfFeatures"); p.Add("HalfFeatures", data.HalfFeatures); }
            if (data.PaidFeatures is not null) { sets.Add("paid_features = @PaidFeatures"); p.Add("PaidFeatures", data.PaidFeatures); }

            var sql = $"UPDATE dbo.courses SET {string.Join(", ", sets)} OUTPUT INSERTED.* WHERE id = @Id";
            using var connection = _dbconn.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<Course>(sql, p);
        }

        public async Task RemoveAsync(Guid id)
        {
            using var connection = _dbconn.CreateConnection();
            await connection.ExecuteAsync("DELETE FROM dbo.courses WHERE id = @Id", new { Id = id });
        }

        public async Task<List<string>> FindSlugsAsync()
        {
            using var connection = _dbconn.CreateConnection();
            return (await connection.QueryAsync<string>("SELECT slug FROM dbo.courses")).ToList();
        }

        public async Task<int?> IncrementViewsAsync(Guid id)
        {
            using var connection = _dbconn.CreateConnection();
            const string sql = @"
                UPDATE dbo.courses SET views = views + 1
                OUTPUT INSERTED.views
                WHERE id = @Id";
            return await connection.QueryFirstOrDefaultAsync<int?>(sql, new { Id = id });
        }

        public async Task<List<TopViewedCourseDto>> FindTopViewedAsync(int limit)
        {
            using var connection = _dbconn.CreateConnection();
            const string sql = @"
                SELECT TOP (@Limit) id AS Id, slug AS Slug, title AS Title, views AS Views
                FROM dbo.courses
                ORDER BY views DESC";
            return (await connection.QueryAsync<TopViewedCourseDto>(sql, new { Limit = limit })).ToList();
        }
    }
}