using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    public class QuestionSheet
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public string SheetName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<Questionmodel> Questions { get; set; } = new List<Questionmodel>();
    }

    public class Questionmodel
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public string question { get; set; }
        public int Marks { get; set; }
        public List<string> Answers { get; set; } = new List<string>();
        public string CorrectAnswer { get; set; }
    }
}
