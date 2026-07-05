using System;
using System.Collections.Generic;

namespace EduNex.Models
{
    public class Batch
    {
        public Guid Id { get; set; }
        public string BatchName { get; set; }
        public Guid CourseId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation / Populated fields
        public string CourseTitle { get; set; }
        public List<ScheduledMeeting> ScheduledMeetings { get; set; } = new List<ScheduledMeeting>();
    }

    public class ScheduledMeeting
    {
        public Guid Id { get; set; }
        public Guid BatchId { get; set; }
        public string Title { get; set; }
        public string MeetingLink { get; set; }
        public string Date { get; set; }
        public string Time { get; set; }
        public DateTime ExpiryTime { get; set; }
        public int DurationMinutes { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
