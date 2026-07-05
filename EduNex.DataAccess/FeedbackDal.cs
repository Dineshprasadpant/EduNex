using System.Data;
using Dapper;
using EduNex.Models;
using Microsoft.Data.SqlClient;

namespace EduNex.DataAccess
{
    public interface IFeedbackDal
    {
        Task<Guid> CreateAsync(Feedback feedback);
        Task<Feedback?> GetByIdAsync(Guid id);
        Task<DbResponse<Feedback>> GetPaginatedAsync(int page, int limit);
        Task<DbResponse<Feedback>> GetPositivePaginatedAsync(int page, int limit);
        Task<bool> DeleteAsync(Guid id);
    }

    public class FeedbackDal : IFeedbackDal
    {
        private readonly string _connectionString;
        private IDbConnection Connection => new SqlConnection(_connectionString);
        public FeedbackDal(string connectionString) => _connectionString = connectionString;

        public async Task<Guid> CreateAsync(Feedback fb)
        {
            using var db = Connection;
            fb.Id = Guid.NewGuid();
            const string sql = @"
                INSERT INTO Feedback (Id, Name, Email, Rating, Feedback, CreatedAt)
                VALUES (@Id, @Name, @Email, @Rating, @FeedbackText, SYSUTCDATETIME())";
            await db.ExecuteAsync(sql, fb);
            return fb.Id;
        }

        public async Task<Feedback?> GetByIdAsync(Guid id)
        {
            using var db = Connection;
            const string sql = @"
                SELECT Id, Name, Email, Rating, Feedback as FeedbackText, CreatedAt
                FROM Feedback WHERE Id = @Id";
            return await db.QueryFirstOrDefaultAsync<Feedback>(sql, new { Id = id });
        }

        public async Task<DbResponse<Feedback>> GetPaginatedAsync(int page, int limit)
        {
            using var db = Connection;
            const string sql = @"
                SELECT COUNT(*) FROM Feedback;
                SELECT Id, Name, Email, Rating, Feedback as FeedbackText, CreatedAt
                FROM Feedback
                ORDER BY CreatedAt DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            using var multi = await db.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit });
            return new DbResponse<Feedback>
            {
                Total = await multi.ReadFirstAsync<int>(),
                Items = await multi.ReadAsync<Feedback>()
            };
        }

        public async Task<DbResponse<Feedback>> GetPositivePaginatedAsync(int page, int limit)
        {
            using var db = Connection;
            const string sql = @"
                SELECT COUNT(*) FROM Feedback WHERE Rating >= 4;
                SELECT Id, Name, Email, Rating, Feedback as FeedbackText, CreatedAt
                FROM Feedback
                WHERE Rating >= 4
                ORDER BY CreatedAt DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            using var multi = await db.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit });
            return new DbResponse<Feedback>
            {
                Total = await multi.ReadFirstAsync<int>(),
                Items = await multi.ReadAsync<Feedback>()
            };
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using var db = Connection;
            return await db.ExecuteAsync("DELETE FROM Feedback WHERE Id = @Id", new { Id = id }) > 0;
        }
    }
}