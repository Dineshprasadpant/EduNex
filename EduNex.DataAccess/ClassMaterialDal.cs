using Dapper;
using EduNex.Api.DataAccess;
using EduNex.Models;
using EduNex.Models.Dtos;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;

namespace EduNex.DataAccess
{
    public interface IClassMaterialDal
    {
        Task<(List<ClassMaterialDetailDto> Data, int Total)> FindAllAsync(
            string? search, Guid? courseId, int limit, int offset);
        Task<ClassMaterialDetailDto?> FindDetailByIdAsync(Guid id);
        Task<ClassMaterial> CreateAsync(ClassMaterial material);
        Task<ClassMaterial?> UpdateAsync(Guid id, UpdateClassMaterialRequest input, string? newFileUrl);
        Task RemoveAsync(Guid id);
        Task<Guid?> FindStudentCourseIdAsync(Guid userId);
        Task<List<string>> FindEnrolledEmailsByCourseAsync(Guid courseId);
    }

    public class ClassMaterialDal(IDbConnectionFactory _dbconn) : IClassMaterialDal
    {

        private const string DetailColumns = @"
            cm.id, cm.title, cm.description, cm.file_url, cm.media_id, cm.course_id,
            cm.created_at, cm.updated_at,
            m.url AS media_url, m.s3_key AS media_s3_key, m.original_name AS media_original_name,
            m.mime_type AS media_mime_type, m.size AS media_size,
            c.title AS course_title, c.slug AS course_slug,
            u.first_name AS created_by_first_name, u.last_name AS created_by_last_name";

        private const string DetailJoins = @"
            FROM dbo.class_materials cm
            LEFT JOIN dbo.users u ON u.id = cm.created_by
            LEFT JOIN dbo.media m ON m.id = cm.media_id
            LEFT JOIN dbo.courses c ON c.id = cm.course_id";


        public async Task<(List<ClassMaterialDetailDto> Data, int Total)> FindAllAsync(
            string? search, Guid? courseId, int limit, int offset)
        {
            using IDbConnection db = _dbconn.CreateConnection();

            var conditions = new List<string>();
            if (!string.IsNullOrEmpty(search)) conditions.Add("cm.title LIKE @Search");
            if (courseId.HasValue) conditions.Add("cm.course_id = @CourseId");

            var whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";
            var searchPattern = string.IsNullOrEmpty(search) ? null : $"%{search}%";

            var rowsSql = $@"
                SELECT {DetailColumns}
                {DetailJoins}
                {whereClause}
                ORDER BY cm.created_at DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            var countSql = $"SELECT COUNT(*) FROM dbo.class_materials cm {whereClause};";

            var parameters = new { Search = searchPattern, CourseId = courseId, Offset = offset, Limit = limit };

            var rows = (await db.QueryAsync<ClassMaterialDetailDto, MediaDetailJoinFields, CourseSummaryJoinFields, CreatedByJoinFields, ClassMaterialDetailDto>(
                rowsSql,
                (material, mediaFields, courseFields, createdByFields) => Attach(material, mediaFields, courseFields, createdByFields),
                parameters,
                splitOn: "media_url,course_title,created_by_first_name"
            )).ToList();

            var total = await db.ExecuteScalarAsync<int>(countSql, parameters);

            return (rows, total);
        }

        public async Task<ClassMaterialDetailDto?> FindDetailByIdAsync(Guid id)
        {
            using IDbConnection db = _dbconn.CreateConnection();

            var sql = $@"
                SELECT {DetailColumns}
                {DetailJoins}
                WHERE cm.id = @Id;";

            var rows = await db.QueryAsync<ClassMaterialDetailDto, MediaDetailJoinFields, CourseSummaryJoinFields, CreatedByJoinFields, ClassMaterialDetailDto>(
                sql,
                (material, mediaFields, courseFields, createdByFields) => Attach(material, mediaFields, courseFields, createdByFields),
                new { Id = id },
                splitOn: "media_url,course_title,created_by_first_name"
            );

            return rows.SingleOrDefault();
        }

        public async Task<ClassMaterial> CreateAsync(ClassMaterial material)
        {
            using IDbConnection db = _dbconn.CreateConnection();

            material.Id = Guid.NewGuid();
            material.CreatedAt = DateTimeOffset.UtcNow;
            material.UpdatedAt = DateTimeOffset.UtcNow;

            const string sql = @"
                INSERT INTO dbo.class_materials
                    (id, title, description, media_id, course_id, file_url, created_by, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES
                    (@Id, @Title, @Description, @MediaId, @CourseId, @FileUrl, @CreatedBy, @CreatedAt, @UpdatedAt);";

            return await db.QuerySingleAsync<ClassMaterial>(sql, material);
        }

        // Genuine partial update - only the fields actually provided end up
        // in the SQL SET clause, built dynamically via DynamicParameters.
        // Safe to do here (unlike the merge-trick used in most other
        // modules) because none of these fields can legitimately be sent
        // as an explicit null in the schema - "provided" and "should be
        // updated" are the same condition for every field on this DTO.
        public async Task<ClassMaterial?> UpdateAsync(Guid id, UpdateClassMaterialRequest input, string? newFileUrl)
        {
            using IDbConnection db = _dbconn.CreateConnection();

            var setClauses = new List<string> { "updated_at = @UpdatedAt" };
            var parameters = new DynamicParameters();
            parameters.Add("Id", id);
            parameters.Add("UpdatedAt", DateTimeOffset.UtcNow);

            if (input.Title != null)
            {
                setClauses.Add("title = @Title");
                parameters.Add("Title", input.Title);
            }
            if (input.Description != null)
            {
                setClauses.Add("description = @Description");
                parameters.Add("Description", input.Description);
            }
            if (input.MediaId.HasValue)
            {
                setClauses.Add("media_id = @MediaId");
                parameters.Add("MediaId", input.MediaId.Value);
                setClauses.Add("file_url = @FileUrl");
                parameters.Add("FileUrl", newFileUrl);
            }
            if (input.CourseId.HasValue)
            {
                setClauses.Add("course_id = @CourseId");
                parameters.Add("CourseId", input.CourseId.Value);
            }

            var sql = $@"
                UPDATE dbo.class_materials
                SET {string.Join(", ", setClauses)}
                OUTPUT INSERTED.*
                WHERE id = @Id;";

            return await db.QuerySingleOrDefaultAsync<ClassMaterial>(sql, parameters);
        }

        public async Task RemoveAsync(Guid id)
        {
            using IDbConnection db = _dbconn.CreateConnection();
            const string sql = "DELETE FROM dbo.class_materials WHERE id = @Id";
            await db.ExecuteAsync(sql, new { Id = id });
        }

        public async Task<Guid?> FindStudentCourseIdAsync(Guid userId)
        {
            using IDbConnection db = _dbconn.CreateConnection();
            const string sql = "SELECT TOP 1 course_id FROM dbo.student_profiles WHERE user_id = @UserId";
            return await db.QuerySingleOrDefaultAsync<Guid?>(sql, new { UserId = userId });
        }

        public async Task<List<string>> FindEnrolledEmailsByCourseAsync(Guid courseId)
        {
            using IDbConnection db = _dbconn.CreateConnection();
            const string sql = @"
                SELECT u.email
                FROM dbo.student_profiles sp
                INNER JOIN dbo.users u ON u.id = sp.user_id
                WHERE sp.course_id = @CourseId;";
            var rows = await db.QueryAsync<string>(sql, new { CourseId = courseId });
            return rows.ToList();
        }

        private static ClassMaterialDetailDto Attach(
            ClassMaterialDetailDto material,
            MediaDetailJoinFields mediaFields,
            CourseSummaryJoinFields courseFields,
            CreatedByJoinFields createdByFields)
        {
            material.Media = material.MediaId.HasValue
                ? new MediaDetailDto
                {
                    Id = material.MediaId.Value,
                    Url = mediaFields.MediaUrl,
                    S3Key = mediaFields.MediaS3Key,
                    OriginalName = mediaFields.MediaOriginalName ?? string.Empty,
                    MimeType = mediaFields.MediaMimeType ?? string.Empty,
                    Size = mediaFields.MediaSize ?? 0
                }
                : null;

            material.Course = material.CourseId.HasValue
                ? new CourseSummaryDto
                {
                    Id = material.CourseId.Value,
                    Title = courseFields.CourseTitle ?? string.Empty,
                    Slug = courseFields.CourseSlug ?? string.Empty
                }
                : null;

            // CreatedBy has no FK column reused as its id the way Media/
            // Course do (created_by_first_name/last_name carry no id of
            // their own) - if you need CreatedBy.Id in responses, add
            // u.id AS created_by_id to DetailColumns and wire it through.
            material.CreatedBy = createdByFields.CreatedByFirstName != null
                ? new CreatedByDto
                {
                    FirstName = createdByFields.CreatedByFirstName,
                    LastName = createdByFields.CreatedByLastName ?? string.Empty
                }
                : null;

            return material;
        }
    }
}