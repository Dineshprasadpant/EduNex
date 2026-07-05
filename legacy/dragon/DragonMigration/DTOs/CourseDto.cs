using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.DTOs
{
    // --- Shared Nested Types ---
    public class LearningFormatDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }

    public class CurriculumItemDto
    {
        public string Title { get; set; }
        public int Duration { get; set; }
        public string Description { get; set; }
    }

    public class ScheduleItemDto
    {
        public string Day { get; set; }
        public string Medium { get; set; }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
    }

    // --- Course Summary (For Lists) ---
    public class CourseSummaryDto
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Category { get; set; }
        public int StudentsEnrolled { get; set; }
        public string ModuleLeader { get; set; }
        public int OverallHours { get; set; }
        public decimal Price { get; set; }
        public int TeachersCount { get; set; }
        public string Image { get; set; }
        public string Priority { get; set; }
        public string DeliveryMode { get; set; }
        public decimal OnlinePrice { get; set; }
        public decimal OfflinePrice { get; set; }
    }

    // --- Course Full Detail ---
    public class CourseDetailDto : CourseSummaryDto
    {
        public List<string> Description { get; set; } = new List<string>();
        public List<string> CourseHighlights { get; set; } = new List<string>();
        
        [JsonPropertyName("learningFormat")]
        public List<LearningFormatDto> LearningFormat { get; set; } = new List<LearningFormatDto>();
        
        public List<CurriculumItemDto> Curriculum { get; set; } = new List<CurriculumItemDto>();
        public List<ScheduleItemDto> Schedule { get; set; } = new List<ScheduleItemDto>();
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // --- Response Wrappers ---
    public class CoursePaginationDto
    {
        public int CurrentPage { get; set; }
        public int ItemsPerPage { get; set; }
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    public class CourseResponseDto
    {
        [JsonPropertyName("status")]
        public string Status { get; set; } = "success";
        
        [JsonPropertyName("data")]
        public CourseDataDto Data { get; set; }
    }

    public class CourseDataDto
    {
        [JsonPropertyName("courses")]
        public IEnumerable<CourseSummaryDto> Courses { get; set; }
        
        [JsonPropertyName("pagination")]
        public CoursePaginationDto Pagination { get; set; }
    }

    // Wrapper for single course details (e.g., GetById)
    public class CourseDetailResponseDto
    {
        [JsonPropertyName("status")]
        public string Status { get; set; } = "success";
        
        [JsonPropertyName("data")]
        public CourseDetailDto Data { get; set; }
    }
}
