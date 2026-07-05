using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    public class createBatchDto
    {
        public string batch_name { get; set; }
        public Guid? course { get; set; }
    }
    public class Batch
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        [JsonPropertyName("batch_name")]
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
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public Guid BatchId { get; set; }
        public string Title { get; set; }
        public string Meeting_Link { get; set; }
        public string Date { get; set; }
        public string Time { get; set; }
        public DateTime ExpiryTime { get; set; }
        public int Duration_Minutes { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
