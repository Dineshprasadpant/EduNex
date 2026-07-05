using System;
using System.Collections.Generic;

namespace Dragon.Models
{
    public class QuestionSheet
    {
        public Guid Id { get; set; }
        public string SheetName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<Question> Questions { get; set; } = new List<Question>();
    }

    public class Question
    {
        public Guid Id { get; set; }
        public string QuestionText { get; set; }
        public int Marks { get; set; }
        public List<string> Answers { get; set; } = new List<string>();
        public string CorrectAnswer { get; set; }
    }
}
