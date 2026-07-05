using System;
using System.Collections.Generic;

namespace EduNex.Models
{
    public class BatchDto
    {
        public Guid Id { get; set; }
        public string BatchName { get; set; }
        public Guid CourseId { get; set; }
        public string CourseTitle { get; set; }
    }

    public class ScheduledMeetingDto
    {
        public string Title { get; set; }
        public string MeetingLink { get; set; }
        public string Date { get; set; }
        public string Time { get; set; }
        public int DurationMinutes { get; set; }
    }
}
