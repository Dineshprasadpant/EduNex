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
    public interface IExamPerformanceDal
    {
        Task<ExamPerformance> GetByExamIdAsync(Guid examId);
        Task<ExamPerformance> GetByIdAsync(Guid id);
        Task<Guid> CreateAsync(ExamPerformance perf);
        Task<bool> UpdateAsync(Guid id, ExamPerformance perf);
        Task<IEnumerable<ExamPerformance>> GetByYearAsync(string year, Guid batchId);
        Task<IEnumerable<ExamPerformance>> GetAllByBatchAsync(Guid batchId);
        Task<bool> DeleteAllByYearAsync(string year);
    }

    public class ExamPerformanceDal : IExamPerformanceDal
    {
        private readonly string _connectionString;
        public ExamPerformanceDal(string connectionString) => _connectionString = connectionString;
        private IDbConnection Connection => new SqlConnection(_connectionString);

        public async Task<ExamPerformance> GetByExamIdAsync(Guid examId)
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT * FROM ExamPerformances WHERE ExamId = @ExamId;
                    SELECT * FROM ExamHighestScorers WHERE PerformanceId = (SELECT Id FROM ExamPerformances WHERE ExamId = @ExamId);";
                using (var multi = await db.QueryMultipleAsync(sql, new { ExamId = examId }))
                {
                    var perf = await multi.ReadFirstOrDefaultAsync<ExamPerformance>();
                    if (perf != null) perf.HighestScorers = (await multi.ReadAsync<HighestScorer>()).ToList();
                    return perf;
                }
            }
        }

        public async Task<ExamPerformance> GetByIdAsync(Guid id)
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT * FROM ExamPerformances WHERE Id = @Id;
                    SELECT * FROM ExamHighestScorers WHERE PerformanceId = @Id;";
                using (var multi = await db.QueryMultipleAsync(sql, new { Id = id }))
                {
                    var perf = await multi.ReadFirstOrDefaultAsync<ExamPerformance>();
                    if (perf != null) perf.HighestScorers = (await multi.ReadAsync<HighestScorer>()).ToList();
                    return perf;
                }
            }
        }

        public async Task<Guid> CreateAsync(ExamPerformance perf)
        {
            using (var db = Connection)
            {
                perf.Id = Guid.NewGuid();
                await db.ExecuteAsync("INSERT INTO ExamPerformances (Id, BatchId, ExamId, AcademicYear, OverallPercentage, NumberOfExaminees, CreatedAt) VALUES (@Id, @BatchId, @ExamId, @AcademicYear, @OverallPercentage, @NumberOfExaminees, SYSUTCDATETIME())", perf);
                return perf.Id;
            }
        }

        public async Task<bool> UpdateAsync(Guid id, ExamPerformance perf)
        {
            using (var db = Connection)
            {
                db.Open();
                using (var trans = db.BeginTransaction())
                {
                    try
                    {
                        await db.ExecuteAsync("UPDATE ExamPerformances SET OverallPercentage = @OverallPercentage, NumberOfExaminees = @NumberOfExaminees WHERE Id = @Id", new { perf.OverallPercentage, perf.NumberOfExaminees, Id = id }, trans);
                        await db.ExecuteAsync("DELETE FROM ExamHighestScorers WHERE PerformanceId = @Id", new { Id = id }, trans);
                        if (perf.HighestScorers?.Any() == true)
                        {
                            await db.ExecuteAsync("INSERT INTO ExamHighestScorers (PerformanceId, UserId, Percentage) VALUES (@Id, @StudentId, @Percentage)", 
                                perf.HighestScorers.Select(s => new { Id = id, s.StudentId, s.Percentage }), trans);
                        }
                        trans.Commit();
                        return true;
                    }
                    catch { trans.Rollback(); throw; }
                }
            }
        }

        public async Task<IEnumerable<ExamPerformance>> GetByYearAsync(string year, Guid batchId)
        {
            using (var db = Connection) => await db.QueryAsync<ExamPerformance>("SELECT * FROM ExamPerformances WHERE AcademicYear = @Year AND BatchId = @BatchId", new { Year = year, BatchId = batchId });
        }

        public async Task<IEnumerable<ExamPerformance>> GetAllByBatchAsync(Guid batchId)
        {
            using (var db = Connection) => await db.QueryAsync<ExamPerformance>("SELECT * FROM ExamPerformances WHERE BatchId = @BatchId", new { BatchId = batchId });
        }

        public async Task<bool> DeleteAllByYearAsync(string year)
        {
            using (var db = Connection) => await db.ExecuteAsync("DELETE FROM ExamPerformances WHERE AcademicYear = @Year", new { Year = year }) > 0;
        }
    }
}
