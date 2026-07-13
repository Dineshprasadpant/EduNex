using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    public class ListExamsQueryDto
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 10;
        public string? Search { get; set; }
        // upcoming | active | ended
        public string? Status { get; set; }
    }

    public class CreateExamRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTimeOffset StartDateTime { get; set; }
        public DateTimeOffset EndDateTime { get; set; }
        public decimal? PassMarks { get; set; }
        public int DurationMinutes { get; set; }
        public bool NegativeMarking { get; set; } = false;
        public decimal? NegativeMarkingValue { get; set; }
        public Guid QuestionSheetId { get; set; }
        public Guid? CourseId { get; set; }
        public List<string> AccessPlans { get; set; } = new() { PlanType.Free, PlanType.Half, PlanType.Full };
    }
    public class UpdateExamRequestDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTimeOffset? StartDateTime { get; set; }
        public DateTimeOffset? EndDateTime { get; set; }
        public decimal? PassMarks { get; set; }
        public int? DurationMinutes { get; set; }
        public bool? NegativeMarking { get; set; }
        public decimal? NegativeMarkingValue { get; set; }
        public Guid? QuestionSheetId { get; set; }
        public Guid? CourseId { get; set; }
        public List<string>? AccessPlans { get; set; }
    }

    public class QuestionSheetSummaryDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int? TotalQuestions { get; set; }
    }

    public class ExamListItemDto
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
        public List<string> AccessPlans { get; set; } = new();
        public Guid? CreatedBy { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        public QuestionSheetSummaryDto? QuestionSheet { get; set; }
    }

    public class ExamAttemptCountsDto
    {
        public int Attempts { get; set; }
        public int SubmittedAttempts { get; set; }
        public int InProgressAttempts { get; set; }
    }

    public class ExamDetailDto : ExamListItemDto
    {
        public ExamAttemptCountsDto Count { get; set; } = new();
    }

    public class ExamSummaryDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal TotalMarks { get; set; }
        public decimal? PassMarks { get; set; }
    }

    public class StartAttemptExamDto : ExamSummaryDto
    {
        public DateTimeOffset? EndDateTime { get; set; }
        public DateTimeOffset? StartDateTime { get; set; }
        public int? DurationMinutes { get; set; }
        public bool? NegativeMarking { get; set; }
        public decimal? NegativeMarkingValue { get; set; }
    }

    public class AttemptQuestionOptionDto
    {
        public Guid Id { get; set; }
        public string OptionText { get; set; } = string.Empty;
        public int Order { get; set; }
        public int SortOrder { get; set; }
    }

    public class AttemptQuestionDto
    {
        public Guid Id { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public decimal Marks { get; set; }
        public int Order { get; set; }
        public int SortOrder { get; set; }
        public List<AttemptQuestionOptionDto> Options { get; set; } = new();
    }

    public class StartAttemptResultDto
    {
        public bool AlreadySubmitted { get; set; }
        public Guid AttemptId { get; set; }
        public ExamAttempt? Attempt { get; set; }
        public object Exam { get; set; } = default!;
        public List<AttemptQuestionDto>? Questions { get; set; }
        public Dictionary<Guid, Guid>? ExistingAnswers { get; set; }
        public List<Guid>? FlaggedQuestions { get; set; }
    }


    public class SaveAnswerRequestDto
    {
        public Guid QuestionId { get; set; }
        public Guid? SelectedOptionId { get; set; }
    }

    public class SaveAnswerResultDto
    {
        public Guid AttemptId { get; set; }
        public Guid QuestionId { get; set; }
        public Guid? SelectedOptionId { get; set; }
        public bool IsFlagged { get; set; }
        public DateTimeOffset? AnsweredAt { get; set; }
    }

    public class FlagQuestionRequestDto
    {
        public Guid QuestionId { get; set; }
        public bool IsFlagged { get; set; }
    }

    public class FlagQuestionResultDto
    {
        public Guid AttemptId { get; set; }
        public Guid QuestionId { get; set; }
        public bool IsFlagged { get; set; }
    }

    public class SubmitAttemptResultDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid ExamId { get; set; }
        public string Status { get; set; } = ExamAttemptStatus.Submitted;
        public decimal Score { get; set; }
        public decimal Percentage { get; set; }
        public decimal TotalMarks { get; set; }
        public int TimeTakenSeconds { get; set; }
        public int WrongAnswers { get; set; }
        public int SkippedAnswers { get; set; }
        // "pass" | "fail" | null
        public string? Result { get; set; }
        public bool? Passed { get; set; }
        public decimal? PassMarks { get; set; }
        public int CorrectAnswers { get; set; }
        public int IncorrectAnswers { get; set; }
        public int Unanswered { get; set; }
        public int TotalQuestions { get; set; }
        public DateTimeOffset? SubmittedAt { get; set; }
        public DateTimeOffset StartedAt { get; set; }
    }

    public class ListHistoryQueryDto
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 10;
        public Guid? ExamId { get; set; }
        public string? Search { get; set; }
        public string? From { get; set; }
        public string? To { get; set; }
    }

    public class AttemptsPaginationQueryDto
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 20;
        public string? Search { get; set; }
        public string? From { get; set; }
        public string? To { get; set; }
    }

    public class AttemptHistoryRowDto
    {
        public Guid Id { get; set; }
        public Guid ExamId { get; set; }
        public string? ExamTitle { get; set; }
        public decimal? ExamPassMarks { get; set; }
        public string Status { get; set; } = ExamAttemptStatus.InProgress;
        public decimal? MarksObtained { get; set; }
        public decimal? TotalMarks { get; set; }
        public decimal? Percentage { get; set; }
        public int? CorrectAnswers { get; set; }
        public int? IncorrectAnswers { get; set; }
        public int? Unanswered { get; set; }
        public int? TimeTakenSeconds { get; set; }
        public DateTimeOffset StartedAt { get; set; }
        public DateTimeOffset? SubmittedAt { get; set; }
        // "pass" | "fail" | null, computed same as submit-attempt.service.ts
        public string? Result { get; set; }
    }

    public class ExamAttemptRowDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string Status { get; set; } = ExamAttemptStatus.InProgress;
        public decimal? MarksObtained { get; set; }
        public decimal? TotalMarks { get; set; }
        public decimal? Percentage { get; set; }
        public int? CorrectAnswers { get; set; }
        public int? IncorrectAnswers { get; set; }
        public int? Unanswered { get; set; }
        public int? TimeTakenSeconds { get; set; }
        public DateTimeOffset StartedAt { get; set; }
        public DateTimeOffset? SubmittedAt { get; set; }
    }

    public class AllAttemptsRowDto : ExamAttemptRowDto
    {
        public Guid ExamId { get; set; }
        public string? ExamTitle { get; set; }
        public decimal? ExamPassMarks { get; set; }
    }

    public class AttemptDetailOptionDto
    {
        public Guid Id { get; set; }
        public Guid QuestionId { get; set; }
        public string OptionText { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        // Only populated when allowAnswerKey is true (owner viewing a
        // submitted attempt, or an admin/teacher) -- mirrors
        // sanitizeDetail()'s conditional spread in attempts-history.service.ts.
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public bool? IsCorrect { get; set; }
    }

    public class AttemptDetailUserAnswerDto
    {
        public Guid? SelectedOptionId { get; set; }
        public bool IsFlagged { get; set; }
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public bool? IsCorrect { get; set; }
    }

    public class AttemptDetailQuestionDto
    {
        public Guid Id { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public decimal Marks { get; set; }
        public int SortOrder { get; set; }
        public List<AttemptDetailOptionDto> Options { get; set; } = new();
        public AttemptDetailUserAnswerDto? UserAnswer { get; set; }
    }

    public class AttemptDetailDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid ExamId { get; set; }
        public string Status { get; set; } = ExamAttemptStatus.InProgress;
        public decimal? TotalMarks { get; set; }
        public decimal? MarksObtained { get; set; }
        public int? CorrectAnswers { get; set; }
        public int? IncorrectAnswers { get; set; }
        public int? Unanswered { get; set; }
        public decimal? Percentage { get; set; }
        public int? TimeTakenSeconds { get; set; }
        public DateTimeOffset StartedAt { get; set; }
        public DateTimeOffset? SubmittedAt { get; set; }
        public Exam? Exam { get; set; }
        public List<AttemptDetailQuestionDto> Questions { get; set; } = new();
    }
}