using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace EduNex.Models
{

    public class QuestionSheetSummary
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int TotalQuestions { get; set; }
    }

    public class AttemptCounts
    {
        public int Attempts { get; set; }
        public int SubmittedAttempts { get; set; }
        public int InProgressAttempts { get; set; }
    }

    public class ExamFilters
    {
        public string? Search { get; set; }
        public string? Plan { get; set; }
        public string? Status { get; set; }
        public Guid? EnrolledCourseId { get; set; }
        public DateTimeOffset? ActiveAt { get; set; }
        public Guid? ExcludeSubmittedByUserId { get; set; }
    }
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
        public string AccessPlans { get; set; } = "[\"free\",\"half\",\"full\"]";
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
        public string Status { get; set; } = ExamAttemptStatus.InProgress;
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

    public class QuestionSheet
    {
        public Guid Id { get; set; }
        public string SheetName { get; set; } = string.Empty;
        public Guid? CreatedBy { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }

    public class Question
    {
        public Guid Id { get; set; }
        public Guid SheetId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public decimal Marks { get; set; }
        public int SortOrder { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class QuestionOption
    {
        public Guid Id { get; set; }
        public Guid QuestionId { get; set; }
        public string OptionText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public int SortOrder { get; set; }
    }

    public static class ExamAttemptStatus
    {
        public const string InProgress = "in_progress";
        public const string Submitted = "submitted";
        public const string TimedOut = "timed_out";
    }

    // Query-only status derived from [start,end] vs now -- not a stored value.
    public static class ExamLifecycleStatus
    {
        public const string Upcoming = "upcoming";
        public const string Active = "active";
        public const string Ended = "ended";
    }
}