using System;
using System.Collections.Generic;

namespace EduNex.Models
{
    public class Exam
    {
        public Guid Id { get; set; }
        public string ExamId { get; set; } // Custom string ID from existing system
        public string Title { get; set; }
        public string Description { get; set; }
        public string ExamName { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public int TotalMarks { get; set; }
        public int PassMarks { get; set; }
        public int Duration { get; set; }
        public bool NegativeMarking { get; set; }
        public decimal? NegativeMarkingNumber { get; set; }
        public Guid QuestionSheetId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string? Status { get; set; }

        // Relationships
        public List<Guid> BatchIds { get; set; } = new List<Guid>();
        public List<BatchRef> Batches { get; set; } = new List<BatchRef>();
    }
}
