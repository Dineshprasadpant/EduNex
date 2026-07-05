// ===== DataAccess/ICourseDal.cs & CourseDal.cs =====
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
using EduNex.Models;

namespace EduNex.DataAccess
{
    public interface ICourseDal
    {
        Task<(IEnumerable<CourseSummaryDto> Items, int Total)> GetSummaryPaginatedAsync(int page, int limit);
        Task<(IEnumerable<CourseFullDto> Items, int Total)> GetFullDetailsPaginatedAsync(int page, int limit);
        Task<(IEnumerable<CourseSummaryDto> Items, int Total)> GetByDeliveryModeAsync(string mode, int page, int limit);
        Task<Course> GetByIdAsync(Guid id);
        Task<Guid> CreateAsync(Course course);
        Task<bool> UpdateAsync(Guid id, Course course);
        Task<bool> DeleteAsync(Guid id);
    }

    public class CourseDal : ICourseDal
    {
        private readonly string _connectionString;
        public CourseDal(string connectionString) => _connectionString = connectionString;

        public async Task<(IEnumerable<CourseSummaryDto> Items, int Total)> GetSummaryPaginatedAsync(int page, int limit)
        {
            using var conn = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT COUNT(*) FROM Courses;
                SELECT * FROM Courses 
                ORDER BY 
                    CASE Priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
                    CreatedAt DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            using var multi = await conn.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit });
            var total = await multi.ReadFirstAsync<int>();
            var items = await multi.ReadAsync<CourseSummaryDto>();
            return (items, total);
        }

        public async Task<(IEnumerable<CourseFullDto> Items, int Total)> GetFullDetailsPaginatedAsync(int page, int limit)
        {
            using var conn = new SqlConnection(_connectionString);

            var (total, courses) = await GetPagedCoursesAsync(conn, (page - 1) * limit, limit);
            var courseList = courses.ToList();

            if (!courseList.Any())
                return (Enumerable.Empty<CourseFullDto>(), total);

            var ids = courseList.Select(c => c.Id).ToList();

            var descriptions = await GetDescriptionsAsync(conn, ids);
            var highlights = await GetHighlightsAsync(conn, ids);
            var formats = await GetLearningFormatsAsync(conn, ids);
            var curriculum = await GetCurriculumAsync(conn, ids);
            var schedules = await GetSchedulesAsync(conn, ids);

            var result = courseList.Select(c => new CourseFullDto
            {
                Id = c.Id,
                Title = c.Title,
                Image = c.Image,
                StudentsEnrolled = c.StudentsEnrolled,
                TeachersCount = c.TeachersCount,
                OverallHours = c.OverallHours,
                ModuleLeader = c.ModuleLeader,
                Category = c.Category,
                Price = c.Price,
                OnlinePrice = c.OnlinePrice,
                OfflinePrice = c.OfflinePrice,
                Priority = c.Priority,
                DeliveryMode = c.DeliveryMode,
                Description = descriptions.Where(x => x.CourseId == c.Id)
                                           .OrderBy(x => x.SortOrder)
                                           .Select(x => x.Content).ToList(),
                CourseHighlights = highlights.Where(x => x.CourseId == c.Id)
                                              .Select(x => x.Highlight).ToList(),
                LearningFormat = formats.Where(x => x.CourseId == c.Id)
                                         .Select(x => new LearningFormat { Name = x.Name, Description = x.Description })
                                         .ToList(),
                Curriculum = curriculum.Where(x => x.CourseId == c.Id)
                                        .Select(x => new CurriculumItem { Title = x.Title, Duration = x.Duration, Description = x.Description })
                                        .ToList(),
                Schedule = schedules.Where(x => x.CourseId == c.Id)
                                     .Select(x => new ScheduleItem
                                     {
                                         Day = Enum.TryParse<DayOfWeek>(x.Day, true, out var d) ? d : DayOfWeek.Sunday,
                                         Medium = x.Medium,
                                         StartTime = x.StartTime,
                                         EndTime = x.EndTime
                                     }).ToList()
            });

            return (result, total);
        }

        private async Task<(int Total, IEnumerable<CourseSummaryDto> Items)> GetPagedCoursesAsync(SqlConnection conn, int offset, int limit)
        {
            const string sql = @"
                SELECT COUNT(*) FROM Courses;
                SELECT * FROM Courses
                ORDER BY 
                    CASE Priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
                    CreatedAt DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            using var multi = await conn.QueryMultipleAsync(sql, new { Offset = offset, Limit = limit });
            var total = await multi.ReadFirstAsync<int>();
            var items = await multi.ReadAsync<CourseSummaryDto>();
            return (total, items);
        }

        private Task<IEnumerable<CourseDescriptionRow>> GetDescriptionsAsync(SqlConnection conn, List<Guid> ids) =>
            conn.QueryAsync<CourseDescriptionRow>("SELECT * FROM CourseDescriptions WHERE CourseId IN @Ids", new { Ids = ids });

        private Task<IEnumerable<CourseHighlightRow>> GetHighlightsAsync(SqlConnection conn, List<Guid> ids) =>
            conn.QueryAsync<CourseHighlightRow>("SELECT * FROM CourseHighlights WHERE CourseId IN @Ids", new { Ids = ids });

        private Task<IEnumerable<LearningFormatRow>> GetLearningFormatsAsync(SqlConnection conn, List<Guid> ids) =>
            conn.QueryAsync<LearningFormatRow>("SELECT * FROM CourseLearningFormats WHERE CourseId IN @Ids", new { Ids = ids });

        private Task<IEnumerable<CurriculumItemRow>> GetCurriculumAsync(SqlConnection conn, List<Guid> ids) =>
            conn.QueryAsync<CurriculumItemRow>("SELECT * FROM CourseCurriculums WHERE CourseId IN @Ids", new { Ids = ids });

        private Task<IEnumerable<ScheduleItemRow>> GetSchedulesAsync(SqlConnection conn, List<Guid> ids) =>
            conn.QueryAsync<ScheduleItemRow>("SELECT CourseId, DayOfWeek as Day, Medium, StartTime, EndTime FROM CourseSchedules WHERE CourseId IN @Ids", new { Ids = ids });

        public async Task<Course> GetByIdAsync(Guid id)
        {
            using var conn = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT * FROM Courses WHERE Id = @Id;
                SELECT Content FROM CourseDescriptions WHERE CourseId = @Id ORDER BY SortOrder;
                SELECT Highlight FROM CourseHighlights WHERE CourseId = @Id;
                SELECT Name, Description FROM CourseLearningFormats WHERE CourseId = @Id;
                SELECT Title, Duration, Description FROM CourseCurriculums WHERE CourseId = @Id;
                SELECT DayOfWeek as Day, Medium, StartTime, EndTime FROM CourseSchedules WHERE CourseId = @Id;";

            using var multi = await conn.QueryMultipleAsync(sql, new { Id = id });
            var course = await multi.ReadFirstOrDefaultAsync<Course>();
            if (course == null) return null;

            course.Description = (await multi.ReadAsync<string>()).ToList();
            course.CourseHighlights = (await multi.ReadAsync<string>()).ToList();
            course.LearningFormat = (await multi.ReadAsync<LearningFormat>()).ToList();
            course.Curriculum = (await multi.ReadAsync<CurriculumItem>()).ToList();
            course.Schedule = (await multi.ReadAsync<ScheduleItem>()).ToList();
            return course;
        }

        public async Task<(IEnumerable<CourseSummaryDto> Items, int Total)> GetByDeliveryModeAsync(string mode, int page, int limit)
        {
            using var conn = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT COUNT(*) FROM Courses WHERE DeliveryMode = @Mode;
                SELECT * FROM Courses WHERE DeliveryMode = @Mode
                ORDER BY 
                    CASE Priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
                    CreatedAt DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            using var multi = await conn.QueryMultipleAsync(sql, new { Mode = mode, Offset = (page - 1) * limit, Limit = limit });
            var total = await multi.ReadFirstAsync<int>();
            var items = await multi.ReadAsync<CourseSummaryDto>();
            return (items, total);
        }

        public async Task<Guid> CreateAsync(Course course)
        {
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            using var txn = conn.BeginTransaction();

            try
            {
                course.Id = Guid.NewGuid();

                const string insertCourse = @"
            INSERT INTO Courses (Id, Title, Image, StudentsEnrolled, TeachersCount, OverallHours, ModuleLeader, Category, Price, OnlinePrice, OfflinePrice, Priority, DeliveryMode, CreatedAt, UpdatedAt)
            VALUES (@Id, @Title, @Image, @StudentsEnrolled, @TeachersCount, @OverallHours, @ModuleLeader, @Category, @Price, @OnlinePrice, @OfflinePrice, @Priority, @DeliveryMode, SYSUTCDATETIME(), SYSUTCDATETIME())";

                await conn.ExecuteAsync(insertCourse, new
                {
                    course.Id,
                    course.Title,
                    course.Image,
                    course.StudentsEnrolled,
                    course.TeachersCount,
                    course.OverallHours,
                    course.ModuleLeader,
                    course.Category,
                    course.Price,
                    course.OnlinePrice,
                    course.OfflinePrice,
                    Priority = course.Priority.ToString().ToLower(),
                    DeliveryMode = course.DeliveryMode.ToString().ToLower()
                }, txn);

                if (course.Description?.Any() == true)
                {
                    var descRows = course.Description.Select((d, i) => new { CourseId = course.Id, Content = d, SortOrder = i });
                    await conn.ExecuteAsync("INSERT INTO CourseDescriptions (CourseId, Content, SortOrder) VALUES (@CourseId, @Content, @SortOrder)", descRows, txn);
                }

                if (course.CourseHighlights?.Any() == true)
                {
                    var hlRows = course.CourseHighlights.Select(h => new { CourseId = course.Id, Highlight = h });
                    await conn.ExecuteAsync("INSERT INTO CourseHighlights (CourseId, Highlight) VALUES (@CourseId, @Highlight)", hlRows, txn);
                }

                if (course.LearningFormat?.Any() == true)
                {
                    var lfRows = course.LearningFormat.Select(l => new { CourseId = course.Id, l.Name, l.Description });
                    await conn.ExecuteAsync("INSERT INTO CourseLearningFormats (CourseId, Name, Description) VALUES (@CourseId, @Name, @Description)", lfRows, txn);
                }

                if (course.Curriculum?.Any() == true)
                {
                    var curRows = course.Curriculum.Select(c => new { CourseId = course.Id, c.Title, c.Duration, c.Description });
                    await conn.ExecuteAsync("INSERT INTO CourseCurriculums (CourseId, Title, Duration, Description) VALUES (@CourseId, @Title, @Duration, @Description)", curRows, txn);
                }

                if (course.Schedule?.Any() == true)
                {
                    var schRows = course.Schedule.Select(s => new { CourseId = course.Id, DayOfWeek = s.Day.ToString(), s.Medium, s.StartTime, s.EndTime });
                    await conn.ExecuteAsync("INSERT INTO CourseSchedules (CourseId, DayOfWeek, Medium, StartTime, EndTime) VALUES (@CourseId, @DayOfWeek, @Medium, @StartTime, @EndTime)", schRows, txn);
                }

                txn.Commit();
                return course.Id;
            }
            catch
            {
                txn.Rollback();
                throw;
            }
        }

        public async Task<bool> UpdateAsync(Guid id, Course course)
        {
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            using var txn = conn.BeginTransaction();

            try
            {
                const string sql = @"UPDATE Courses SET 
            Title = @Title, Image = @Image, TeachersCount = @TeachersCount,
            OverallHours = @OverallHours, ModuleLeader = @ModuleLeader, Category = @Category,
            Price = @Price, OnlinePrice = @OnlinePrice, OfflinePrice = @OfflinePrice,
            Priority = @Priority, DeliveryMode = @DeliveryMode, UpdatedAt = SYSUTCDATETIME()
            WHERE Id = @Id";

                var rows = await conn.ExecuteAsync(sql, new
                {
                    course.Title,
                    course.Image,
                    course.StudentsEnrolled,
                    course.TeachersCount,
                    course.OverallHours,
                    course.ModuleLeader,
                    course.Category,
                    course.Price,
                    course.OnlinePrice,
                    course.OfflinePrice,
                    Priority = course.Priority.ToString().ToLower(),
                    DeliveryMode = course.DeliveryMode.ToString().ToLower(),
                    Id = id
                }, txn);

                if (rows == 0)
                {
                    txn.Rollback();
                    return false;
                }

                // Replace child collections wholesale
                await conn.ExecuteAsync("DELETE FROM CourseDescriptions WHERE CourseId = @Id", new { Id = id }, txn);
                await conn.ExecuteAsync("DELETE FROM CourseHighlights WHERE CourseId = @Id", new { Id = id }, txn);
                await conn.ExecuteAsync("DELETE FROM CourseLearningFormats WHERE CourseId = @Id", new { Id = id }, txn);
                await conn.ExecuteAsync("DELETE FROM CourseCurriculums WHERE CourseId = @Id", new { Id = id }, txn);
                await conn.ExecuteAsync("DELETE FROM CourseSchedules WHERE CourseId = @Id", new { Id = id }, txn);

                if (course.Description?.Any() == true)
                {
                    var descRows = course.Description.Select((d, i) => new { CourseId = id, Content = d, SortOrder = i });
                    await conn.ExecuteAsync("INSERT INTO CourseDescriptions (CourseId, Content, SortOrder) VALUES (@CourseId, @Content, @SortOrder)", descRows, txn);
                }

                if (course.CourseHighlights?.Any() == true)
                {
                    var hlRows = course.CourseHighlights.Select(h => new { CourseId = id, Highlight = h });
                    await conn.ExecuteAsync("INSERT INTO CourseHighlights (CourseId, Highlight) VALUES (@CourseId, @Highlight)", hlRows, txn);
                }

                if (course.LearningFormat?.Any() == true)
                {
                    var lfRows = course.LearningFormat.Select(l => new { CourseId = id, l.Name, l.Description });
                    await conn.ExecuteAsync("INSERT INTO CourseLearningFormats (CourseId, Name, Description) VALUES (@CourseId, @Name, @Description)", lfRows, txn);
                }

                if (course.Curriculum?.Any() == true)
                {
                    var curRows = course.Curriculum.Select(c => new { CourseId = id, c.Title, c.Duration, c.Description });
                    await conn.ExecuteAsync("INSERT INTO CourseCurriculums (CourseId, Title, Duration, Description) VALUES (@CourseId, @Title, @Duration, @Description)", curRows, txn);
                }

                if (course.Schedule?.Any() == true)
                {
                    var schRows = course.Schedule.Select(s => new { CourseId = id, DayOfWeek = s.Day.ToString(), s.Medium, s.StartTime, s.EndTime });
                    await conn.ExecuteAsync("INSERT INTO CourseSchedules (CourseId, DayOfWeek, Medium, StartTime, EndTime) VALUES (@CourseId, @DayOfWeek, @Medium, @StartTime, @EndTime)", schRows, txn);
                }

                txn.Commit();
                return true;
            }
            catch
            {
                txn.Rollback();
                throw;
            }
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using var conn = new SqlConnection(_connectionString);
            return await conn.ExecuteAsync("DELETE FROM Courses WHERE Id = @Id", new { Id = id }) > 0;
        }
    }
}