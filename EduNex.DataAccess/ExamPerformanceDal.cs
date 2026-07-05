using System.Data;
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
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT * FROM ExamPerformances WHERE ExamId = @ExamId;
                    SELECT * FROM ExamHighestScorers WHERE PerformanceId = (SELECT Id FROM ExamPerformances WHERE ExamId = @ExamId);";
                using (var multi = await conn.QueryMultipleAsync(sql, new { ExamId = examId }))
                {
                    var perf = await multi.ReadFirstOrDefaultAsync<ExamPerformance>();
                    if (perf != null) perf.HighestScorers = (await multi.ReadAsync<HighestScorer>()).ToList();
                    return perf;
                }
            }
        }

        public async Task<ExamPerformance> GetByIdAsync(Guid id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT * FROM ExamPerformances WHERE Id = @Id;
                    SELECT * FROM ExamHighestScorers WHERE PerformanceId = @Id;";
                using (var multi = await conn.QueryMultipleAsync(sql, new { Id = id }))
                {
                    var perf = await multi.ReadFirstOrDefaultAsync<ExamPerformance>();
                    if (perf != null) perf.HighestScorers = (await multi.ReadAsync<HighestScorer>()).ToList();
                    return perf;
                }
            }
        }

        public async Task<Guid> CreateAsync(ExamPerformance perf)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                perf.Id = Guid.NewGuid();
                await conn.ExecuteAsync("INSERT INTO ExamPerformances (Id, BatchId, ExamId, AcademicYear, OverallPercentage, NumberOfExaminees, CreatedAt) VALUES (@Id, @BatchId, @ExamId, @AcademicYear, @OverallPercentage, @NumberOfExaminees, SYSUTCDATETIME())", perf);
                return perf.Id;
            }
        }

        public async Task<bool> UpdateAsync(Guid id, ExamPerformance perf)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                using (var trans = conn.BeginTransaction())
                {
                    try
                    {
                        await conn.ExecuteAsync("UPDATE ExamPerformances SET OverallPercentage = @OverallPercentage, NumberOfExaminees = @NumberOfExaminees WHERE Id = @Id", new { perf.OverallPercentage, perf.NumberOfExaminees, Id = id }, trans);
                        await conn.ExecuteAsync("DELETE FROM ExamHighestScorers WHERE PerformanceId = @Id", new { Id = id }, trans);
                        if (perf.HighestScorers?.Any() == true)
                        {
                            await conn.ExecuteAsync("INSERT INTO ExamHighestScorers (PerformanceId, UserId, Percentage) VALUES (@Id, @StudentId, @Percentage)", 
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
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                return await conn.QueryAsync<ExamPerformance>("SELECT * FROM ExamPerformances WHERE AcademicYear = @Year AND BatchId = @BatchId", new { Year = year, BatchId = batchId });

            }
        }

        public async Task<IEnumerable<ExamPerformance>> GetAllByBatchAsync(Guid batchId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                return await conn.QueryAsync<ExamPerformance>("SELECT * FROM ExamPerformances WHERE BatchId = @BatchId", new { BatchId = batchId });
            }
        }

        public async Task<bool> DeleteAllByYearAsync(string year)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
               return await conn.ExecuteAsync("DELETE FROM ExamPerformances WHERE AcademicYear = @Year", new { Year = year }) > 0;
            }
        }
    }
}
