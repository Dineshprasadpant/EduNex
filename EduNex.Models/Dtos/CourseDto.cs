using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    public class CourseSummaryDto
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Image { get; set; }
        public int StudentsEnrolled { get; set; }
        public int TeachersCount { get; set; }
        public int OverallHours { get; set; }
        public string ModuleLeader { get; set; }
        public string Category { get; set; }
        public decimal Price { get; set; }
        public decimal OnlinePrice { get; set; }
        public decimal OfflinePrice { get; set; }
        public string Priority { get; set; }
        public string DeliveryMode { get; set; }
    }

    public class CourseFullDto : CourseSummaryDto
    {
        public List<string> Description { get; set; } = new();
        public List<string> CourseHighlights { get; set; } = new();
        public List<LearningFormat> LearningFormat { get; set; } = new();
        public List<CurriculumItem> Curriculum { get; set; } = new();
        public List<ScheduleItem> Schedule { get; set; } = new();
    }

    public class CoursePaginationDto
    {
        public int CurrentPage { get; set; }
        public int ItemsPerPage { get; set; }
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    public class PagedResultDto<T>
    {
        [JsonPropertyName("courses")]
        public IEnumerable<T> Courses { get; set; }

        [JsonPropertyName("pagination")]
        public CoursePaginationDto Pagination { get; set; }
    }
}