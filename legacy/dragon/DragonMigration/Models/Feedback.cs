using System;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
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
