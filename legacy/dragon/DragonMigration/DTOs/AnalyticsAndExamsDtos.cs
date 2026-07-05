using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Dragon.DTOs
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

    public class UtmSourceDto
    {
        public string Source { get; set; }
        public int Users { get; set; }
    }

    public class EnrolledPlanDto
    {
        public int Free { get; set; }
        public int Half { get; set; }
        public int Full { get; set; }
    }

    // --- Exams ---
    public class ExamDto
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        [JsonPropertyName("exam_id")]
        public string ExternalId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        [JsonPropertyName("exam_name")]
        public string ExamName { get; set; }
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
