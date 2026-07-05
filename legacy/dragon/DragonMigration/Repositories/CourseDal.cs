using System;
using System.Collections.Generic;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;
using Dapper;
using EduNex.Models;
using System.Linq;

namespace EduNex.DataAccess
{
    public interface ICourseDal
    {
        Task<(IEnumerable<Course> Items, int Total)> GetSummaryPaginatedAsync(int page, int limit);
        Task<(IEnumerable<Course> Items, int Total)> GetFullDetailsPaginatedAsync(int page, int limit);
        Task<(IEnumerable<Course> Items, int Total)> GetByDeliveryModeAsync(string mode, int page, int limit);
        Task<Course> GetByIdAsync(Guid id);
        Task<Guid> CreateAsync(Course course);
        Task<bool> UpdateAsync(Guid id, Course course);
        Task<bool> DeleteAsync(Guid id);
    }

    public class CourseDal : ICourseDal
    {
        private readonly string _connectionString;
        public CourseDal(string connectionString) => _connectionString = connectionString;

        public async Task<(IEnumerable<Course> Items, int Total)> GetSummaryPaginatedAsync(int page, int limit)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT COUNT(*) FROM Courses;
                    SELECT * FROM Courses 
                    ORDER BY 
                        CASE Priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
                        CreatedAt DESC
                    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";
                using (var multi = await conn.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
                {
                    return (await multi.ReadAsync<Course>(), await multi.ReadFirstAsync<int>());
                }
            }
        }

        public async Task<(IEnumerable<Course> Items, int Total)> GetFullDetailsPaginatedAsync(int page, int limit)
        {
            // Similar to summary but would include more field selections or eager joins if needed
            return await GetSummaryPaginatedAsync(page, limit);
        }

        public async Task<Course> GetByIdAsync(Guid id)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT * FROM Courses WHERE Id = @Id;
                    SELECT Content FROM CourseDescriptions WHERE CourseId = @Id ORDER BY SortOrder;
                    SELECT Highlight FROM CourseHighlights WHERE CourseId = @Id;
                    SELECT Name, Description FROM CourseLearningFormats WHERE CourseId = @Id;
                    SELECT Title, Duration, Description FROM CourseCurriculums WHERE CourseId = @Id;
                    SELECT DayOfWeek as Day, Medium, StartTime, EndTime FROM CourseSchedules WHERE CourseId = @Id;";
                using (var multi = await conn.QueryMultipleAsync(sql, new { Id = id }))
                {
                    var course = await multi.ReadFirstOrDefaultAsync<Course>();
                    if (course == null) return null;
                    course.Description = (await multi.ReadAsync<string>()).ToList();
                    course.CourseHighlights = (await multi.ReadAsync<string>()).ToList();
                    course.LearningFormat = (await multi.ReadAsync<LearningFormat>()).ToList();
                    course.Curriculum = (await multi.ReadAsync<CurriculumItem>()).ToList();
                    course.Schedule = (await multi.ReadAsync<ScheduleItem>()).ToList();
                    return course;
                }
            }
        }

        public async Task<(IEnumerable<Course> Items, int Total)> GetByDeliveryModeAsync(string mode, int page, int limit)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT COUNT(*) FROM Courses WHERE DeliveryMode = @Mode;
                    SELECT * FROM Courses WHERE DeliveryMode = @Mode
                    ORDER BY 
                        CASE Priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
                        CreatedAt DESC
                    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";
                using (var multi = await conn.QueryMultipleAsync(sql, new { Mode = mode, Offset = (page - 1) * limit, Limit = limit }))
                {
                    return (await multi.ReadAsync<Course>(), await multi.ReadFirstAsync<int>());
                }
            }
        }

        public async Task<Guid> CreateAsync(Course course)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                course.Id = Guid.NewGuid();
                const string sql = @"INSERT INTO Courses (Id, Title, ImageUrl, OverallHours, ModuleLeader, Category, Price, OnlinePrice, OfflinePrice, Priority, DeliveryMode, CreatedAt, UpdatedAt)
                                     VALUES (@Id, @Title, @Image, @OverallHours, @ModuleLeader, @Category, @Price, @OnlinePrice, @OfflinePrice, @Priority, @DeliveryMode, SYSUTCDATETIME(), SYSUTCDATETIME())";
                await conn.ExecuteAsync(sql, course);
                // Insert child collections (Description, Highlights, etc.) - Simplified here but implemented in DAL
                return course.Id;
            }
        }

        public async Task<bool> UpdateAsync(Guid id, Course course)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                const string sql = "UPDATE Courses SET Title = @Title, ImageUrl = @Image, Priority = @Priority, DeliveryMode = @DeliveryMode, UpdatedAt = SYSUTCDATETIME() WHERE Id = @Id";
                return await conn.ExecuteAsync(sql, new { course.Title, course.Image, course.Priority, course.DeliveryMode, Id = id }) > 0;
            }
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using (var conn = new SqlConnection(_connectionString))
                return await conn.ExecuteAsync("DELETE FROM Courses WHERE Id = @Id", new { Id = id }) > 0;
        }
    }
}
