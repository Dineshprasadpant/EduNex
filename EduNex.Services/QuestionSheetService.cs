using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduNex.DataAccess;
using EduNex.Models.Dtos;

namespace EduNex.Services
{
    public interface IQuestionSheetService
    {
        Task<(List<QuestionSheetDto> Data, object? Meta)> ListSheetsAsync(int page, int limit, string? search);
        Task<QuestionSheetDto> GetSheetByIdAsync(Guid id);
        Task<QuestionSheetDto> CreateSheetAsync(CreateSheetDto input, Guid? createdBy);
        Task<QuestionSheetDto> UpdateSheetAsync(Guid id, UpdateSheetDto input);
        Task DeleteSheetAsync(Guid id);
        Task<QuestionDto> AddQuestionAsync(Guid sheetId, CreateQuestionDto input);
        Task<QuestionDto> UpdateQuestionAsync(Guid sheetId, Guid qId, UpdateQuestionDto input);
        Task DeleteQuestionAsync(Guid sheetId, Guid qId);
        Task<List<QuestionDto>> ImportQuestionsAsync(Guid sheetId, ImportQuestionsDto input);
        Task ReorderQuestionsAsync(Guid sheetId, ReorderQuestionsDto input);
    }

    public class QuestionSheetService : IQuestionSheetService
    {
        private readonly IQuestionSheetDal _dal;
        public QuestionSheetService(IQuestionSheetDal dal) => _dal = dal;

        public async Task<(List<QuestionSheetDto> Data, object? Meta)> ListSheetsAsync(int page, int limit, string? search)
        {
            int p = Math.Max(1, page);
            int l = Math.Min(100, Math.Max(1, limit));
            int offset = (p - 1) * l;

            var result = await _dal.ListSheetsAsync(l, offset, search);
            var meta = new { Page = p, Limit = l, Total = result.Total, TotalPages = (int)Math.Ceiling((double)result.Total / l) };
            return (result.Data, meta);
        }

        public async Task<QuestionSheetDto> GetSheetByIdAsync(Guid id)
        {
            var sheet = await _dal.GetSheetByIdAsync(id);
            if (sheet == null) throw new Exception("Question sheet not found");
            return sheet;
        }

        public async Task<QuestionSheetDto> CreateSheetAsync(CreateSheetDto input, Guid? createdBy)
        {
            return await _dal.CreateSheetAsync(input.Title, createdBy);
        }

        public async Task<QuestionSheetDto> UpdateSheetAsync(Guid id, UpdateSheetDto input)
        {
            var updated = await _dal.UpdateSheetAsync(id, input.Title);
            if (updated == null) throw new Exception("Question sheet not found");
            return updated;
        }

        public async Task DeleteSheetAsync(Guid id) => await _dal.DeleteSheetAsync(id);

        public async Task<QuestionDto> AddQuestionAsync(Guid sheetId, CreateQuestionDto input)
        {
            var q = await _dal.AddQuestionAsync(sheetId, input.QuestionText, input.Marks, input.SortOrder);
            q.Options = await _dal.AddOptionsAsync(q.Id, input.Options);
            return q;
        }

        public async Task<QuestionDto> UpdateQuestionAsync(Guid sheetId, Guid qId, UpdateQuestionDto input)
        {
            var q = await _dal.UpdateQuestionAsync(qId, input.QuestionText, input.Marks, input.SortOrder);
            if (q == null) throw new Exception("Question not found");
            
            if (input.Options != null) await _dal.ReplaceOptionsAsync(qId, input.Options);
            
            return (await _dal.GetQuestionByIdAsync(qId))!;
        }

        public async Task DeleteQuestionAsync(Guid sheetId, Guid qId) => await _dal.DeleteQuestionAsync(qId);

        public async Task<List<QuestionDto>> ImportQuestionsAsync(Guid sheetId, ImportQuestionsDto input)
        {
            return await _dal.BulkAddQuestionsAsync(sheetId, input.Questions);
        }

        public async Task ReorderQuestionsAsync(Guid sheetId, ReorderQuestionsDto input)
        {
            await _dal.ReorderQuestionsAsync(input.Orders);
        }
    }
}
