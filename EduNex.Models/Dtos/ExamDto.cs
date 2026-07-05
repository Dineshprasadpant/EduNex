using System;
using System.Collections.Generic;

namespace EduNex.Models
{
    public class ExamDto
    {
        public Guid Id { get; set; }
        public string ExamId { get; set; }
        public string Title { get; set; }
        public string ExamName { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public int TotalMarks { get; set; }
        public int Duration { get; set; }
    }

    public class CreateExamDto
    {
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
        public List<Guid> BatchIds { get; set; }
    }
}
