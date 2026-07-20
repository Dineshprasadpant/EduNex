using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    public enum DeliveryMode { Online, Offline, Hybrid }
    public enum Priority { High, Medium, Low }

    public static class CourseType
    {
        public const string Online = "online";
        public const string Offline = "offline";
    }
    public class Course
    {
        public Guid Id { get; set; }
        public string Slug { get; set; } = "";
        public string Title { get; set; } = "";
        public string Overview { get; set; } = "";
        public decimal? Price { get; set; }
        public int Discount { get; set; }
        public int DurationDays { get; set; }
        public string CourseTypeValue { get; set; } = CourseType.Offline;
        public string Description { get; set; } = "";
        public string? Information { get; set; }
        public Guid? CategoryId { get; set; }
        public string? Image { get; set; }
        public Guid? MediaId { get; set; }
        public bool IsTrending { get; set; }
        public bool IsActive { get; set; } = true;
        public int Views { get; set; }
        public string? FreeFeatures { get; set; }
        public string? HalfFeatures { get; set; }
        public string? PaidFeatures { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
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


