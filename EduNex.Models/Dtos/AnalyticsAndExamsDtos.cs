using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduNex.Models
{ 
    public class AnalyticsDto
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public int TotalVisitors { get; set; }
        public int TotalVisits { get; set; }
        public int SubscribersGain { get; set; }
        
        [JsonPropertyName("utmSources")]
        public List<UtmSourceDto> UtmSources { get; set; } = new List<UtmSourceDto>();
        
        [JsonPropertyName("enrolledPlan")]
        public EnrolledPlanDto EnrolledPlan { get; set; }
    }

    public class EnrolledPlanDto
    {
        public int Free { get; set; }
        public int Half { get; set; }
        public int Full { get; set; }
    }

    // --- Exams ---
    public class ExamAnalyticsDto
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        [JsonPropertyName("exam_id")]
        public string? ExternalId { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        [JsonPropertyName("exam_name")]
        public string? ExamName { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        [JsonPropertyName("total_marks")]
        public int TotalMarks { get; set; }
        [JsonPropertyName("pass_marks")]
        public int PassMarks { get; set; }
        public int Duration { get; set; }
        public bool NegativeMarking { get; set; }
        public decimal? NegativeMarkingNumber { get; set; }
    }
}

namespace EduNex.Models
{
    // ---- Requests -----------------------------------------------------------

    public class HeartbeatRequest
    {
        [Required, MinLength(1)]
        public string SessionToken { get; set; } = string.Empty;
        public string? PagePath { get; set; }
    }

    public class PageviewRequest
    {
        [Required, MinLength(1)]
        public string SessionToken { get; set; } = string.Empty;
        [Required, MinLength(1)]
        public string PagePath { get; set; } = string.Empty;
        public string? UtmSource { get; set; }
    }

    // No validation attributes on purpose - dailyStatsSchema in the TS
    // source has both fields as plain `.optional()` strings with no format
    // check. An unparsable date is expected to bubble up as an uncaught
    // error (500), same as Postgres would reject it - see AnalyticsService.
    public class DailyStatsQuery
    {
        public string? From { get; set; }
        public string? To { get; set; }
    }

    // ---- Responses ------------------------------------------------------

    // Shared by both heartbeat and pageview - both endpoints return
    // { ok: true } in every case, including when a pageview is silently
    // skipped for being a non-public (dashboard) path.
    public class OkResultDto
    {
        public bool Ok { get; set; } = true;
    }

    public class ActiveNowDto
    {
        public int ActiveSessionsNow { get; set; }
    }

    // Matches the raw analytics_daily row shape returned by getDailyStats,
    // with Date reformatted to a plain "yyyy-MM-dd" string (the DB column
    // is DATE-only; TS/Drizzle surfaces it as a string, not a datetime).
    public class AnalyticsDailyDto
    {
        public Guid Id { get; set; }
        public string Date { get; set; } = string.Empty;
        public int TotalVisitors { get; set; }
        public int TotalPageViews { get; set; }
        public int NewRegistrations { get; set; }
        public int PlanFree { get; set; }
        public int PlanHalf { get; set; }
        public int PlanFull { get; set; }
        public int SubscribersGained { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class PlanDistributionDto
    {
        public string? Plan { get; set; }
        public int Count { get; set; }
    }

    public class UtmSourceDto
    {
        public string Source { get; set; } = string.Empty;
        public int Visits { get; set; }
    }

    public class VisitorTrendPointDto
    {
        public string Date { get; set; } = string.Empty;
        public int Visitors { get; set; }
        public int PageViews { get; set; }
    }

    public class DashboardSummaryDto
    {
        public int TotalUsers { get; set; }
        public int TotalCourses { get; set; }
        public int ActiveSessionsNow { get; set; }
        public int TotalExams { get; set; }
        public int RecentRegistrations { get; set; }
        public List<PlanDistributionDto> PlanDistribution { get; set; } = new();
        public int TotalFeedback { get; set; }
        public int TotalSubscribers { get; set; }
        public int TodayPageViews { get; set; }
        public int TodayVisitors { get; set; }
        public int TodayNewRegistrations { get; set; }
        public List<UtmSourceDto> UtmSources { get; set; } = new();
        public int TotalVisitors { get; set; }
        public int WeeklyVisitors { get; set; }
        public List<VisitorTrendPointDto> VisitorTrend { get; set; } = new();
    }
}