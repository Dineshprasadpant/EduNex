using System.Text.Json.Serialization;

namespace EduNex.Models.Dtos
{
    public class QuestionSheetDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public object? CreatedBy { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        public int TotalQuestions { get; set; }
        public decimal TotalMarks { get; set; }
        public List<QuestionDto> Questions { get; set; } = new();
    }
    public class CreateSheetDto { public string Title { get; set; } = string.Empty; }
    public class UpdateSheetDto { public string Title { get; set; } = string.Empty; }

    public class CreateQuestionDto
    {
        public string QuestionText { get; set; } = string.Empty;
        public decimal Marks { get; set; } = 1;
        public int SortOrder { get; set; }
        public List<QuestionOptionDto> Options { get; set; } = new();
    }

    public class UpdateQuestionDto
    {
        public string? QuestionText { get; set; }
        public decimal? Marks { get; set; }
        public int? SortOrder { get; set; }
        public List<QuestionOptionDto>? Options { get; set; }
    }

    public class ImportQuestionsDto
    {
        public List<CreateQuestionDto> Questions { get; set; } = new();
    }

    public class ReorderQuestionsDto
    {
        public List<QuestionOrderDto> Orders { get; set; } = new();
    }

    public class QuestionOrderDto
    {
        public Guid Id { get; set; }
        public int SortOrder { get; set; }
    }


    public class QuestionSheetListItemDto
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("title")] public string Title { get; set; } = default!;
        [JsonPropertyName("createdBy")] public CreatedByDto? CreatedBy { get; set; }
        [JsonPropertyName("createdAt")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("updatedAt")] public DateTimeOffset UpdatedAt { get; set; }
        [JsonPropertyName("totalQuestions")] public int TotalQuestions { get; set; }
        [JsonPropertyName("totalMarks")] public decimal TotalMarks { get; set; }
    }

    public class QuestionOptionDto
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("questionId")] public Guid QuestionId { get; set; }
        [JsonPropertyName("optionText")] public string OptionText { get; set; } = default!;
        [JsonPropertyName("isCorrect")] public bool IsCorrect { get; set; }
        [JsonPropertyName("sortOrder")] public int SortOrder { get; set; }
    }

    public class QuestionDto
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("sheetId")] public Guid SheetId { get; set; }
        [JsonPropertyName("questionText")] public string QuestionText { get; set; } = default!;
        [JsonPropertyName("marks")] public decimal Marks { get; set; }
        [JsonPropertyName("sortOrder")] public int SortOrder { get; set; }
        [JsonPropertyName("createdAt")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("options")] public List<QuestionOptionDto> Options { get; set; } = new();
    }

    // Deep sheet shape — returned by GET /:id only, matches
    // questionsRepository.findSheetById (totals computed in app code,
    // nested questions with their options, createdBy stays a raw id).
    public class QuestionSheetDetailDto
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("title")] public string Title { get; set; } = default!;
        [JsonPropertyName("createdBy")] public Guid? CreatedBy { get; set; }
        [JsonPropertyName("createdAt")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("updatedAt")] public DateTimeOffset UpdatedAt { get; set; }
        [JsonPropertyName("totalQuestions")] public int TotalQuestions { get; set; }
        [JsonPropertyName("totalMarks")] public decimal TotalMarks { get; set; }
        [JsonPropertyName("questions")] public List<QuestionDto> Questions { get; set; } = new();
    }
}
