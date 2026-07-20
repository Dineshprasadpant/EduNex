using Dapper;
using EduNex.Models;
using Microsoft.Data.SqlClient;

namespace EduNex.DataAccess
{
    public interface ISubscriberDal
    {
        Task<bool> CreateAsync(string email);
        Task<DbResponse<Subscriber>> GetPaginatedAsync(int page, int limit);
        Task<bool> DeleteAsync(string email);
        Task<bool> ExistsAsync(string email);
        Task<Subscriber?> GetByEmailAsync(string email);
    }

    public class SubscriberDal : ISubscriberDal
    {
        private readonly string _connectionString;
        public SubscriberDal(string connectionString) => _connectionString = connectionString;

        public async Task<bool> CreateAsync(string email)
        {
            using var conn = new SqlConnection(_connectionString);
            return await conn.ExecuteAsync(
                "INSERT INTO Subscribers (Id, Email, CreatedAt) VALUES (NEWID(), @Email, SYSUTCDATETIME())",
                new { Email = email }) > 0;
        }

        public async Task<DbResponse<Subscriber>> GetPaginatedAsync(int page, int limit)
        {
            using var conn = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT COUNT(*) FROM Subscribers;
                SELECT * FROM Subscribers 
                ORDER BY Created_At DESC 
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            using var multi = await conn.QueryMultipleAsync(sql,
                new { Offset = (page - 1) * limit, Limit = limit });

            return new DbResponse<Subscriber>
            {
                Total = await multi.ReadFirstAsync<int>(),
                Items = await multi.ReadAsync<Subscriber>()
            };
        }

        public async Task<bool> DeleteAsync(string email)
        {
            using var conn = new SqlConnection(_connectionString);
            return await conn.ExecuteAsync(
                "DELETE FROM Subscribers WHERE Email = @Email",
                new { Email = email }) > 0;
        }

        public async Task<bool> ExistsAsync(string email)
        {
            using var conn = new SqlConnection(_connectionString);
            return await conn.ExecuteScalarAsync<int>(
                "SELECT COUNT(1) FROM Subscribers WHERE Email = @Email",
                new { Email = email }) > 0;
        }

        public async Task<Subscriber?> GetByEmailAsync(string email)
        {
            using var conn = new SqlConnection(_connectionString);
            return await conn.QueryFirstOrDefaultAsync<Subscriber>(
                "SELECT * FROM Subscribers WHERE Email = @Email",
                new { Email = email });
        }
    }
}