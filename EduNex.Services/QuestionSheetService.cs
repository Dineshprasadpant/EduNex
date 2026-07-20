using EduNex.DataAccess;
using EduNex.Models;
using EduNex.Models.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EduNex.Services
{
    public interface IQuestionsService
    {
        Task<QuestionSheetDto> CreateSheetAsync(CreateSheetRequest input, Guid? userId);
        Task<QuestionSheetDto?> UpdateSheetAsync(Guid id, UpdateSheetRequest input);
        Task<(IEnumerable<QuestionSheetListItemDto> Data, PaginationMeta Meta)> ListSheetsAsync(int page, int limit, string? search);
        Task<QuestionSheetDetailDto?> GetSheetByIdAsync(Guid id);
        Task<bool> DeleteSheetAsync(Guid id);

        Task<QuestionOpResult<QuestionDto>> AddQuestionAsync(Guid sheetId, CreateQuestionRequest input);
        Task<QuestionOpResult<QuestionDto>> UpdateQuestionAsync(Guid sheetId, Guid questionId, UpdateQuestionRequest input);
        Task<QuestionOpStatus> DeleteQuestionAsync(Guid sheetId, Guid questionId);
        Task<QuestionOpResult<List<QuestionDto>>> ImportQuestionsAsync(Guid sheetId, ImportQuestionsRequest input);
        Task<bool> ReorderQuestionsAsync(Guid sheetId, ReorderQuestionsRequest input);
    }

    public class QuestionsService : IQuestionsService
    {
        private readonly IQuestionsDal _dal;
        public QuestionsService(IQuestionsDal dal) => _dal = dal;

        public async Task<QuestionSheetDto> CreateSheetAsync(CreateSheetRequest input, Guid? userId)
        {
            var row = await _dal.CreateSheetAsync(input.Title, userId);
            return MapSheetDto(row);
        }

        public async Task<QuestionSheetDto?> UpdateSheetAsync(Guid id, UpdateSheetRequest input)
        {
            var existing = await _dal.FindSheetByIdAsync(id);
            if (existing == null) return null;

            var updated = await _dal.UpdateSheetAsync(id, input.Title);
            return updated == null ? null : MapSheetDto(updated);
        }

        public async Task<(IEnumerable<QuestionSheetListItemDto>, PaginationMeta)> ListSheetsAsync(
            int page, int limit, string? search)
        {
            var offset = (page - 1) * limit;
            var (rows, total) = await _dal.FindAllSheetsAsync(search, offset, limit);

            var data = rows.Select(r => new QuestionSheetListItemDto
            {
                Id = r.Id,
                Title = r.SheetName,
                CreatedBy = r.CreatorFirstName != null
                    ? new CreatedByDto { FirstName = r.CreatorFirstName, LastName = r.CreatorLastName ?? "" }
                    : null,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                TotalQuestions = r.TotalQuestions,
                TotalMarks = r.TotalMarks
            });

            return (data, PaginationMeta.Create(total, page, limit));
        }

        public async Task<QuestionSheetDetailDto?> GetSheetByIdAsync(Guid id)
        {
            var sheet = await _dal.FindSheetByIdAsync(id);
            if (sheet == null) return null;

            var questions = (await _dal.FindQuestionsBySheetIdAsync(id)).ToList();
            var options = (await _dal.FindOptionsByQuestionIdsAsync(questions.Select(q => q.Id))).ToList();

            return new QuestionSheetDetailDto
            {
                Id = sheet.Id,
                Title = sheet.SheetName,
                CreatedBy = sheet.CreatedBy,
                CreatedAt = sheet.CreatedAt,
                UpdatedAt = sheet.UpdatedAt,
                TotalQuestions = questions.Count,
                TotalMarks = questions.Sum(q => q.Marks),
                Questions = questions.Select(q => MapQuestion(q, options)).ToList()
            };
        }

        public async Task<bool> DeleteSheetAsync(Guid id)
        {
            var existing = await _dal.FindSheetByIdAsync(id);
            if (existing == null) return false;

            await _dal.DeleteSheetAsync(id);
            return true;
        }

        public async Task<QuestionOpResult<QuestionDto>> AddQuestionAsync(Guid sheetId, CreateQuestionRequest input)
        {
            var sheet = await _dal.FindSheetByIdAsync(sheetId);
            if (sheet == null) return new() { Status = QuestionOpStatus.SheetNotFound };

            var row = await _dal.AddQuestionAsync(sheetId, input.QuestionText, input.Marks, input.SortOrder, input.Options);
            var optionRows = await _dal.FindOptionsByQuestionIdAsync(row.Id);

            return new() { Status = QuestionOpStatus.Ok, Value = MapQuestion(row, optionRows) };
        }

        public async Task<QuestionOpResult<QuestionDto>> UpdateQuestionAsync(
            Guid sheetId, Guid questionId, UpdateQuestionRequest input)
        {
            var sheet = await _dal.FindSheetByIdAsync(sheetId);
            if (sheet == null) return new() { Status = QuestionOpStatus.SheetNotFound };

            var question = await _dal.FindQuestionByIdAsync(questionId);
            if (question == null || question.SheetId != sheetId)
                return new() { Status = QuestionOpStatus.QuestionNotFound };

            await _dal.UpdateQuestionAsync(questionId, input.QuestionText, input.Marks, input.SortOrder);

            if (input.Options != null)
                await _dal.ReplaceOptionsAsync(questionId, input.Options);

            var updated = await _dal.FindQuestionByIdAsync(questionId);
            var optionRows = await _dal.FindOptionsByQuestionIdAsync(questionId);

            return new() { Status = QuestionOpStatus.Ok, Value = MapQuestion(updated!, optionRows) };
        }

        public async Task<QuestionOpStatus> DeleteQuestionAsync(Guid sheetId, Guid questionId)
        {
            var sheet = await _dal.FindSheetByIdAsync(sheetId);
            if (sheet == null) return QuestionOpStatus.SheetNotFound;

            var question = await _dal.FindQuestionByIdAsync(questionId);
            if (question == null || question.SheetId != sheetId)
                return QuestionOpStatus.QuestionNotFound;

            await _dal.DeleteQuestionAsync(questionId);
            return QuestionOpStatus.Ok;
        }

        public async Task<QuestionOpResult<List<QuestionDto>>> ImportQuestionsAsync(
            Guid sheetId, ImportQuestionsRequest input)
        {
            var sheet = await _dal.FindSheetByIdAsync(sheetId);
            if (sheet == null) return new() { Status = QuestionOpStatus.SheetNotFound };

            var ids = await _dal.BulkAddQuestionsAsync(sheetId, input.Questions);

            var result = new List<QuestionDto>();
            foreach (var id in ids)
            {
                var q = await _dal.FindQuestionByIdAsync(id);
                var opts = await _dal.FindOptionsByQuestionIdAsync(id);
                result.Add(MapQuestion(q!, opts));
            }

            return new() { Status = QuestionOpStatus.Ok, Value = result };
        }

        public async Task<bool> ReorderQuestionsAsync(Guid sheetId, ReorderQuestionsRequest input)
        {
            var sheet = await _dal.FindSheetByIdAsync(sheetId);
            if (sheet == null) return false;

            await _dal.ReorderQuestionsAsync(input.Orders);
            return true;
        }

        // ---- mapping helpers ----

        private static QuestionSheetDto MapSheetDto(QuestionSheetRow row) => new()
        {
            Id = row.Id,
            Title = row.SheetName,
            CreatedBy = row.CreatedBy,
            CreatedAt = row.CreatedAt,
            UpdatedAt = row.UpdatedAt
        };

        private static QuestionOptionDto MapOption(QuestionOptionRow o) => new()
        {
            Id = o.Id,
            QuestionId = o.QuestionId,
            OptionText = o.OptionText,
            IsCorrect = o.IsCorrect,
            SortOrder = o.SortOrder
        };

        private static QuestionDto MapQuestion(QuestionRow q, IEnumerable<QuestionOptionRow> allOptions) => new()
        {
            Id = q.Id,
            SheetId = q.SheetId,
            QuestionText = q.QuestionText,
            Marks = q.Marks,
            SortOrder = q.SortOrder,
            CreatedAt = q.CreatedAt,
            Options = allOptions.Where(o => o.QuestionId == q.Id).Select(MapOption).ToList()
        };
    }
}