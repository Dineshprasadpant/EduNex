using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Dragon.Models;
using Microsoft.Data.SqlClient;

namespace Dragon.Repositories
{
    public interface IAdvertisementRepository
    {
        Task<(IEnumerable<Advertisement> Items, int Total)> GetPaginatedAsync(int page, int limit);
        Task<Advertisement> GetByIdAsync(Guid id);
        Task<Guid> CreateAsync(Advertisement ad);
        Task<bool> UpdateAsync(Guid id, Advertisement ad);
        Task<bool> DeleteAsync(Guid id);
    }

    public class AdvertisementRepository : IAdvertisementRepository
    {
        private readonly string _connectionString;
        public AdvertisementRepository(string connectionString) => _connectionString = connectionString;
        private IDbConnection Connection => new SqlConnection(_connectionString);

        public async Task<(IEnumerable<Advertisement> Items, int Total)> GetPaginatedAsync(int page, int limit)
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT COUNT(*) FROM Advertisements;
                    SELECT * FROM Advertisements ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";
                using (var multi = await db.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
                {
                    return (await multi.ReadAsync<Advertisement>(), await multi.ReadFirstAsync<int>());
                }
            }
        }

        public async Task<Advertisement> GetByIdAsync(Guid id)
        {
            using (var db = Connection)
            {
                return await db.QueryFirstOrDefaultAsync<Advertisement>("SELECT * FROM Advertisements WHERE Id = @Id", new { Id = id });
            }
        }

        public async Task<Guid> CreateAsync(Advertisement ad)
        {
            using (var db = Connection)
            {
                ad.Id = Guid.NewGuid();
                const string sql = "INSERT INTO Advertisements (Id, Title, Description, ImageUrl, LinkUrl, CreatedAt, UpdatedAt) VALUES (@Id, @Title, @Description, @ImageUrl, @LinkUrl, @CreatedAt, @UpdatedAt)";
                await db.ExecuteAsync(sql, ad);
                return ad.Id;
            }
        }

        public async Task<bool> UpdateAsync(Guid id, Advertisement ad)
        {
            using (var db = Connection)
            {
                const string sql = "UPDATE Advertisements SET Title = @Title, Description = @Description, ImageUrl = @ImageUrl, LinkUrl = @LinkUrl, UpdatedAt = SYSUTCDATETIME() WHERE Id = @Id";
                return await db.ExecuteAsync(sql, new { ad.Title, ad.Description, ad.ImageUrl, ad.LinkUrl, Id = id }) > 0;
            }
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using (var db = Connection)
            {
                return await db.ExecuteAsync("DELETE FROM Advertisements WHERE Id = @Id", new { Id = id }) > 0;
            }
        }
    }
}
