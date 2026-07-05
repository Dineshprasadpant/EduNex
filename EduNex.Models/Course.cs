using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    public enum DeliveryMode { Online, Offline, Hybrid }
    public enum Priority { High, Medium, Low }

    public class Course
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Image { get; set; }
        public List<string> Description { get; set; } = new List<string>();
        public int StudentsEnrolled { get; set; }
        public int TeachersCount { get; set; }
        public List<string> CourseHighlights { get; set; } = new List<string>();
        public int OverallHours { get; set; }
        public string ModuleLeader { get; set; }
        public string Category { get; set; }
        public decimal Price { get; set; }
        public decimal OnlinePrice { get; set; }
        public decimal OfflinePrice { get; set; }
        public Priority Priority { get; set; } = Priority.Medium;
        public DeliveryMode DeliveryMode { get; set; } = DeliveryMode.Online;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<LearningFormat> LearningFormat { get; set; } = new List<LearningFormat>();
        public List<CurriculumItem> Curriculum { get; set; } = new List<CurriculumItem>();
        public List<ScheduleItem> Schedule { get; set; } = new List<ScheduleItem>();
    }

    public class LearningFormat
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }

    public class CurriculumItem
    {
        public string Title { get; set; }
        public int Duration { get; set; }
        public string Description { get; set; }
    }

    public class ScheduleItem
    {
        public DayOfWeek Day { get; set; }
        public string Medium { get; set; }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
    }
    public class CourseDescriptionRow
    {
        public Guid CourseId { get; set; }
        public string Content { get; set; }
        public int SortOrder { get; set; }
    }

    public class CourseHighlightRow
    {
        public Guid CourseId { get; set; }
        public string Highlight { get; set; }
    }

    public class LearningFormatRow : LearningFormat
    {
        public Guid CourseId { get; set; }
    }

    public class CurriculumItemRow : CurriculumItem
    {
        public Guid CourseId { get; set; }
    }

    public class ScheduleItemRow
    {
        public Guid CourseId { get; set; }
        public string Day { get; set; } 
        public string Medium { get; set; }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
    }
}


