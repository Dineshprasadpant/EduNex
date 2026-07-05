using System;
using System.Collections.Generic;

namespace EduNex.Models
{
    public class ExamPerformance
    {
        public Guid Id { get; set; }
        public Guid BatchId { get; set; }
        public Guid ExamId { get; set; }
        public string AcademicYear { get; set; }
        public decimal OverallPercentage { get; set; }
        public int NumberOfExaminees { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<HighestScorer> HighestScorers { get; set; } = new List<HighestScorer>();
    }

    public class HighestScorer
    {
        public Guid StudentId { get; set; }
        public decimal Percentage { get; set; }
    }
}
