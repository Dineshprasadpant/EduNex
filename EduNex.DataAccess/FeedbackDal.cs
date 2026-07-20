using Dapper;
using EduNex.Api.DataAccess;
using EduNex.Models;
using Microsoft.Data.SqlClient;
using System.Data;

namespace EduNex.DataAccess
{
    public interface IFeedbackDal
    {
        Task<(List<Feedback> Data, int Total)> FindAllAsync(int? rating, int limit, int offset);
        Task<List<Feedback>> FindPublicAsync(int limit = 9);
        Task<Feedback> CreateAsync(Feedback feedback);
        Task<Feedback> ReplyAsync(Guid id, string replyText);
        Task RemoveAsync(Guid id);
        Task<decimal> GetAverageRatingAsync();
        Task<int> CountAllAsync();
    }

    public class FeedbackDal(IDbConnectionFactory _dbconn) : IFeedbackDal
    {
        public async Task<(List<Feedback> Data, int Total)> FindAllAsync(int? rating, int limit, int offset)
        {
            using IDbConnection db = _dbconn.CreateConnection();

            var whereClause = rating.HasValue ? "WHERE rating = @Rating" : "";

            var rowsSql = $@"
                SELECT * FROM dbo.feedback
                {whereClause}
                ORDER BY created_at DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            var countSql = $"SELECT COUNT(*) FROM dbo.feedback {whereClause};";

            var parameters = new { Rating = rating, Offset = offset, Limit = limit };

            var rows = (await db.QueryAsync<Feedback>(rowsSql, parameters)).ToList();
            var total = await db.ExecuteScalarAsync<int>(countSql, parameters);

            return (rows, total);
        }

        public async Task<List<Feedback>> FindPublicAsync(int limit = 9)
        {
            using IDbConnection db = _dbconn.CreateConnection();
            const string sql = @"
                SELECT TOP (@Limit) *
                FROM dbo.feedback
                WHERE rating >= 4
                ORDER BY created_at DESC;";
            var rows = await db.QueryAsync<Feedback>(sql, new { Limit = limit });
            return rows.ToList();
        }

        public async Task<Feedback> CreateAsync(Feedback feedback)
        {
            using IDbConnection db = _dbconn.CreateConnection();

            feedback.Id = Guid.NewGuid();
            feedback.CreatedAt = DateTimeOffset.UtcNow;

            const string sql = @"
                INSERT INTO dbo.feedback (id, name, email, rating, feedback_text, created_at)
                OUTPUT INSERTED.*
                VALUES (@Id, @Name, @Email, @Rating, @FeedbackText, @CreatedAt);";

            return await db.QuerySingleAsync<Feedback>(sql, feedback);
        }

        public async Task<Feedback> ReplyAsync(Guid id, string replyText)
        {
            using IDbConnection db = _dbconn.CreateConnection();
            const string sql = @"
                UPDATE dbo.feedback
                SET admin_reply = @Reply, replied_at = @Now
                OUTPUT INSERTED.*
                WHERE id = @Id;";

            var row = await db.QuerySingleOrDefaultAsync<Feedback>(sql, new { Id = id, Reply = replyText, Now = DateTimeOffset.UtcNow });
            return row ?? throw new NotFoundException("Feedback not found");
        }

        public async Task RemoveAsync(Guid id)
        {
            using IDbConnection db = _dbconn.CreateConnection();
            const string sql = "DELETE FROM dbo.feedback WHERE id = @Id";
            await db.ExecuteAsync(sql, new { Id = id });
        }

        public async Task<decimal> GetAverageRatingAsync()
        {
            using IDbConnection db = _dbconn.CreateConnection();
            const string sql = "SELECT AVG(CAST(rating AS DECIMAL(5,2))) FROM dbo.feedback";
            var result = await db.ExecuteScalarAsync<decimal?>(sql);
            return result ?? 0;
        }
        public async Task<int> CountAllAsync()
        {
            using IDbConnection db = _dbconn.CreateConnection();
            return await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM dbo.feedback");
        }
    }
}