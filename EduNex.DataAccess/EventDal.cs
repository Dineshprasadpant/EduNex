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
    public class EventFilters
    {
        public string? Privacy { get; set; }
        public string? Search { get; set; }
        public Guid? EnrolledCourseId { get; set; }
    }
    public interface IEventDal
    {
        Task<(List<EventDto> Data, int Total)> FindAllAsync(EventFilters filters, DalPagination pagination);
        Task<EventDto?> FindByIdAsync(Guid id);
        Task<Event> CreateAsync(CreateEventRequestDto data);
        Task<Event?> UpdateAsync(Guid id, UpdateEventRequestDto data);
        Task RemoveAsync(Guid id);
        Task<List<string>> GetSubscriberEmailsAsync();
        Task<Guid?> FindStudentCourseIdAsync(Guid userId);
    }

    public class EventDal(IDbConnectionFactory _dbconn) : IEventDal
    {
        private class EventFlatRow : Event
        {
            public string? MediaUrl { get; set; }
            public string? MediaFilename { get; set; }
            public string? MediaMimeType { get; set; }
        }

        // Equivalent of shapeRow(): nests the flat media_* columns into
        // Media, null when MediaId is absent.
        private static EventDto MapEvent(EventFlatRow r) => new()
        {
            Id = r.Id,
            Title = r.Title,
            Description = r.Description,
            Category = r.Category,
            EventDate = r.EventDate,
            Address = r.Address,
            Privacy = r.Privacy,
            CourseId = r.CourseId,
            Image = r.Image,
            MediaId = r.MediaId,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
            Media = r.MediaId.HasValue
                ? new MediaSummaryDto { Id = r.MediaId.Value, Url = r.MediaUrl ?? "", Filename = r.MediaFilename ?? "", MimeType = r.MediaMimeType ?? "" }
                : null,
        };

        private const string BaseSelect = @"
            SELECT e.*, m.url AS MediaUrl, m.filename AS MediaFilename, m.mime_type AS MediaMimeType
            FROM dbo.events e
            LEFT JOIN dbo.media m ON m.id = e.media_id";

        public async Task<(List<EventDto> Data, int Total)> FindAllAsync(EventFilters filters, DalPagination pagination)
        {
            var conditions = new List<string>();
            var p = new DynamicParameters();

            if (!string.IsNullOrWhiteSpace(filters.Privacy))
            {
                conditions.Add("e.privacy = @Privacy");
                p.Add("Privacy", filters.Privacy);
            }
            if (!string.IsNullOrWhiteSpace(filters.Search))
            {
                conditions.Add("e.title LIKE @Search");
                p.Add("Search", $"%{filters.Search}%");
            }
            if (filters.EnrolledCourseId.HasValue)
            {
                // Student-scoped view: public events plus events targeted at
                // their course (either explicit course_id match, or a
                // course-agnostic 'enrolled' event).
                conditions.Add(@"(e.privacy = 'public' OR e.course_id = @EnrolledCourseId
                                  OR (e.privacy = 'enrolled' AND e.course_id IS NULL))");
                p.Add("EnrolledCourseId", filters.EnrolledCourseId.Value);
            }

            var whereSql = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";
            p.Add("Offset", pagination.Offset);
            p.Add("Limit", pagination.Limit);

            using var connection = _dbconn.CreateConnection();

            var dataSql = $@"
                {BaseSelect}
                {whereSql}
                ORDER BY e.event_date DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY";
            var rows = (await connection.QueryAsync<EventFlatRow>(dataSql, p)).ToList();

            var countSql = $"SELECT COUNT(*) FROM dbo.events e {whereSql}";
            var total = await connection.QueryFirstOrDefaultAsync<int>(countSql, p);

            return (rows.Select(MapEvent).ToList(), total);
        }

        public async Task<EventDto?> FindByIdAsync(Guid id)
        {
            using var connection = _dbconn.CreateConnection();

            var row = await connection.QueryFirstOrDefaultAsync<EventFlatRow>(
                $"{BaseSelect} WHERE e.id = @Id", new { Id = id });
            if (row is null) return null;

            var shaped = MapEvent(row);

            const string resourcesSql = @"
                SELECT er.id AS Id, er.media_id AS MediaId, m.url AS Url, m.filename AS Filename,
                       m.original_name AS OriginalName, m.mime_type AS MimeType, m.size AS Size
                FROM dbo.event_resources er
                INNER JOIN dbo.media m ON m.id = er.media_id
                WHERE er.event_id = @Id";
            shaped.Resources = (await connection.QueryAsync<EventResourceDto>(resourcesSql, new { Id = id })).ToList();

            return shaped;
        }

        public async Task<Event> CreateAsync(CreateEventRequestDto data)
        {
            using var connection = _dbconn.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();
            try
            {
                const string insertSql = @"
                    INSERT INTO dbo.events (id, title, description, category, event_date, address, privacy, course_id, image, media_id)
                    OUTPUT INSERTED.*
                    VALUES (NEWID(), @Title, @Description, @Category, @EventDate, @Address, @Privacy, @CourseId, @Image, @MediaId)";
                var created = await connection.QuerySingleAsync<Event>(insertSql, new
                {
                    data.Title,
                    data.Description,
                    Category = data.Category ?? "Other",
                    data.EventDate,
                    data.Address,
                    Privacy = data.Privacy ?? PrivacyType.Public,
                    data.CourseId,
                    data.Image,
                    data.MediaId,
                }, transaction);

                if (data.ResourceMediaIds is { Count: > 0 })
                {
                    const string resourceSql = "INSERT INTO dbo.event_resources (id, event_id, media_id) VALUES (NEWID(), @EventId, @MediaId)";
                    var rows = data.ResourceMediaIds.Select(mediaId => new { EventId = created.Id, MediaId = mediaId });
                    await connection.ExecuteAsync(resourceSql, rows, transaction);
                }

                transaction.Commit();
                return created;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<Event?> UpdateAsync(Guid id, UpdateEventRequestDto data)
        {
            using var connection = _dbconn.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();
            try
            {
                var sets = new List<string> { "updated_at = SYSDATETIMEOFFSET()" };
                var p = new DynamicParameters();
                p.Add("Id", id);

                if (data.Title is not null) { sets.Add("title = @Title"); p.Add("Title", data.Title); }
                if (data.Description is not null) { sets.Add("description = @Description"); p.Add("Description", data.Description); }
                if (data.Category is not null) { sets.Add("category = @Category"); p.Add("Category", data.Category); }
                if (data.EventDate.HasValue) { sets.Add("event_date = @EventDate"); p.Add("EventDate", data.EventDate.Value); }
                if (data.Address is not null) { sets.Add("address = @Address"); p.Add("Address", data.Address); }
                if (data.Privacy is not null) { sets.Add("privacy = @Privacy"); p.Add("Privacy", data.Privacy); }
                if (data.CourseId.HasValue) { sets.Add("course_id = @CourseId"); p.Add("CourseId", data.CourseId.Value); }
                if (data.Image is not null) { sets.Add("image = @Image"); p.Add("Image", data.Image); }
                if (data.MediaId.HasValue) { sets.Add("media_id = @MediaId"); p.Add("MediaId", data.MediaId.Value); }

                var updateSql = $"UPDATE dbo.events SET {string.Join(", ", sets)} OUTPUT INSERTED.* WHERE id = @Id";
                var updated = await connection.QueryFirstOrDefaultAsync<Event>(updateSql, p, transaction);

                if (data.ResourceMediaIds is not null)
                {
                    await connection.ExecuteAsync("DELETE FROM dbo.event_resources WHERE event_id = @Id", new { Id = id }, transaction);

                    if (data.ResourceMediaIds.Count > 0)
                    {
                        const string resourceSql = "INSERT INTO dbo.event_resources (id, event_id, media_id) VALUES (NEWID(), @EventId, @MediaId)";
                        var rows = data.ResourceMediaIds.Select(mediaId => new { EventId = id, MediaId = mediaId });
                        await connection.ExecuteAsync(resourceSql, rows, transaction);
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
            using var connection = _dbconn.CreateConnection();
            // event_resources cascades via FK_event_resources_event ON DELETE CASCADE.
            await connection.ExecuteAsync("DELETE FROM dbo.events WHERE id = @Id", new { Id = id });
        }

        public async Task<List<string>> GetSubscriberEmailsAsync()
        {
            using var connection = _dbconn.CreateConnection();
            return (await connection.QueryAsync<string>("SELECT email FROM dbo.subscribers")).ToList();
        }

        public async Task<Guid?> FindStudentCourseIdAsync(Guid userId)
        {
            using var connection = _dbconn.CreateConnection();
            const string sql = "SELECT TOP 1 course_id FROM dbo.student_profiles WHERE user_id = @UserId";
            return await connection.QueryFirstOrDefaultAsync<Guid?>(sql, new { UserId = userId });
        }
    }
}