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

    public class QuestionDto
    {
        public Guid Id { get; set; }
        public Guid SheetId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public decimal Marks { get; set; }
        public int SortOrder { get; set; }
        public List<QuestionOptionDto> Options { get; set; } = new();
    }

    public class QuestionOptionDto
    {
        public Guid Id { get; set; }
        public Guid QuestionId { get; set; }
        public string OptionText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public int SortOrder { get; set; }
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
}
