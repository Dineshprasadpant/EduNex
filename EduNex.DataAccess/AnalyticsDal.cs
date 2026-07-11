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
    public interface IAnalyticsDal
    {
        Task<ActiveSession> UpsertActiveSessionAsync(
            Guid userId, string sessionToken, string? pagePath, string? ipAddress, string? userAgent);
        Task<int> CountActiveSessionsAsync();
        Task CleanupOldSessionsAsync();

        Task<bool> TrackVisitorSessionAsync(string sessionToken, DateTime date);
        Task<bool> TrackPageViewAsync(string sessionToken, string pagePath, DateTime date);

        Task UpsertDailyStatsAsync(DateTime date, string field, int increment);
        Task UpsertUtmSourceAsync(DateTime date, string source, int increment);

        Task<List<AnalyticsDaily>> GetDailyStatsAsync(DateTime? from, DateTime? to);
        Task<DashboardSummaryDto> GetDashboardSummaryAsync();
    }

    public class AnalyticsDal : IAnalyticsDal
    {
        private readonly string _connectionString;

        // Whitelist of analytics_daily columns that may be incremented via
        // UpsertDailyStatsAsync. `field` ultimately comes from application
        // code (not user input) in this module, but since it's used to
        // build a SQL identifier (columns can't be parameterized), it's
        // validated against this fixed map regardless - never interpolated
        // directly from a caller-supplied string.
        private static readonly Dictionary<string, string> DailyStatsColumns = new()
        {
            ["totalVisitors"] = "total_visitors",
            ["totalPageViews"] = "total_page_views",
            ["newRegistrations"] = "new_registrations",
            ["planFree"] = "plan_free",
            ["planHalf"] = "plan_half",
            ["planFull"] = "plan_full",
            ["subscribersGained"] = "subscribers_gained"
        };

        public AnalyticsDal(string connectionString)
        {
            _connectionString = connectionString;
        }

        private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

        // ---- Active sessions --------------------------------------------

        public async Task<ActiveSession> UpsertActiveSessionAsync(
            Guid userId, string sessionToken, string? pagePath, string? ipAddress, string? userAgent)
        {
            using IDbConnection db = CreateConnection();

            var existing = await db.QuerySingleOrDefaultAsync<ActiveSession>(
                "SELECT TOP 1 * FROM dbo.active_sessions WHERE session_token = @SessionToken",
                new { SessionToken = sessionToken });

            var now = DateTimeOffset.UtcNow;

            if (existing != null)
            {
                const string updateSql = @"
                    UPDATE dbo.active_sessions
                    SET last_seen = @Now, page_path = @PagePath
                    OUTPUT INSERTED.*
                    WHERE session_token = @SessionToken;";

                return await db.QuerySingleAsync<ActiveSession>(updateSql, new
                {
                    SessionToken = sessionToken,
                    Now = now,
                    PagePath = pagePath ?? existing.PagePath
                });
            }

            const string insertSql = @"
                INSERT INTO dbo.active_sessions (id, user_id, session_token, page_path, ip_address, user_agent, last_seen)
                OUTPUT INSERTED.*
                VALUES (@Id, @UserId, @SessionToken, @PagePath, @IpAddress, @UserAgent, @Now);";

            return await db.QuerySingleAsync<ActiveSession>(insertSql, new
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                SessionToken = sessionToken,
                PagePath = pagePath,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                Now = now
            });
        }

        public async Task<int> CountActiveSessionsAsync()
        {
            using IDbConnection db = CreateConnection();
            var fiveMinutesAgo = DateTimeOffset.UtcNow.AddMinutes(-5);
            const string sql = "SELECT COUNT(*) FROM dbo.active_sessions WHERE last_seen >= @FiveMinutesAgo";
            return await db.ExecuteScalarAsync<int>(sql, new { FiveMinutesAgo = fiveMinutesAgo });
        }

        public async Task CleanupOldSessionsAsync()
        {
            using IDbConnection db = CreateConnection();
            var thirtyMinutesAgo = DateTimeOffset.UtcNow.AddMinutes(-30);
            const string sql = "DELETE FROM dbo.active_sessions WHERE last_seen <= @ThirtyMinutesAgo";
            await db.ExecuteAsync(sql, new { ThirtyMinutesAgo = thirtyMinutesAgo });
        }

        // ---- Insert-or-ignore (replaces onConflictDoNothing) ---------------

        public async Task<bool> TrackVisitorSessionAsync(string sessionToken, DateTime date)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "INSERT INTO dbo.analytics_visitor_sessions (session_token, date) VALUES (@SessionToken, @Date)";
            try
            {
                await db.ExecuteAsync(sql, new { SessionToken = sessionToken, Date = date });
                return true;
            }
            catch (SqlException ex) when (ex.Number is 2627 or 2601)
            {
                // Composite PK (session_token, date) already exists for
                // today - same "already tracked" outcome as
                // onConflictDoNothing() returning zero rows.
                return false;
            }
        }

        public async Task<bool> TrackPageViewAsync(string sessionToken, string pagePath, DateTime date)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "INSERT INTO dbo.analytics_page_views (session_token, page_path, date) VALUES (@SessionToken, @PagePath, @Date)";
            try
            {
                await db.ExecuteAsync(sql, new { SessionToken = sessionToken, PagePath = pagePath, Date = date });
                return true;
            }
            catch (SqlException ex) when (ex.Number is 2627 or 2601)
            {
                return false;
            }
        }

        // ---- Upserts ---------------------------------------------------------

        public async Task UpsertDailyStatsAsync(DateTime date, string field, int increment)
        {
            if (!DailyStatsColumns.TryGetValue(field, out var column))
                throw new ArgumentException($"Unknown analytics_daily field: {field}", nameof(field));

            using IDbConnection db = CreateConnection();

            // MERGE gives an atomic increment-or-insert in one round trip,
            // unlike the source's select-then-conditionally-update-or-insert
            // (which has a small race window between the two statements).
            var sql = $@"
                MERGE dbo.analytics_daily AS target
                USING (SELECT @Date AS date) AS src
                ON target.date = src.date
                WHEN MATCHED THEN
                    UPDATE SET {column} = target.{column} + @Increment
                WHEN NOT MATCHED THEN
                    INSERT (id, date, {column}, created_at)
                    VALUES (NEWID(), @Date, @Increment, SYSDATETIMEOFFSET());";

            await db.ExecuteAsync(sql, new { Date = date, Increment = increment });
        }

        public async Task UpsertUtmSourceAsync(DateTime date, string source, int increment)
        {
            using IDbConnection db = CreateConnection();
            const string sql = @"
                MERGE dbo.analytics_utm_sources AS target
                USING (SELECT @Date AS date, @Source AS source) AS src
                ON target.date = src.date AND target.source = src.source
                WHEN MATCHED THEN
                    UPDATE SET visits = target.visits + @Increment
                WHEN NOT MATCHED THEN
                    INSERT (id, date, source, visits)
                    VALUES (NEWID(), @Date, @Source, @Increment);";

            await db.ExecuteAsync(sql, new { Date = date, Source = source, Increment = increment });
        }

        // ---- Reads -------------------------------------------------------

        public async Task<List<AnalyticsDaily>> GetDailyStatsAsync(DateTime? from, DateTime? to)
        {
            using IDbConnection db = CreateConnection();

            var conditions = new List<string>();
            if (from.HasValue) conditions.Add("date >= @From");
            if (to.HasValue) conditions.Add("date <= @To");
            var whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";

            var sql = $"SELECT * FROM dbo.analytics_daily {whereClause} ORDER BY date ASC;";
            var rows = await db.QueryAsync<AnalyticsDaily>(sql, new { From = from, To = to });
            return rows.ToList();
        }

        // ---- Dashboard summary ------------------------------------------

        // Each sub-query below opens its OWN connection so they can safely
        // run concurrently via Task.WhenAll (a single SqlConnection can't
        // run overlapping commands without MARS enabled) - this actually
        // reproduces the source's Promise.all concurrency more faithfully
        // than sharing one connection ever could.
        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync()
        {
            var today = DateTime.UtcNow.Date;
            var fiveMinutesAgo = DateTimeOffset.UtcNow.AddMinutes(-5);
            var sevenDaysAgoTimestamp = DateTimeOffset.UtcNow.AddDays(-7);
            var sevenDaysAgoDate = DateTime.UtcNow.Date.AddDays(-7);

            var totalUsersTask = ScalarAsync("SELECT COUNT(*) FROM dbo.users");
            var totalCoursesTask = ScalarAsync("SELECT COUNT(*) FROM dbo.courses");
            var activeSessionsTask = ScalarAsync(
                "SELECT COUNT(*) FROM dbo.active_sessions WHERE last_seen >= @P", new { P = fiveMinutesAgo });
            var totalExamsTask = ScalarAsync("SELECT COUNT(*) FROM dbo.exams");
            var recentRegsTask = ScalarAsync(
                "SELECT COUNT(*) FROM dbo.users WHERE created_at >= @P", new { P = sevenDaysAgoTimestamp });
            var planDistTask = PlanDistributionAsync();
            var totalFeedbackTask = ScalarAsync("SELECT COUNT(*) FROM dbo.feedback");
            var totalSubscribersTask = ScalarAsync("SELECT COUNT(*) FROM dbo.subscribers");
            var todayStatsTask = TodayStatsAsync(today);
            var utmTask = TopUtmSourcesAsync();
            var totalVisitorsTask = ScalarAsync("SELECT COUNT(DISTINCT session_token) FROM dbo.analytics_visitor_sessions");
            var todayVisitorsTask = ScalarAsync(
                "SELECT COUNT(DISTINCT session_token) FROM dbo.analytics_visitor_sessions WHERE date = @P", new { P = today });
            var weeklyVisitorsTask = ScalarAsync(
                "SELECT COUNT(DISTINCT session_token) FROM dbo.analytics_visitor_sessions WHERE date >= @P", new { P = sevenDaysAgoDate });
            var todayPageViewsTask = ScalarAsync(
                "SELECT COUNT(*) FROM dbo.analytics_page_views WHERE date = @P", new { P = today });
            var visitorTrendTask = VisitorTrendAsync(sevenDaysAgoDate);
            var pageViewTrendTask = PageViewTrendAsync(sevenDaysAgoDate);

            await Task.WhenAll(
                totalUsersTask, totalCoursesTask, activeSessionsTask, totalExamsTask, recentRegsTask,
                planDistTask, totalFeedbackTask, totalSubscribersTask, todayStatsTask, utmTask,
                totalVisitorsTask, todayVisitorsTask, weeklyVisitorsTask, todayPageViewsTask,
                visitorTrendTask, pageViewTrendTask);

            // Merge the two per-day series into one keyed-by-date map,
            // same approach as the source's trendByDate Map.
            var trendByDate = new Dictionary<string, VisitorTrendPointDto>();
            foreach (var r in visitorTrendTask.Result)
                trendByDate[r.Date] = new VisitorTrendPointDto { Date = r.Date, Visitors = r.Visitors, PageViews = 0 };
            foreach (var r in pageViewTrendTask.Result)
            {
                if (trendByDate.TryGetValue(r.Date, out var existing))
                    existing.PageViews = r.PageViews;
                else
                    trendByDate[r.Date] = new VisitorTrendPointDto { Date = r.Date, Visitors = 0, PageViews = r.PageViews };
            }
            var visitorTrend = trendByDate.Values.OrderBy(v => v.Date, StringComparer.Ordinal).ToList();

            var todayStats = todayStatsTask.Result;

            return new DashboardSummaryDto
            {
                TotalUsers = totalUsersTask.Result,
                TotalCourses = totalCoursesTask.Result,
                ActiveSessionsNow = activeSessionsTask.Result,
                TotalExams = totalExamsTask.Result,
                RecentRegistrations = recentRegsTask.Result,
                PlanDistribution = planDistTask.Result,
                TotalFeedback = totalFeedbackTask.Result,
                TotalSubscribers = totalSubscribersTask.Result,
                TodayPageViews = todayPageViewsTask.Result,
                TodayVisitors = todayVisitorsTask.Result,
                TodayNewRegistrations = todayStats?.NewRegistrations ?? 0,
                UtmSources = utmTask.Result,
                TotalVisitors = totalVisitorsTask.Result,
                WeeklyVisitors = weeklyVisitorsTask.Result,
                VisitorTrend = visitorTrend
            };
        }

        // ---- Dashboard summary sub-query helpers (each opens its own connection) ----

        private async Task<int> ScalarAsync(string sql, object? param = null)
        {
            using IDbConnection db = CreateConnection();
            return await db.ExecuteScalarAsync<int>(sql, param);
        }

        private async Task<List<PlanDistributionDto>> PlanDistributionAsync()
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT plan AS Plan, COUNT(*) AS Count FROM dbo.student_profiles GROUP BY plan;";
            var rows = await db.QueryAsync<PlanDistributionDto>(sql);
            return rows.ToList();
        }

        private async Task<AnalyticsDaily?> TodayStatsAsync(DateTime today)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT TOP 1 * FROM dbo.analytics_daily WHERE date = @Today;";
            return await db.QuerySingleOrDefaultAsync<AnalyticsDaily>(sql, new { Today = today });
        }

        private async Task<List<UtmSourceDto>> TopUtmSourcesAsync()
        {
            using IDbConnection db = CreateConnection();
            const string sql = @"
                SELECT TOP 8 source AS Source, SUM(visits) AS Visits
                FROM dbo.analytics_utm_sources
                GROUP BY source
                ORDER BY SUM(visits) DESC;";
            var rows = await db.QueryAsync<UtmSourceDto>(sql);
            return rows.ToList();
        }

        // Internal-only row shape for the two 7-day trend queries - each
        // query only populates the field it selects (Visitors or
        // PageViews); the other stays at its default (0) and gets merged
        // in GetDashboardSummaryAsync.
        private class TrendRow
        {
            public string Date { get; set; } = string.Empty;
            public int Visitors { get; set; }
            public int PageViews { get; set; }
        }

        private async Task<List<TrendRow>> VisitorTrendAsync(DateTime sevenDaysAgoDate)
        {
            using IDbConnection db = CreateConnection();
            const string sql = @"
                SELECT CONVERT(varchar(10), date, 23) AS Date, COUNT(DISTINCT session_token) AS Visitors
                FROM dbo.analytics_visitor_sessions
                WHERE date >= @From
                GROUP BY date;";
            var rows = await db.QueryAsync<TrendRow>(sql, new { From = sevenDaysAgoDate });
            return rows.ToList();
        }

        private async Task<List<TrendRow>> PageViewTrendAsync(DateTime sevenDaysAgoDate)
        {
            using IDbConnection db = CreateConnection();
            const string sql = @"
                SELECT CONVERT(varchar(10), date, 23) AS Date, COUNT(*) AS PageViews
                FROM dbo.analytics_page_views
                WHERE date >= @From
                GROUP BY date;";
            var rows = await db.QueryAsync<TrendRow>(sql, new { From = sevenDaysAgoDate });
            return rows.ToList();
        }
    }
}