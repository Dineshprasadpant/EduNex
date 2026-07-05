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
    public interface IExamDal
    {
        Task<Guid> CreateAsync(Exam exam);
        Task<Exam> GetByIdAsync(Guid id);
        Task<IEnumerable<Exam>> FindByIdsAsync(IEnumerable<string> externalIds);
        Task<(IEnumerable<Exam> Items, int Total)> GetPaginatedAsync(int page, int limit);
        Task<(IEnumerable<Exam> Items, int Total)> GetByBatchAndStatusAsync(Guid batchId, string status, int page, int limit);
        Task<bool> UpdateAsync(string externalId, Exam exam);
        Task<bool> DeleteAsync(Guid id);
        
        // Attended check for logic replication
        Task<IEnumerable<Guid>> GetUserAttendedExamIdsAsync(Guid userId);
    }

    public class ExamDal : IExamDal
    {
        private readonly string _connectionString;
        public ExamDal(string connectionString) => _connectionString = connectionString;

        public async Task<Guid> CreateAsync(Exam ex)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                using (var trans = conn.BeginTransaction())
                {
                    try
                    {
                        ex.Id = Guid.NewGuid();
                        const string sql = @"
                            INSERT INTO Exams (Id, ExternalExamId, Title, Description, ExamName, StartDateTime, EndDateTime, 
                                             TotalMarks, PassMarks, Duration, NegativeMarking, NegativeMarkingNumber, 
                                             QuestionSheetId, CreatedAt)
                            VALUES (@Id, @ExternalId, @Title, @Description, @ExamName, @StartDateTime, @EndDateTime, 
                                    @TotalMarks, @PassMarks, @Duration, @NegativeMarking, @NegativeMarkingNumber, 
                                    @QuestionSheetId, SYSUTCDATETIME())";
                        
                        await conn.ExecuteAsync(sql, ex, trans);

                        if (ex.BatchIds?.Any() == true)
                        {
                            await conn.ExecuteAsync("INSERT INTO ExamBatches (ExamId, BatchId) VALUES (@ExId, @BId)",
                                ex.BatchIds.Select(bId => new { ExId = ex.Id, BId = bId }), trans);
                        }

                        trans.Commit();
                        return ex.Id;
                    }
                    catch { trans.Rollback(); throw; }
                }
            }
        }

        public async Task<Exam> GetByIdAsync(Guid id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT e.*, q.SheetName as QuestionSheetName 
                    FROM Exams e 
                    LEFT JOIN QuestionSheets q ON e.QuestionSheetId = q.Id 
                    WHERE e.Id = @Id;
                    SELECT BatchId FROM ExamBatches WHERE ExamId = @Id;";

                using (var multi = await conn.QueryMultipleAsync(sql, new { Id = id }))
                {
                    var exam = await multi.ReadFirstOrDefaultAsync<Exam>();
                    if (exam != null) exam.BatchIds = (await multi.ReadAsync<Guid>()).ToList();
                    return exam;
                }
            }
        }

        public async Task<IEnumerable<Exam>> FindByIdsAsync(IEnumerable<string> externalIds)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                return await conn.QueryAsync<Exam>("SELECT * FROM Exams WHERE ExternalExamId IN @Ids", new { Ids = externalIds });
            }
        }

        public async Task<(IEnumerable<Exam> Items, int Total)> GetPaginatedAsync(int page, int limit)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
            SELECT COUNT(*) FROM Exams;
            SELECT e.*, q.SheetName as QuestionSheetName 
            FROM Exams e
            LEFT JOIN QuestionSheets q ON e.QuestionSheetId = q.Id
            ORDER BY e.CreatedAt DESC 
            OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
                    
            SELECT eb.ExamId, b.Id, b.BatchName 
            FROM Batches b
            INNER JOIN ExamBatches eb ON b.Id = eb.BatchId
            INNER JOIN (SELECT Id FROM Exams ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY) e ON eb.ExamId = e.Id;";

                using (var multi = await conn.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
                {
                    int total = await multi.ReadFirstAsync<int>();
                    var exams = (await multi.ReadAsync<Exam>()).ToList();
                    var batchLinks = (await multi.ReadAsync<dynamic>()).ToList();

                    foreach (var exam in exams)
                    {
                        exam.Batches = batchLinks
                            .Where(bl => bl.ExamId == exam.Id)
                            .Select(bl => new BatchRef { Id = bl.Id, BatchName = bl.BatchName })
                            .ToList();
                    }

                    return (exams, total);
                }
            }
        }
        public async Task<(IEnumerable<Exam> Items, int Total)> GetByBatchAndStatusAsync(Guid batchId, string status, int page, int limit)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string dateCondition = status == "upComming" 
                    ? "AND e.StartDateTime > SYSUTCDATETIME()" 
                    : "AND e.StartDateTime <= SYSUTCDATETIME() AND e.EndDateTime > SYSUTCDATETIME()";

                string sql = $@"
                    SELECT COUNT(*) FROM Exams e INNER JOIN ExamBatches eb ON e.Id = eb.ExamId WHERE eb.BatchId = @BId {dateCondition};
                    SELECT e.* 
                    FROM Exams e 
                    INNER JOIN ExamBatches eb ON e.Id = eb.ExamId 
                    WHERE eb.BatchId = @BId {dateCondition}
                    ORDER BY e.StartDateTime ASC
                    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

                using (var multi = await conn.QueryMultipleAsync(sql, new { BId = batchId, Offset = (page - 1) * limit, Limit = limit }))
                {
                    return (await multi.ReadAsync<Exam>(), await multi.ReadFirstAsync<int>());
                }
            }
        }

        public async Task<IEnumerable<Guid>> GetUserAttendedExamIdsAsync(Guid userId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                return await conn.QueryAsync<Guid>("SELECT ExamId FROM UserExamAttempts WHERE UserId = @UId", new { UId = userId });
            }
        }

        public async Task<bool> UpdateAsync(string externalId, Exam ex)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = "UPDATE Exams SET Title = @Title, Description = @Description, ExamName = @ExamName, StartDateTime = @StartDateTime, EndDateTime = @EndDateTime WHERE ExternalExamId = @ExtId";
                return await conn.ExecuteAsync(sql, new { ex.Title, ex.Description, ex.ExamName, ex.StartDateTime, ex.EndDateTime, ExtId = externalId }) > 0;
            }
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
               return await conn.ExecuteAsync("DELETE FROM Exams WHERE Id = @Id", new { Id = id }) > 0;
            }
        }
    }
}
