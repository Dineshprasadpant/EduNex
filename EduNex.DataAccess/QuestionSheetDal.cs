using Dapper;
using EduNex.Api.DataAccess;
using EduNex.Models;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;

namespace EduNex.DataAccess
{
    public interface IQuestionsDal
    {
        Task<(IEnumerable<QuestionSheetListRow> Data, int Total)> FindAllSheetsAsync(string? search, int offset, int limit);
        Task<QuestionSheetRow?> FindSheetByIdAsync(Guid id);
        Task<QuestionSheetRow> CreateSheetAsync(string sheetName, Guid? createdBy);
        Task<QuestionSheetRow?> UpdateSheetAsync(Guid id, string sheetName);
        Task DeleteSheetAsync(Guid id);

        Task<IEnumerable<QuestionRow>> FindQuestionsBySheetIdAsync(Guid sheetId);
        Task<IEnumerable<QuestionOptionRow>> FindOptionsByQuestionIdsAsync(IEnumerable<Guid> questionIds);

        Task<QuestionRow?> FindQuestionByIdAsync(Guid id);
        Task<IEnumerable<QuestionOptionRow>> FindOptionsByQuestionIdAsync(Guid questionId);
        Task<QuestionRow> AddQuestionAsync(Guid sheetId, string questionText, decimal marks, int sortOrder, List<QuestionOptionInput> options);
        Task<QuestionRow?> UpdateQuestionAsync(Guid id, string? questionText, decimal? marks, int? sortOrder);
        Task ReplaceOptionsAsync(Guid questionId, List<QuestionOptionInput> options);
        Task DeleteQuestionAsync(Guid id);
        Task ReorderQuestionsAsync(List<ReorderItem> orders);
        Task<List<Guid>> BulkAddQuestionsAsync(Guid sheetId, List<ImportQuestionInput> questions);
    }

    public class QuestionsDal(IDbConnectionFactory _dbconn) : IQuestionsDal
    {
        public async Task<(IEnumerable<QuestionSheetListRow> Data, int Total)> FindAllSheetsAsync(
            string? search, int offset, int limit)
        {
            using var conn =  _dbconn.CreateConnection();
            const string sql = @"
                SELECT
                    qs.id AS Id,
                    qs.sheet_name AS SheetName,
                    qs.created_by AS CreatedBy,
                    qs.created_at AS CreatedAt,
                    qs.updated_at AS UpdatedAt,
                    u.first_name AS CreatorFirstName,
                    u.last_name AS CreatorLastName,
                    COUNT(q.id) AS TotalQuestions,
                    COALESCE(SUM(q.marks), 0) AS TotalMarks
                FROM dbo.question_sheets qs
                LEFT JOIN dbo.questions q ON q.sheet_id = qs.id
                LEFT JOIN dbo.users u ON u.id = qs.created_by
                WHERE (@Search IS NULL OR qs.sheet_name LIKE '%' + @Search + '%')
                GROUP BY qs.id, qs.sheet_name, qs.created_by, qs.created_at, qs.updated_at,
                         u.first_name, u.last_name
                ORDER BY qs.created_at DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

                SELECT COUNT(*)
                FROM dbo.question_sheets qs
                WHERE (@Search IS NULL OR qs.sheet_name LIKE '%' + @Search + '%');";

            using var multi = await conn.QueryMultipleAsync(sql,
                new { Search = string.IsNullOrWhiteSpace(search) ? null : search, Offset = offset, Limit = limit });

            var data = await multi.ReadAsync<QuestionSheetListRow>();
            var total = await multi.ReadFirstAsync<int>();
            return (data, total);
        }

        public async Task<QuestionSheetRow?> FindSheetByIdAsync(Guid id)
        {
            using var conn =  _dbconn.CreateConnection();
            const string sql = @"
                SELECT id AS Id, sheet_name AS SheetName, created_by AS CreatedBy,
                       created_at AS CreatedAt, updated_at AS UpdatedAt
                FROM dbo.question_sheets WHERE id = @Id;";
            return await conn.QueryFirstOrDefaultAsync<QuestionSheetRow>(sql, new { Id = id });
        }

        public async Task<QuestionSheetRow> CreateSheetAsync(string sheetName, Guid? createdBy)
        {
            using var conn =  _dbconn.CreateConnection();
            const string sql = @"
                INSERT INTO dbo.question_sheets (sheet_name, created_by)
                OUTPUT INSERTED.id AS Id, INSERTED.sheet_name AS SheetName,
                       INSERTED.created_by AS CreatedBy, INSERTED.created_at AS CreatedAt,
                       INSERTED.updated_at AS UpdatedAt
                VALUES (@SheetName, @CreatedBy);";
            return await conn.QuerySingleAsync<QuestionSheetRow>(
                sql, new { SheetName = sheetName, CreatedBy = createdBy });
        }

        public async Task<QuestionSheetRow?> UpdateSheetAsync(Guid id, string sheetName)
        {
            using var conn =  _dbconn.CreateConnection();
            const string sql = @"
                UPDATE dbo.question_sheets
                SET sheet_name = @SheetName, updated_at = SYSDATETIMEOFFSET()
                OUTPUT INSERTED.id AS Id, INSERTED.sheet_name AS SheetName,
                       INSERTED.created_by AS CreatedBy, INSERTED.created_at AS CreatedAt,
                       INSERTED.updated_at AS UpdatedAt
                WHERE id = @Id;";
            return await conn.QueryFirstOrDefaultAsync<QuestionSheetRow>(
                sql, new { Id = id, SheetName = sheetName });
        }

        public async Task DeleteSheetAsync(Guid id)
        {
            using var conn =  _dbconn.CreateConnection();
            // FK ON DELETE CASCADE on dbo.questions/dbo.question_options
            // handles cleanup of children.
            await conn.ExecuteAsync("DELETE FROM dbo.question_sheets WHERE id = @Id", new { Id = id });
        }

        public async Task<IEnumerable<QuestionRow>> FindQuestionsBySheetIdAsync(Guid sheetId)
        {
            using var conn =  _dbconn.CreateConnection();
            const string sql = @"
                SELECT id AS Id, sheet_id AS SheetId, question_text AS QuestionText,
                       marks AS Marks, sort_order AS SortOrder, created_at AS CreatedAt
                FROM dbo.questions WHERE sheet_id = @SheetId ORDER BY sort_order ASC;";
            return await conn.QueryAsync<QuestionRow>(sql, new { SheetId = sheetId });
        }

        public async Task<IEnumerable<QuestionOptionRow>> FindOptionsByQuestionIdsAsync(IEnumerable<Guid> questionIds)
        {
            var ids = questionIds.ToList();
            if (ids.Count == 0) return Enumerable.Empty<QuestionOptionRow>();

            using var conn =  _dbconn.CreateConnection();
            const string sql = @"
                SELECT id AS Id, question_id AS QuestionId, option_text AS OptionText,
                       is_correct AS IsCorrect, sort_order AS SortOrder
                FROM dbo.question_options
                WHERE question_id IN @Ids
                ORDER BY sort_order ASC;";
            return await conn.QueryAsync<QuestionOptionRow>(sql, new { Ids = ids });
        }

        public async Task<QuestionRow?> FindQuestionByIdAsync(Guid id)
        {
            using var conn =  _dbconn.CreateConnection();
            const string sql = @"
                SELECT id AS Id, sheet_id AS SheetId, question_text AS QuestionText,
                       marks AS Marks, sort_order AS SortOrder, created_at AS CreatedAt
                FROM dbo.questions WHERE id = @Id;";
            return await conn.QueryFirstOrDefaultAsync<QuestionRow>(sql, new { Id = id });
        }

        public async Task<IEnumerable<QuestionOptionRow>> FindOptionsByQuestionIdAsync(Guid questionId)
        {
            using var conn =  _dbconn.CreateConnection();
            const string sql = @"
                SELECT id AS Id, question_id AS QuestionId, option_text AS OptionText,
                       is_correct AS IsCorrect, sort_order AS SortOrder
                FROM dbo.question_options
                WHERE question_id = @QuestionId ORDER BY sort_order ASC;";
            return await conn.QueryAsync<QuestionOptionRow>(sql, new { QuestionId = questionId });
        }

        public async Task<QuestionRow> AddQuestionAsync(
            Guid sheetId, string questionText, decimal marks, int sortOrder, List<QuestionOptionInput> options)
        {
            using var conn =  _dbconn.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();
            try
            {
                const string insertQ = @"
                    INSERT INTO dbo.questions (sheet_id, question_text, marks, sort_order)
                    OUTPUT INSERTED.id AS Id, INSERTED.sheet_id AS SheetId,
                           INSERTED.question_text AS QuestionText, INSERTED.marks AS Marks,
                           INSERTED.sort_order AS SortOrder, INSERTED.created_at AS CreatedAt
                    VALUES (@SheetId, @QuestionText, @Marks, @SortOrder);";

                var question = await conn.QuerySingleAsync<QuestionRow>(insertQ, new
                {
                    SheetId = sheetId,
                    QuestionText = questionText,
                    Marks = marks,
                    SortOrder = sortOrder
                }, tx);

                const string insertOpt = @"
                    INSERT INTO dbo.question_options (question_id, option_text, is_correct, sort_order)
                    VALUES (@QuestionId, @OptionText, @IsCorrect, @SortOrder);";

                foreach (var opt in options)
                {
                    await conn.ExecuteAsync(insertOpt, new
                    {
                        QuestionId = question.Id,
                        opt.OptionText,
                        opt.IsCorrect,
                        opt.SortOrder
                    }, tx);
                }

                tx.Commit();
                return question;
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        public async Task<QuestionRow?> UpdateQuestionAsync(
            Guid id, string? questionText, decimal? marks, int? sortOrder)
        {
            var sets = new List<string>();
            var parameters = new DynamicParameters();
            parameters.Add("Id", id);

            if (questionText != null) { sets.Add("question_text = @QuestionText"); parameters.Add("QuestionText", questionText); }
            if (marks != null) { sets.Add("marks = @Marks"); parameters.Add("Marks", marks); }
            if (sortOrder != null) { sets.Add("sort_order = @SortOrder"); parameters.Add("SortOrder", sortOrder); }

            if (sets.Count == 0)
                return await FindQuestionByIdAsync(id);

            using var conn =  _dbconn.CreateConnection();
            var sql = $@"
                UPDATE dbo.questions SET {string.Join(", ", sets)}
                OUTPUT INSERTED.id AS Id, INSERTED.sheet_id AS SheetId,
                       INSERTED.question_text AS QuestionText, INSERTED.marks AS Marks,
                       INSERTED.sort_order AS SortOrder, INSERTED.created_at AS CreatedAt
                WHERE id = @Id;";
            return await conn.QueryFirstOrDefaultAsync<QuestionRow>(sql, parameters);
        }

        public async Task ReplaceOptionsAsync(Guid questionId, List<QuestionOptionInput> options)
        {
            using var conn =  _dbconn.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();
            try
            {
                await conn.ExecuteAsync(
                    "DELETE FROM dbo.question_options WHERE question_id = @QuestionId",
                    new { QuestionId = questionId }, tx);

                const string insertOpt = @"
                    INSERT INTO dbo.question_options (question_id, option_text, is_correct, sort_order)
                    VALUES (@QuestionId, @OptionText, @IsCorrect, @SortOrder);";

                foreach (var opt in options)
                {
                    await conn.ExecuteAsync(insertOpt, new
                    {
                        QuestionId = questionId,
                        opt.OptionText,
                        opt.IsCorrect,
                        opt.SortOrder
                    }, tx);
                }

                tx.Commit();
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        public async Task DeleteQuestionAsync(Guid id)
        {
            using var conn =  _dbconn.CreateConnection();
            await conn.ExecuteAsync("DELETE FROM dbo.questions WHERE id = @Id", new { Id = id });
        }

        public async Task ReorderQuestionsAsync(List<ReorderItem> orders)
        {
            using var conn =  _dbconn.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();
            try
            {
                const string sql = "UPDATE dbo.questions SET sort_order = @SortOrder WHERE id = @Id;";
                foreach (var order in orders)
                    await conn.ExecuteAsync(sql, new { order.Id, order.SortOrder }, tx);

                tx.Commit();
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        public async Task<List<Guid>> BulkAddQuestionsAsync(Guid sheetId, List<ImportQuestionInput> questions)
        {
            using var conn =  _dbconn.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();
            var ids = new List<Guid>();
            try
            {
                const string insertQ = @"
                    INSERT INTO dbo.questions (sheet_id, question_text, marks, sort_order)
                    OUTPUT INSERTED.id
                    VALUES (@SheetId, @QuestionText, @Marks, 0);";

                const string insertOpt = @"
                    INSERT INTO dbo.question_options (question_id, option_text, is_correct, sort_order)
                    VALUES (@QuestionId, @OptionText, @IsCorrect, @SortOrder);";

                foreach (var q in questions)
                {
                    var newId = await conn.QuerySingleAsync<Guid>(insertQ, new
                    {
                        SheetId = sheetId,
                        QuestionText = q.QuestionText,
                        Marks = q.Marks
                    }, tx);

                    var idx = 0;
                    foreach (var opt in q.Options)
                    {
                        await conn.ExecuteAsync(insertOpt, new
                        {
                            QuestionId = newId,
                            opt.OptionText,
                            opt.IsCorrect,
                            SortOrder = idx++
                        }, tx);
                    }

                    ids.Add(newId);
                }

                tx.Commit();
                return ids;
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }
    }
}