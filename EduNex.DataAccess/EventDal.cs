using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using EduNex.Models;
using EduNex.Models.Dtos;
using Microsoft.Data.SqlClient;

namespace EduNex.DataAccess
{
    public interface IEventDal
    {
        Task<(List<EventDto> Data, int Total)> ListAsync(int limit, int offset, string? privacy, string? search);
        Task<EventDto?> GetByIdAsync(Guid id);
        Task<Guid> CreateAsync(CreateEventDto eventDto);
        Task<EventDto?> UpdateAsync(Guid id, UpdateEventDto eventDto);
        Task DeleteAsync(Guid id);
        Task<List<string>> GetSubscriberEmailsAsync();
    }

    public class EventDal : IEventDal
    {
        private readonly string _connectionString;
        public EventDal(string connectionString) => _connectionString = connectionString;
        private IDbConnection Connection => new SqlConnection(_connectionString);

        public async Task<(List<EventDto> Data, int Total)> ListAsync(int limit, int offset, string? privacy, string? search)
        {
            using var db = Connection;
            var conditions = new List<string>();
            if (!string.IsNullOrEmpty(privacy)) conditions.Add("privacy = @Privacy");
            if (!string.IsNullOrEmpty(search)) conditions.Add("title LIKE @Search");
            var where = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";

            var sql = $@"
                SELECT COUNT(*) FROM dbo.events {where};
                SELECT * FROM dbo.events {where}
                ORDER BY event_date DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            using var multi = await db.QueryMultipleAsync(sql, new { Privacy = privacy, Search = $"%{search}%", Offset = offset, Limit = limit });
            var total = await multi.ReadFirstAsync<int>();
            var items = (await multi.ReadAsync<EventDto>()).ToList();
            return (items, total);
        }

        public async Task<EventDto?> GetByIdAsync(Guid id)
        {
            using var db = Connection;
            const string sql = "SELECT * FROM dbo.events WHERE id = @Id";
            return await db.QuerySingleOrDefaultAsync<EventDto>(sql, new { Id = id });
        }

        public async Task<Guid> CreateAsync(CreateEventDto eventDto)
        {
            using var db = Connection;
            var id = Guid.NewGuid();
            const string sql = @"
                INSERT INTO dbo.events (id, title, description, category, event_date, address, privacy, course_id, image, media_id, created_at, updated_at)
                VALUES (@Id, @Title, @Description, @Category, @EventDate, @Address, @Privacy, @CourseId, @Image, @MediaId, @Now, @Now);";
            
            await db.ExecuteAsync(sql, new { 
                Id = id, eventDto.Title, eventDto.Description, eventDto.Category, eventDto.EventDate, 
                eventDto.Address, eventDto.Privacy, eventDto.CourseId, eventDto.Image, eventDto.MediaId, Now = DateTimeOffset.UtcNow 
            });
            return id;
        }

        public async Task<EventDto?> UpdateAsync(Guid id, UpdateEventDto eventDto)
        {
            using var db = Connection;
            const string sql = @"
                UPDATE dbo.events SET 
                title = ISNULL(@Title, title), description = ISNULL(@Description, description), 
                category = ISNULL(@Category, category), event_date = ISNULL(@EventDate, event_date), 
                address = ISNULL(@Address, address), privacy = ISNULL(@Privacy, privacy), 
                course_id = ISNULL(@CourseId, course_id), image = ISNULL(@Image, image), 
                media_id = ISNULL(@MediaId, media_id), updated_at = @Now
                OUTPUT INSERTED.*
                WHERE id = @Id";
            
            return await db.QuerySingleOrDefaultAsync<EventDto>(sql, new { 
                eventDto.Title, eventDto.Description, eventDto.Category, eventDto.EventDate, 
                eventDto.Address, eventDto.Privacy, eventDto.CourseId, eventDto.Image, eventDto.MediaId, Now = DateTimeOffset.UtcNow, Id = id 
            });
        }

        public async Task DeleteAsync(Guid id)
        {
            using var db = Connection;
            await db.ExecuteAsync("DELETE FROM dbo.events WHERE id = @Id", new { Id = id });
        }

        public async Task<List<string>> GetSubscriberEmailsAsync()
        {
            using var db = Connection;
            return (await db.QueryAsync<string>("SELECT email FROM dbo.subscribers")).ToList();
        }
    }
}
