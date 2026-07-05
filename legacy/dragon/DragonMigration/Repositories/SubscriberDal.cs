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
    public interface ISubscriberDal
    {
        Task<bool> CreateAsync(string email);
        Task<(IEnumerable<Subscriber> Items, int Total)> GetPaginatedAsync(int page, int limit);
        Task<bool> DeleteAsync(string email);
        Task<bool> ExistsAsync(string email);
        Task<Subscriber> GetByEmailAsync(string email);
    }

    public class SubscriberDal : ISubscriberDal
    {
        private readonly string _connectionString;
        public SubscriberDal(string connectionString) => _connectionString = connectionString;
        private IDbConnection Connection => new SqlConnection(_connectionString);

        public async Task<bool> CreateAsync(string email)
        {
            using (var db = Connection)
            {
                return await db.ExecuteAsync("INSERT INTO Subscribers (Id, Email, CreatedAt) VALUES (NEWID(), @Email, SYSUTCDATETIME())", new { Email = email }) > 0;
            }
        }

        public async Task<(IEnumerable<Subscriber> Items, int Total)> GetPaginatedAsync(int page, int limit)
        {
            using (var db = Connection)
            {
                const string sql = "SELECT COUNT(*) FROM Subscribers; SELECT * FROM Subscribers ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";
                using (var multi = await db.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
                {
                    return (await multi.ReadAsync<Subscriber>(), await multi.ReadFirstAsync<int>());
                }
            }
        }

        public async Task<bool> DeleteAsync(string email)
        {
            using (var db = Connection) return await db.ExecuteAsync("DELETE FROM Subscribers WHERE Email = @Email", new { Email = email }) > 0;
        }

        public async Task<bool> ExistsAsync(string email)
        {
            using (var db = Connection) return await db.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM Subscribers WHERE Email = @Email", new { Email = email }) > 0;
        }

        public async Task<Subscriber> GetByEmailAsync(string email)
        {
            using (var db = Connection) return await db.QueryFirstOrDefaultAsync<Subscriber>("SELECT * FROM Subscribers WHERE Email = @Email", new { Email = email });
        }
    }
}
