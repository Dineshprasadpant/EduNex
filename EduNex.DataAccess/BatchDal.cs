using Dapper;
using EduNex.Models;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using static EduNex.DataAccess.BatchDal;

namespace EduNex.DataAccess
{
    public interface IBatchDal
    {
        Task<Guid> CreateAsync(createBatchDto batch);
        Task<Batch> GetByIdAsync(Guid id);
        Task<(IEnumerable<BatchQueryResult> Items, int Total)> GetAllPaginatedAsync(int page, int limit);
        Task<bool> UpdateAsync(Guid id, Batch batch);
        Task<bool> DeleteAsync(Guid id);

        // Meeting Management
        Task<bool> AddMeetingAsync(Guid batchId, ScheduledMeeting meeting);
        Task<bool> UpdateMeetingAsync(Guid batchId, Guid meetingId, ScheduledMeeting meeting);
        Task<bool> RemoveMeetingAsync(Guid batchId, Guid meetingId);
        Task<int> CleanupExpiredMeetingsAsync();
    }

    public class BatchDal : IBatchDal
    {
        private readonly string _connectionString;
        public BatchDal(string connectionString) => _connectionString = connectionString;

        public async Task<Guid> CreateAsync(createBatchDto batch)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                var Id = Guid.NewGuid();
                const string sql = "INSERT INTO Batches (Id, BatchName, CourseId, CreatedAt, UpdatedAt) VALUES ( @Id, @batch_name, @course, SYSUTCDATETIME(), SYSUTCDATETIME())";
                await conn.ExecuteAsync(sql, new {Id, batch.batch_name,batch.course});
                return Id;
            }
        }

        public async Task<Batch> GetByIdAsync(Guid id)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT b.*, c.Title as CourseTitle 
                    FROM Batches b 
                    LEFT JOIN Courses c ON b.CourseId = c.Id 
                    WHERE b.Id = @Id;
                    SELECT * FROM BatchMeetings WHERE BatchId = @Id ORDER BY ExpiryTime ASC;";

                using (var multi = await conn.QueryMultipleAsync(sql, new { Id = id }))
                {
                    var batch = await multi.ReadFirstOrDefaultAsync<Batch>();
                    if (batch != null)
                    {
                        batch.ScheduledMeetings = (await multi.ReadAsync<ScheduledMeeting>()).ToList();
                    }
                    return batch;
                }
            }
        }

        public async Task<(IEnumerable<BatchQueryResult> Items, int Total)> GetAllPaginatedAsync(int page, int limit)
        {
            using var conn = new SqlConnection(_connectionString);

            const string sql = @"
        SELECT COUNT(*) FROM Batches;

        SELECT
            b.Id,
            b.BatchName,
            b.CourseId,
            c.Title AS CourseTitle,
            b.CreatedAt,
            b.UpdatedAt
        FROM Batches b
        LEFT JOIN Courses c ON c.Id = b.CourseId
        ORDER BY b.CreatedAt DESC
        OFFSET @Offset ROWS
        FETCH NEXT @Limit ROWS ONLY;";

            using var multi = await conn.QueryMultipleAsync(
                sql,
                new { Offset = (page - 1) * limit, Limit = limit });

            var total = await multi.ReadFirstAsync<int>();
            var items = await multi.ReadAsync<BatchQueryResult>();

            return (items, total);
        }

        public async Task<bool> UpdateAsync(Guid id, Batch batch)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                const string sql = "UPDATE Batches SET BatchName = @BatchName, CourseId = @CourseId, UpdatedAt = SYSUTCDATETIME() WHERE Id = @Id";
                return await conn.ExecuteAsync(sql, new { batch.BatchName, batch.CourseId, Id = id }) > 0;
            }
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                return await conn.ExecuteAsync("DELETE FROM Batches WHERE Id = @Id", new { Id = id }) > 0;
            }
        }

        public async Task<bool> AddMeetingAsync(Guid batchId, ScheduledMeeting meeting)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                meeting.Id = Guid.NewGuid();
                meeting.BatchId = batchId;
                const string sql = @"
                    INSERT INTO BatchMeetings (Id, BatchId, Title, MeetingLink, MeetingDate, MeetingTime, ExpiryTime, duration_minutes, CreatedAt)
                    VALUES (@Id, @BatchId, @Title, @Meeting_Link, @Date, @Time, @ExpiryTime, @Duration_Minutes, SYSUTCDATETIME())";
                return await conn.ExecuteAsync(sql, meeting) > 0;
            }
        }

        public async Task<bool> UpdateMeetingAsync(Guid batchId, Guid meetingId, ScheduledMeeting meeting)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    UPDATE BatchMeetings 
                    SET Title = @Title, MeetingLink = @Meeting_Link, MeetingDate = @Date, 
                        MeetingTime = @Time, ExpiryTime = @ExpiryTime, duration_minutes = @Duration_Minutes
                    WHERE Id = @MeetingId AND BatchId = @BatchId";
                return await conn.ExecuteAsync(sql, new
                {
                    meeting.Title,
                    meeting.Meeting_Link,
                    meeting.Date,
                    meeting.Time,
                    meeting.ExpiryTime,
                    meeting.Duration_Minutes,
                    MeetingId = meetingId,
                    BatchId = batchId
                }) > 0;
            }
        }

        public async Task<bool> RemoveMeetingAsync(Guid batchId, Guid meetingId)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                return await conn.ExecuteAsync("DELETE FROM BatchMeetings WHERE Id = @Id AND BatchId = @BatchId", new { Id = meetingId, BatchId = batchId }) > 0;
            }
        }

        public async Task<int> CleanupExpiredMeetingsAsync()
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                return await conn.ExecuteAsync("DELETE FROM BatchMeetings WHERE ExpiryTime < SYSUTCDATETIME()");
            }
        }
        public class BatchQueryResult
        {
            public Guid Id { get; set; }
            public string BatchName { get; set; }
            public Guid? CourseId { get; set; }
            public string CourseTitle { get; set; }
            public DateTime CreatedAt { get; set; }
            public DateTime UpdatedAt { get; set; }
        }
        public class BatchResponseDto
        {
            public string _id { get; set; }
            public string batch_name { get; set; }
            public CourseDto? course { get; set; }
            public DateTime createdAt { get; set; }
            public DateTime updatedAt { get; set; }
            public int __v { get; set; } = 0;
        }

        public class CourseDto
        {
            public string _id { get; set; }
            public string title { get; set; }
        }

    }
}
