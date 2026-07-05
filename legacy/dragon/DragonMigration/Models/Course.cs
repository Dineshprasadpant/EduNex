using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
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
        public string Priority { get; set; } = "medium";
        public string DeliveryMode { get; set; } = "online";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation for full details
        public List<LearningFormat> LearningFormat { get; set; } = new List<LearningFormat>();
        public List<CurriculumItem> Curriculum { get; set; } = new List<CurriculumItem>();
        public List<ScheduleItem> Schedule { get; set; } = new List<ScheduleItem>();
    }
}
