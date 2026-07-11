using System;
using System.Collections.Generic;

namespace EduNex.Models
{
    public class Exam
    {
        public Guid Id { get; set; }
        public string ExamCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTimeOffset StartDateTime { get; set; }
        public DateTimeOffset EndDateTime { get; set; }
        public decimal TotalMarks { get; set; }
        public decimal? PassMarks { get; set; }
        public int DurationMinutes { get; set; }
        public bool NegativeMarking { get; set; }
        public decimal? NegativeMarkingValue { get; set; }
        public Guid QuestionSheetId { get; set; }
        public Guid? CourseId { get; set; }
        // Stored as a JSON array string, e.g. ["free","half","paid"].
        // Serialize/deserialize with System.Text.Json where you use this,
        // e.g. JsonSerializer.Deserialize<string[]>(exam.AccessPlansJson)
        public string AccessPlansJson { get; set; } = "[\"free\",\"half\",\"paid\"]";
        public Guid? CreatedBy { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }

    public class ExamAttempt
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid ExamId { get; set; }
        public DateTimeOffset StartedAt { get; set; }
        public DateTimeOffset? SubmittedAt { get; set; }
        public string Status { get; set; } = "in_progress";
        public decimal? TotalMarks { get; set; }
        public decimal? MarksObtained { get; set; }
        public int? CorrectAnswers { get; set; }
        public int? IncorrectAnswers { get; set; }
        public int? Unanswered { get; set; }
        public decimal? Percentage { get; set; }
        public int? TimeTakenSeconds { get; set; }
    }

    public class ExamAttemptAnswer
    {
        public Guid Id { get; set; }
        public Guid AttemptId { get; set; }
        public Guid QuestionId { get; set; }
        public Guid? SelectedOptionId { get; set; }
        public bool? IsCorrect { get; set; }
        public bool IsFlagged { get; set; }
        public DateTimeOffset? AnsweredAt { get; set; }
    }
}
