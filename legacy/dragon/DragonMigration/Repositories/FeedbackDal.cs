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
    public interface IFeedbackDal
    {
        Task<Guid> CreateAsync(Feedback feedback);
        Task<(IEnumerable<Feedback> Items, int Total)> GetPaginatedAsync(int page, int limit);
        Task<(IEnumerable<Feedback> Items, int Total)> GetPositivePaginatedAsync(int page, int limit);
        Task<Feedback> GetByIdAsync(Guid id);
        Task<bool> DeleteAsync(Guid id);
    }

    public class FeedbackDal : IFeedbackDal
    {
        private readonly string _connectionString;
        public FeedbackDal(string connectionString) => _connectionString = connectionString;
        private IDbConnection Connection => new SqlConnection(_connectionString);

        public async Task<Guid> CreateAsync(Feedback fb)
        {
            using (var db = Connection)
            {
                fb.Id = Guid.NewGuid();
                const string sql = @"
                    INSERT INTO Feedback (Id, Name, Email, Rating, feedback, CreatedAt) 
                    VALUES (@Id, @Name, @Email, @Rating, @FeedbackText, SYSUTCDATETIME())";
                await db.ExecuteAsync(sql, fb);
                return fb.Id;
            }
        }

        public async Task<Feedback> GetByIdAsync(Guid id)
        {
            using (var db = Connection)
            {
                return await db.QueryFirstOrDefaultAsync<Feedback>("SELECT Id, Name, Email, Rating, feedback as FeedbackText, CreatedAt FROM Feedback WHERE Id = @Id", new { Id = id });
            }
        }

        public async Task<(IEnumerable<Feedback> Items, int Total)> GetPaginatedAsync(int page, int limit)
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT COUNT(*) FROM Feedback;
                    SELECT Id, Name, Email, Rating, feedback as FeedbackText, CreatedAt 
                    FROM Feedback 
                    ORDER BY CreatedAt DESC 
                    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";
                
                using (var multi = await db.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
                {
                    return (await multi.ReadAsync<Feedback>(), await multi.ReadFirstAsync<int>());
                }
            }
        }

        public async Task<(IEnumerable<Feedback> Items, int Total)> GetPositivePaginatedAsync(int page, int limit)
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT COUNT(*) FROM Feedback WHERE Rating >= 4;
                    SELECT Id, Name, Email, Rating, feedback as FeedbackText, CreatedAt 
                    FROM Feedback 
                    WHERE Rating >= 4
                    ORDER BY CreatedAt DESC 
                    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";
                
                using (var multi = await db.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
                {
                    return (await multi.ReadAsync<Feedback>(), await multi.ReadFirstAsync<int>());
                }
            }
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using (var db = Connection) return await db.ExecuteAsync("DELETE FROM Feedback WHERE Id = @Id", new { Id = id }) > 0;
        }
    }
}
