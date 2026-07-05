using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using EduNex.Models;
using Microsoft.Data.SqlClient;

namespace EduNex.DataAccess
{
    public interface IQuestionSheetDal
    {
        Task<QuestionSheet> GetByIdAsync(Guid id);
        Task<Guid> CreateAsync(QuestionSheet sheet);
        Task<bool> UpdateAsync(Guid id, QuestionSheet sheet);
        Task<bool> DeleteAsync(Guid id);
        Task<(IEnumerable<QuestionSheet> Items, int Total)> GetAllPaginatedAsync(int page, int limit);
    }

    public class QuestionSheetDal : IQuestionSheetDal
    {
        private readonly string _connectionString;
        public QuestionSheetDal(string connectionString) => _connectionString = connectionString;
        private IDbConnection Connection => new SqlConnection(_connectionString);

        public async Task<QuestionSheet> GetByIdAsync(Guid id)
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT * FROM QuestionSheets WHERE Id = @Id;
                    SELECT * FROM Questions WHERE SheetId = @Id;
                    SELECT qo.* FROM QuestionOptions qo INNER JOIN Questions q ON qo.QuestionId = q.Id WHERE q.SheetId = @Id;";

                using (var multi = await db.QueryMultipleAsync(sql, new { Id = id }))
                {
                    var sheet = await multi.ReadFirstOrDefaultAsync<QuestionSheet>();
                    if (sheet == null) return null;

                    var questions = (await multi.ReadAsync<Question>()).ToList();
                    var options = await multi.ReadAsync<dynamic>();

                    foreach (var q in questions)
                    {
                        q.Answers = options.Where(o => o.QuestionId == q.Id).Select(o => (string)o.OptionText).ToList();
                    }
                    sheet.Questions = questions;
                    return sheet;
                }
            }
        }

        public async Task<Guid> CreateAsync(QuestionSheet sheet)
        {
            using (var db = Connection)
            {
                db.Open();
                using (var trans = db.BeginTransaction())
                {
                    try
                    {
                        sheet.Id = Guid.NewGuid();
                        await db.ExecuteAsync("INSERT INTO QuestionSheets (Id, SheetName, CreatedAt) VALUES (@Id, @SheetName, SYSUTCDATETIME())", sheet, trans);

                        foreach (var q in sheet.Questions)
                        {
                            q.Id = Guid.NewGuid();
                            await db.ExecuteAsync("INSERT INTO Questions (Id, SheetId, QuestionText, Marks, CorrectAnswer) VALUES (@Id, @SheetId, @QuestionText, @Marks, @CorrectAnswer)", 
                                new { q.Id, SheetId = sheet.Id, q.QuestionText, q.Marks, q.CorrectAnswer }, trans);

                            if (q.Answers?.Any() == true)
                            {
                                await db.ExecuteAsync("INSERT INTO QuestionOptions (QuestionId, OptionText) VALUES (@QId, @Opt)",
                                    q.Answers.Select(a => new { QId = q.Id, Opt = a }), trans);
                            }
                        }

                        trans.Commit();
                        return sheet.Id;
                    }
                    catch { trans.Rollback(); throw; }
                }
            }
        }

        public async Task<bool> UpdateAsync(Guid id, QuestionSheet sheet)
        {
            // Implementation typically involves deleting child records and re-inserting or using atomic updates
            using (var db = Connection)
            {
                db.Open();
                using (var trans = db.BeginTransaction())
                {
                    try
                    {
                        await db.ExecuteAsync("DELETE FROM QuestionSheets WHERE Id = @Id", new { Id = id }, trans);
                        sheet.Id = id;
                        await db.ExecuteAsync("INSERT INTO QuestionSheets (Id, SheetName, CreatedAt) VALUES (@Id, @SheetName, SYSUTCDATETIME())", sheet, trans);

                        foreach (var q in sheet.Questions)
                        {
                            q.Id = Guid.NewGuid();
                            await db.ExecuteAsync("INSERT INTO Questions (Id, SheetId, QuestionText, Marks, CorrectAnswer) VALUES (@Id, @SheetId, @QuestionText, @Marks, @CorrectAnswer)", 
                                new { q.Id, SheetId = sheet.Id, q.QuestionText, q.Marks, q.CorrectAnswer }, trans);

                            if (q.Answers?.Any() == true)
                            {
                                await db.ExecuteAsync("INSERT INTO QuestionOptions (QuestionId, OptionText) VALUES (@QId, @Opt)",
                                    q.Answers.Select(a => new { QId = q.Id, Opt = a }), trans);
                            }
                        }
                        trans.Commit();
                        return true;
                    }
                    catch { trans.Rollback(); throw; }
                }
            }
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using (var db = Connection) return await db.ExecuteAsync("DELETE FROM QuestionSheets WHERE Id = @Id", new { Id = id }) > 0;
        }

        public async Task<(IEnumerable<QuestionSheet> Items, int Total)> GetAllPaginatedAsync(int page, int limit)
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT COUNT(*) FROM QuestionSheets;
                    SELECT * FROM QuestionSheets ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";
                using (var multi = await db.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
                {
                    return (await multi.ReadAsync<QuestionSheet>(), await multi.ReadFirstAsync<int>());
                }
            }
        }
    }
}
