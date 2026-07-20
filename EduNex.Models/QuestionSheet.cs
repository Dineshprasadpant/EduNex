using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    // ===================================================================
    // Raw DB row shapes (Dapper targets) — property names are PascalCase
    // versions of the snake_case columns; every query below aliases
    // columns explicitly (e.g. "sheet_name AS SheetName") so mapping does
    // not depend on any global underscore-to-PascalCase Dapper config.
    // ===================================================================

    public class QuestionSheetRow
    {
        public Guid Id { get; set; }
        public string SheetName { get; set; } = default!;
        public Guid? CreatedBy { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }

    public class QuestionSheetListRow : QuestionSheetRow
    {
        public string? CreatorFirstName { get; set; }
        public string? CreatorLastName { get; set; }
        public int TotalQuestions { get; set; }
        public decimal TotalMarks { get; set; }
    }

    public class QuestionRow
    {
        public Guid Id { get; set; }
        public Guid SheetId { get; set; }
        public string QuestionText { get; set; } = default!;
        public decimal Marks { get; set; }
        public int SortOrder { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class QuestionOptionRow
    {
        public Guid Id { get; set; }
        public Guid QuestionId { get; set; }
        public string OptionText { get; set; } = default!;
        public bool IsCorrect { get; set; }
        public int SortOrder { get; set; }
    }

    // ===================================================================
    // Outbound DTOs — property names match the original Node/Express
    // JSON responses exactly (camelCase via JsonPropertyName).
    // ===================================================================


    // ===================================================================
    // Inbound request DTOs — mirror the zod schemas in questions.schema.ts.
    // [ApiController] auto-validates DataAnnotations + IValidatableObject
    // and returns a 400 automatically, same effect as the `validate`
    // middleware.
    // ===================================================================

    public class CreateSheetRequest
    {
        [Required, MinLength(2), MaxLength(200)]
        public string Title { get; set; } = default!;
    }

    public class UpdateSheetRequest
    {
        [Required, MinLength(2), MaxLength(200)]
        public string Title { get; set; } = default!;
    }

    public class QuestionOptionInput
    {
        [Required] public string OptionText { get; set; } = default!;
        public bool IsCorrect { get; set; }
        public int SortOrder { get; set; } = 0;
    }

    public class CreateQuestionRequest : IValidatableObject
    {
        [Required, MinLength(5)]
        public string QuestionText { get; set; } = default!;

        [Range(0.01, double.MaxValue)]
        public decimal Marks { get; set; } = 1;

        public int SortOrder { get; set; } = 0;

        [MinLength(2, ErrorMessage = "At least 2 options required")]
        public List<QuestionOptionInput> Options { get; set; } = new();

        public IEnumerable<ValidationResult> Validate(ValidationContext ctx)
        {
            if (Options.Count(o => o.IsCorrect) != 1)
                yield return new ValidationResult(
                    "Exactly one option must be correct", new[] { nameof(Options) });
        }
    }

    public class UpdateQuestionRequest : IValidatableObject
    {
        [MinLength(5)]
        public string? QuestionText { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal? Marks { get; set; }

        public int? SortOrder { get; set; }

        [MinLength(2)]
        public List<QuestionOptionInput>? Options { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext ctx)
        {
            if (Options != null && Options.Count(o => o.IsCorrect) != 1)
                yield return new ValidationResult(
                    "Exactly one option must be correct", new[] { nameof(Options) });
        }
    }

    public class ImportOptionInput
    {
        [Required] public string OptionText { get; set; } = default!;
        public bool IsCorrect { get; set; }
    }

    public class ImportQuestionInput : IValidatableObject
    {
        [Required, MinLength(5)]
        public string QuestionText { get; set; } = default!;

        [Range(0.01, double.MaxValue)]
        public decimal Marks { get; set; } = 1;

        [MinLength(2)]
        public List<ImportOptionInput> Options { get; set; } = new();

        public IEnumerable<ValidationResult> Validate(ValidationContext ctx)
        {
            if (Options.Count(o => o.IsCorrect) != 1)
                yield return new ValidationResult(
                    "Exactly one option must be correct per question", new[] { nameof(Options) });
        }
    }

    public class ImportQuestionsRequest
    {
        [Required, MinLength(1)]
        public List<ImportQuestionInput> Questions { get; set; } = new();
    }

    public class ReorderItem
    {
        [Required] public Guid Id { get; set; }
        [Range(0, int.MaxValue)] public int SortOrder { get; set; }
    }

    public class ReorderQuestionsRequest
    {
        [Required, MinLength(1)]
        public List<ReorderItem> Orders { get; set; } = new();
    }

    // ===================================================================
    // Service-layer result wrapper — replaces the Node NotFoundError /
    // try-catch-in-controller pattern with an explicit status, since we
    // don't have your global exception middleware shape yet.
    // ===================================================================

    public enum QuestionOpStatus { Ok, SheetNotFound, QuestionNotFound }

    public class QuestionOpResult<T>
    {
        public QuestionOpStatus Status { get; set; }
        public T? Value { get; set; }
    }
}