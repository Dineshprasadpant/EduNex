using System;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    public class Subscriber
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public string Email { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
    public class FileUploadResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string Url { get; set; }
        public string Key { get; set; }
        public long Size { get; set; }
        public string Format { get; set; }
        public Guid public_id { get; set; }
        public string OriginalFileName { get; set; }
    }
    public class Advertisement
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string ImageUrl { get; set; }
        public string LinkUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

        public class Feedback
        {
            [JsonPropertyName("_id")]
            public Guid Id { get; set; }

            public string Name { get; set; }
            public string Email { get; set; }
            public int Rating { get; set; }

            [JsonPropertyName("feedback")]
            public string FeedbackText { get; set; } // Renamed in C# but mapped to 'feedback' in JSON

            public DateTime CreatedAt { get; set; }
        }
}
