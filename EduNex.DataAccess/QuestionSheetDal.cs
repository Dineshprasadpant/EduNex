using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using EduNex.Models.Dtos;
using Microsoft.Data.SqlClient;

namespace EduNex.DataAccess
{
    public interface IQuestionSheetDal
    {
        Task<(List<QuestionSheetDto> Data, int Total)> ListSheetsAsync(int limit, int offset, string? search);
        Task<QuestionSheetDto?> GetSheetByIdAsync(Guid id);
        Task<QuestionSheetDto> CreateSheetAsync(string title, Guid? createdBy);
        Task<QuestionSheetDto?> UpdateSheetAsync(Guid id, string title);
        Task DeleteSheetAsync(Guid id);
        Task<QuestionDto> AddQuestionAsync(Guid sheetId, string text, decimal marks, int sortOrder);
        Task<List<QuestionOptionDto>> AddOptionsAsync(Guid questionId, List<QuestionOptionDto> options);
        Task<QuestionDto?> GetQuestionByIdAsync(Guid id);
        Task<QuestionDto?> UpdateQuestionAsync(Guid id, string? text, decimal? marks, int? sortOrder);
        Task ReplaceOptionsAsync(Guid questionId, List<QuestionOptionDto> options);
        Task DeleteQuestionAsync(Guid id);
        Task ReorderQuestionsAsync(List<QuestionOrderDto> orders);
        Task<List<QuestionDto>> BulkAddQuestionsAsync(Guid sheetId, List<CreateQuestionDto> questions);
    }

    public class QuestionSheetDal : IQuestionSheetDal
    {
        private readonly string _connectionString;
        public QuestionSheetDal(string connectionString) => _connectionString = connectionString;
        private IDbConnection Connection => new SqlConnection(_connectionString);

        public async Task<(List<QuestionSheetDto> Data, int Total)> ListSheetsAsync(int limit, int offset, string? search)
        {
            using var db = Connection;
            var where = !string.IsNullOrEmpty(search) ? "WHERE sheet_name LIKE @Search" : "";
            var sql = $@"
                SELECT COUNT(*) FROM dbo.question_sheets {where};
                SELECT qs.id, qs.sheet_name AS Title, qs.created_by, u.first_name, u.last_name, qs.created_at, qs.updated_at 
                FROM dbo.question_sheets qs
                LEFT JOIN dbo.users u ON qs.created_by = u.id
                {where} ORDER BY qs.created_at DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";
            
            using var multi = await db.QueryMultipleAsync(sql, new { Search = $"%{search}%", Offset = offset, Limit = limit });
            var total = await multi.ReadFirstAsync<int>();
            var rows = (await multi.ReadAsync<dynamic>()).ToList();
            
            var data = rows.Select(r => new QuestionSheetDto {
                Id = r.id, Title = r.Title, CreatedAt = r.created_at, UpdatedAt = r.updated_at,
                CreatedBy = r.first_name != null ? new { FirstName = (string)r.first_name, LastName = (string)r.last_name } : null
            }).ToList();
            return (data, total);
        }

        public async Task<QuestionSheetDto?> GetSheetByIdAsync(Guid id)
        {
            using var db = Connection;
            const string sql = @"
                SELECT * FROM dbo.question_sheets WHERE id = @Id;
                SELECT * FROM dbo.questions WHERE sheet_id = @Id ORDER BY sort_order;
                SELECT * FROM dbo.question_options WHERE question_id IN (SELECT id FROM dbo.questions WHERE sheet_id = @Id) ORDER BY sort_order;";

            using var multi = await db.QueryMultipleAsync(sql, new { Id = id });
            var sheet = await multi.ReadFirstOrDefaultAsync<QuestionSheetDto>();
            if (sheet == null) return null;

            var questions = (await multi.ReadAsync<QuestionDto>()).ToList();
            var options = (await multi.ReadAsync<QuestionOptionDto>()).ToList();

            foreach (var q in questions) {
                q.Options = options.Where(o => o.QuestionId == q.Id).ToList();
            }
            sheet.Questions = questions;
            sheet.TotalQuestions = questions.Count;
            sheet.TotalMarks = questions.Sum(q => q.Marks);
            return sheet;
        }

        public async Task<QuestionSheetDto> CreateSheetAsync(string title, Guid? createdBy)
        {
            using var db = Connection;
            var id = Guid.NewGuid();
            await db.ExecuteAsync("INSERT INTO dbo.question_sheets (id, sheet_name, created_by, created_at, updated_at) VALUES (@Id, @Title, @By, @Now, @Now)", 
                new { Id = id, Title = title, By = createdBy, Now = DateTimeOffset.UtcNow });
            return await GetSheetByIdAsync(id) ?? throw new Exception("Sheet creation failed");
        }

        public async Task<QuestionSheetDto?> UpdateSheetAsync(Guid id, string title)
        {
            using var db = Connection;
            await db.ExecuteAsync("UPDATE dbo.question_sheets SET sheet_name = @Title, updated_at = @Now WHERE id = @Id", 
                new { Id = id, Title = title, Now = DateTimeOffset.UtcNow });
            return await GetSheetByIdAsync(id);
        }

        public async Task DeleteSheetAsync(Guid id)
        {
            using var db = Connection;
            await db.ExecuteAsync("DELETE FROM dbo.question_sheets WHERE id = @Id", new { Id = id });
        }

        public async Task<QuestionDto> AddQuestionAsync(Guid sheetId, string text, decimal marks, int sortOrder)
        {
            using var db = Connection;
            var id = Guid.NewGuid();
            await db.ExecuteAsync("INSERT INTO dbo.questions (id, sheet_id, question_text, marks, sort_order, created_at) VALUES (@Id, @SheetId, @Text, @Marks, @SortOrder, @Now)",
                new { Id = id, SheetId = sheetId, Text = text, Marks = marks, SortOrder = sortOrder, Now = DateTimeOffset.UtcNow });
            return (await GetQuestionByIdAsync(id))!;
        }

        public async Task<List<QuestionOptionDto>> AddOptionsAsync(Guid questionId, List<QuestionOptionDto> options)
        {
            using var db = Connection;
            foreach (var opt in options) {
                opt.Id = Guid.NewGuid();
                opt.QuestionId = questionId;
                await db.ExecuteAsync("INSERT INTO dbo.question_options (id, question_id, option_text, is_correct, sort_order) VALUES (@Id, @QuestionId, @OptionText, @IsCorrect, @SortOrder)", opt);
            }
            return options;
        }

        public async Task<QuestionDto?> GetQuestionByIdAsync(Guid id)
        {
            using var db = Connection;
            var q = await db.QuerySingleOrDefaultAsync<QuestionDto>("SELECT * FROM dbo.questions WHERE id = @Id", new { Id = id });
            if (q != null) q.Options = (await db.QueryAsync<QuestionOptionDto>("SELECT * FROM dbo.question_options WHERE question_id = @Id ORDER BY sort_order", new { Id = id })).ToList();
            return q;
        }

        public async Task<QuestionDto?> UpdateQuestionAsync(Guid id, string? text, decimal? marks, int? sortOrder)
        {
            using var db = Connection;
            await db.ExecuteAsync("UPDATE dbo.questions SET question_text = ISNULL(@Text, question_text), marks = ISNULL(@Marks, marks), sort_order = ISNULL(@SortOrder, sort_order) WHERE id = @Id",
                new { Id = id, Text = text, Marks = marks, SortOrder = sortOrder });
            return await GetQuestionByIdAsync(id);
        }

        public async Task ReplaceOptionsAsync(Guid questionId, List<QuestionOptionDto> options)
        {
            using var db = Connection;
            db.Open();
            using var trans = db.BeginTransaction();
            await db.ExecuteAsync("DELETE FROM dbo.question_options WHERE question_id = @QId", new { QId = questionId }, trans);
            await AddOptionsAsync(questionId, options);
            trans.Commit();
        }

        public async Task DeleteQuestionAsync(Guid id)
        {
            using var db = Connection;
            await db.ExecuteAsync("DELETE FROM dbo.questions WHERE id = @Id", new { Id = id });
        }

        public async Task ReorderQuestionsAsync(List<QuestionOrderDto> orders)
        {
            using var db = Connection;
            await db.ExecuteAsync("UPDATE dbo.questions SET sort_order = @SortOrder WHERE id = @Id", orders);
        }

        public async Task<List<QuestionDto>> BulkAddQuestionsAsync(Guid sheetId, List<CreateQuestionDto> questions)
        {
            using var db = Connection;
            var result = new List<QuestionDto>();
            foreach(var q in questions) {
                var newQ = await AddQuestionAsync(sheetId, q.QuestionText, q.Marks, q.SortOrder);
                newQ.Options = await AddOptionsAsync(newQ.Id, q.Options);
                result.Add(newQ);
            }
            return result;
        }
    }
}
