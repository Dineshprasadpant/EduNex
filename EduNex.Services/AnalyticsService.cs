using EduNex.DataAccess;
using EduNex.Models;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace EduNex.Services
{
    public interface IAnalyticsService
    {
        Task<OkResultDto> HeartbeatAsync(Guid userId, string sessionToken, string? pagePath, string? ipAddress, string? userAgent);
        Task<OkResultDto> RecordPageviewAsync(string sessionToken, string pagePath, string? utmSource, string? ipAddress);
        Task<ActiveNowDto> GetActiveNowAsync();
        Task<List<AnalyticsDailyDto>> GetDailyStatsAsync(string? from, string? to);
        Task<DashboardSummaryDto> GetDashboardSummaryAsync();
        Task<(List<LeaderboardEntryDto> Data, int Total, int Page, int Limit)> GetLeaderboardAsync(LeaderboardQuery query);
    }

    public class AnalyticsService : IAnalyticsService
    {
        private readonly IAnalyticsDal _repo;

        public AnalyticsService(IAnalyticsDal repo)
        {
            _repo = repo;
        }

        // Visitor/page-view analytics only count the public-facing site.
        // Anything under the authenticated app (the dashboard) is excluded
        // so internal navigation never inflates the numbers.
        private static bool IsPublicPath(string? pagePath)
        {
            if (string.IsNullOrEmpty(pagePath)) return false;
            var path = pagePath.Split('?')[0];
            return !path.StartsWith("/dashboard");
        }

        public async Task<OkResultDto> HeartbeatAsync(
            Guid userId, string sessionToken, string? pagePath, string? ipAddress, string? userAgent)
        {
            await _repo.UpsertActiveSessionAsync(userId, sessionToken, pagePath, ipAddress, userAgent);

            // Occasionally clean up stale sessions (roughly 5% of requests).
            // Fire-and-forget, matching `.catch(() => void 0)` in the
            // source - errors are swallowed, not surfaced to the caller.
            if (Random.Shared.NextDouble() < 0.05)
            {
                _ = Task.Run(async () =>
                {
                    try { await _repo.CleanupOldSessionsAsync(); }
                    catch { /* intentionally swallowed */ }
                });
            }

            return new OkResultDto();
        }

        public async Task<OkResultDto> RecordPageviewAsync(
            string sessionToken, string pagePath, string? utmSource, string? ipAddress)
        {
            // Only the public site is tracked - ignore dashboard/app navigation.
            if (!IsPublicPath(pagePath))
                return new OkResultDto();

            var today = DateTime.UtcNow.Date;

            // Count this page view at most once per (session, page, day). A
            // reload or a retried request hits the same key and is ignored.
            var visitorTask = _repo.TrackVisitorSessionAsync(sessionToken, today);
            var pageViewTask = _repo.TrackPageViewAsync(sessionToken, pagePath, today);
            await Task.WhenAll(visitorTask, pageViewTask);

            var isNewVisitor = visitorTask.Result;
            var isNewPageView = pageViewTask.Result;

            if (isNewPageView)
                await _repo.UpsertDailyStatsAsync(today, "totalPageViews", 1);

            if (isNewVisitor)
            {
                await _repo.UpsertDailyStatsAsync(today, "totalVisitors", 1);

                // A UTM source is only meaningful on a visitor's first
                // landing of the day.
                if (!string.IsNullOrEmpty(utmSource))
                    await _repo.UpsertUtmSourceAsync(today, utmSource, 1);
            }

            return new OkResultDto();
        }

        public async Task<ActiveNowDto> GetActiveNowAsync()
        {
            var count = await _repo.CountActiveSessionsAsync();
            return new ActiveNowDto { ActiveSessionsNow = count };
        }

        public async Task<List<AnalyticsDailyDto>> GetDailyStatsAsync(string? from, string? to)
        {
            // No format validation here on purpose (matches
            // dailyStatsSchema's plain `.optional()` strings) - an
            // unparsable date throws and falls through to the global
            // exception middleware as a 500, same as an invalid date
            // literal would fail inside Postgres.
            DateTime? fromDate = string.IsNullOrEmpty(from) ? null : DateTime.Parse(from);
            DateTime? toDate = string.IsNullOrEmpty(to) ? null : DateTime.Parse(to);

            var rows = await _repo.GetDailyStatsAsync(fromDate, toDate);

            return rows.Select(r => new AnalyticsDailyDto
            {
                Id = r.Id,
                Date = r.Date.ToString("yyyy-MM-dd"),
                TotalVisitors = r.TotalVisitors,
                TotalPageViews = r.TotalPageViews,
                NewRegistrations = r.NewRegistrations,
                PlanFree = r.PlanFree,
                PlanHalf = r.PlanHalf,
                PlanFull = r.PlanFull,
                SubscribersGained = r.SubscribersGained,
                CreatedAt = r.CreatedAt
            }).ToList();
        }

        public Task<DashboardSummaryDto> GetDashboardSummaryAsync() => _repo.GetDashboardSummaryAsync();
        public async Task<(List<LeaderboardEntryDto> Data, int Total, int Page, int Limit)> GetLeaderboardAsync(LeaderboardQuery query)
        {
            var page = Math.Max(1, query.Page ?? 1);
           
            var limit = Math.Min(100, Math.Max(1, query.Limit ?? 50));
            var offset = (page - 1) * limit;

            var from = ParseDateExact(query.From);
            var to = ParseDateExact(query.To);

            var (rows, total) = await _repo.GetLeaderboardAsync(query.ExamId, query.CourseId, from, to, limit, offset);

            foreach (var entry in rows)
                entry.Medal = GetMedal(entry.Rank);

            return (rows, total, page, limit);
        }

        private static DateTime? ParseDateExact(string? raw) =>
            string.IsNullOrEmpty(raw)
                ? null
                : DateTime.ParseExact(raw, "yyyy-MM-dd", CultureInfo.InvariantCulture);

        private static string? GetMedal(int rank) => rank switch
        {
            1 => "gold",
            2 => "silver",
            3 => "bronze",
            _ => null
        };
    }
}