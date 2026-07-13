using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
using EduNex.Models;
using EduNex.Api.DataAccess;

namespace EduNex.DataAccess
{
    // Internal filter/transport type - mirrors the TS inline filters object.
    public class AnnouncementFilters
    {
        public string? Search { get; set; }
        public string? Privacy { get; set; }
        public Guid? EnrolledCourseId { get; set; }
    }

    public interface IAnnouncementDal
    {
        Task<(List<AnnouncementDto> Data, int Total)> FindAllAsync(AnnouncementFilters filters, int limit, int offset);
        Task<AnnouncementDetailDto?> FindByIdAsync(Guid id);
        Task<Announcement> CreateAsync(Announcement announcement, List<Guid>? resourceMediaIds);
        Task<Announcement?> UpdateAsync(Guid id, Announcement mergedFields, List<Guid>? resourceMediaIds);
        Task RemoveAsync(Guid id);

        Task<List<string>> GetSubscriberEmailsAsync(); // unused by the service - kept for parity
        Task<List<string>> GetAllUserEmailsAsync();
        Task<List<string>> GetEnrolledUserEmailsAsync(Guid courseId);
        Task<Guid?> FindStudentCourseIdAsync(Guid userId);
    }

    public class AnnouncementDal(IDbConnectionFactory _dbconn) : IAnnouncementDal
    {

        public async Task<(List<AnnouncementDto> Data, int Total)> FindAllAsync(
            AnnouncementFilters filters, int limit, int offset)
        {
            using IDbConnection db = _dbconn.CreateConnection();

            var conditions = new List<string>();
            if (!string.IsNullOrEmpty(filters.Search)) conditions.Add("a.title LIKE @Search");
            if (!string.IsNullOrEmpty(filters.Privacy)) conditions.Add("a.privacy = @Privacy");
            if (filters.EnrolledCourseId.HasValue)
            {
                conditions.Add(@"
                    (a.privacy = 'public'
                     OR a.course_id = @EnrolledCourseId
                     OR (a.privacy = 'enrolled' AND a.course_id IS NULL))");
            }

            var whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";
            var searchPattern = string.IsNullOrEmpty(filters.Search) ? null : $"%{filters.Search}%";

            var rowsSql = $@"
                SELECT
                    a.id, a.title, a.image, a.media_id, a.description, a.privacy, a.course_id,
                    a.created_at, a.updated_at,
                    m.url AS media_url, m.filename AS media_filename, m.mime_type AS media_mime_type
                FROM dbo.announcements a
                LEFT JOIN dbo.media m ON m.id = a.media_id
                {whereClause}
                ORDER BY a.created_at DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            var countSql = $"SELECT COUNT(*) FROM dbo.announcements a {whereClause};";

            var parameters = new
            {
                Search = searchPattern,
                Privacy = filters.Privacy,
                EnrolledCourseId = filters.EnrolledCourseId,
                Offset = offset,
                Limit = limit
            };

            var rows = (await db.QueryAsync<AnnouncementDto, MediaJoinFields, AnnouncementDto>(
                rowsSql,
                (ann, mediaFields) => AttachMedia(ann, mediaFields),
                parameters,
                splitOn: "media_url"
            )).ToList();

            var total = await db.ExecuteScalarAsync<int>(countSql, parameters);

            return (rows, total);
        }

        public async Task<AnnouncementDetailDto?> FindByIdAsync(Guid id)
        {
            using IDbConnection db = _dbconn.CreateConnection();

            const string sql = @"
                SELECT
                    a.id, a.title, a.image, a.media_id, a.description, a.privacy, a.course_id,
                    a.created_at, a.updated_at,
                    m.url AS media_url, m.filename AS media_filename, m.mime_type AS media_mime_type
                FROM dbo.announcements a
                LEFT JOIN dbo.media m ON m.id = a.media_id
                WHERE a.id = @Id;";

            var rows = await db.QueryAsync<AnnouncementDetailDto, MediaJoinFields, AnnouncementDetailDto>(
                sql,
                (ann, mediaFields) => (AnnouncementDetailDto)AttachMedia(ann, mediaFields),
                new { Id = id },
                splitOn: "media_url");

            var announcement = rows.SingleOrDefault();
            if (announcement == null) return null;

            const string resourcesSql = @"
                SELECT
                    ar.id AS Id, ar.media_id AS MediaId, m.url AS Url, m.filename AS Filename,
                    m.original_name AS OriginalName, m.mime_type AS MimeType, m.size AS Size
                FROM dbo.announcement_resources ar
                INNER JOIN dbo.media m ON m.id = ar.media_id
                WHERE ar.announcement_id = @Id;";

            var resources = await db.QueryAsync<AnnouncementResourceDto>(resourcesSql, new { Id = id });
            announcement.Resources = resources.ToList();

            return announcement;
        }

        public async Task<Announcement> CreateAsync(Announcement announcement, List<Guid>? resourceMediaIds)
        {
            using var db = _dbconn.CreateConnection();
            db.Open();
            using var transaction = db.BeginTransaction();

            try
            {
                announcement.Id = Guid.NewGuid();
                announcement.CreatedAt = DateTimeOffset.UtcNow;
                announcement.UpdatedAt = DateTimeOffset.UtcNow;

                const string insertSql = @"
                    INSERT INTO dbo.announcements
                        (id, title, description, image, media_id, privacy, course_id, created_at, updated_at)
                    OUTPUT INSERTED.*
                    VALUES
                        (@Id, @Title, @Description, @Image, @MediaId, @Privacy, @CourseId, @CreatedAt, @UpdatedAt);";

                var inserted = await db.QuerySingleAsync<Announcement>(insertSql, announcement, transaction);

                if (resourceMediaIds is { Count: > 0 })
                {
                    const string resourceSql = @"
                        INSERT INTO dbo.announcement_resources (id, announcement_id, media_id)
                        VALUES (@Id, @AnnouncementId, @MediaId);";

                    var rows = resourceMediaIds.Select(mid => new
                    {
                        Id = Guid.NewGuid(),
                        AnnouncementId = inserted.Id,
                        MediaId = mid
                    });

                    await db.ExecuteAsync(resourceSql, rows, transaction);
                }

                transaction.Commit();
                return inserted;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<Announcement?> UpdateAsync(Guid id, Announcement mergedFields, List<Guid>? resourceMediaIds)
        {
            using var db = _dbconn.CreateConnection();
            db.Open();
            using var transaction = db.BeginTransaction();

            try
            {
                mergedFields.Id = id;
                mergedFields.UpdatedAt = DateTimeOffset.UtcNow;

                const string updateSql = @"
                    UPDATE dbo.announcements
                    SET title = @Title, description = @Description, image = @Image,
                        media_id = @MediaId, privacy = @Privacy, course_id = @CourseId,
                        updated_at = @UpdatedAt
                    OUTPUT INSERTED.*
                    WHERE id = @Id;";

                var updated = await db.QuerySingleOrDefaultAsync<Announcement>(updateSql, mergedFields, transaction);

                // null = key omitted entirely, leave announcement_resources
                // untouched. Non-null (even empty) = key was present,
                // replace the full set - matches `!== undefined` in the source.
                if (resourceMediaIds != null)
                {
                    await db.ExecuteAsync(
                        "DELETE FROM dbo.announcement_resources WHERE announcement_id = @Id",
                        new { Id = id }, transaction);

                    if (resourceMediaIds.Count > 0)
                    {
                        const string resourceSql = @"
                            INSERT INTO dbo.announcement_resources (id, announcement_id, media_id)
                            VALUES (@Id, @AnnouncementId, @MediaId);";

                        var rows = resourceMediaIds.Select(mid => new
                        {
                            Id = Guid.NewGuid(),
                            AnnouncementId = id,
                            MediaId = mid
                        });

                        await db.ExecuteAsync(resourceSql, rows, transaction);
                    }
                }

                transaction.Commit();
                return updated;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task RemoveAsync(Guid id)
        {
            using IDbConnection db = _dbconn.CreateConnection();
            const string sql = "DELETE FROM dbo.announcements WHERE id = @Id";
            await db.ExecuteAsync(sql, new { Id = id });
        }

        public async Task<List<string>> GetSubscriberEmailsAsync()
        {
            using IDbConnection db = _dbconn.CreateConnection();
            var rows = await db.QueryAsync<string>("SELECT email FROM dbo.subscribers");
            return rows.ToList();
        }

        public async Task<List<string>> GetAllUserEmailsAsync()
        {
            using IDbConnection db = _dbconn.CreateConnection();
            var rows = await db.QueryAsync<string>("SELECT email FROM dbo.users WHERE is_verified = 1");
            return rows.ToList();
        }

        public async Task<List<string>> GetEnrolledUserEmailsAsync(Guid courseId)
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

        public async Task<Guid?> FindStudentCourseIdAsync(Guid userId)
        {
            using IDbConnection db = _dbconn.CreateConnection();
            const string sql = "SELECT TOP 1 course_id FROM dbo.student_profiles WHERE user_id = @UserId";
            return await db.QuerySingleOrDefaultAsync<Guid?>(sql, new { UserId = userId });
        }

        private static AnnouncementDto AttachMedia(AnnouncementDto announcement, MediaJoinFields mediaFields)
        {
            announcement.Media = announcement.MediaId.HasValue
                ? new MediaSummaryDto
                {
                    Id = announcement.MediaId.Value,
                    Url = mediaFields.MediaUrl,
                    Filename = mediaFields.MediaFilename,
                    MimeType = mediaFields.MediaMimeType
                }
                : null;
            return announcement;
        }
    }
}