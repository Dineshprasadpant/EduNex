using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace EduNex.Models
{
    public class UserAnalytics
    {
        public Guid Id { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public int TotalVisitors { get; set; }
        public int TotalVisits { get; set; }
        public int SubscribersGain { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<UtmSource> UtmSources { get; set; } = new List<UtmSource>();
        public EnrolledPlan EnrolledPlan { get; set; } = new EnrolledPlan();
    }

    public class UtmSource
    {
        public string Source { get; set; }
        public int Users { get; set; }
    }

    public class EnrolledPlan
    {
        public int Free { get; set; }
        public int Half { get; set; }
        public int Full { get; set; }
    }
    public class LeaderboardQuery
    {
        public Guid? ExamId { get; set; }
        public Guid? CourseId { get; set; }

        [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "Date must be YYYY-MM-DD")]
        public string? From { get; set; }

        [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "Date must be YYYY-MM-DD")]
        public string? To { get; set; }

        // No [Range] - matches the bare z.coerce.number().default(1)/
        // .default(50), no .int()/.positive()/.max() refinement.
        public int? Page { get; set; }
        public int? Limit { get; set; }
    }

    public class LeaderboardEntryDto
    {
        public int Rank { get; set; }
        public string? Medal { get; set; }
        public Guid UserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public Guid ExamId { get; set; }
        public string ExamTitle { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public decimal TotalMarks { get; set; }
        public decimal Percentage { get; set; }
        public int? TimeTakenSeconds { get; set; }
        public DateTimeOffset SubmittedAt { get; set; }
        public string? Status { get; set; }
    }
}
