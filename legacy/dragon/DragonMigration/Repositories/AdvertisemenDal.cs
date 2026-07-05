using Microsoft.Data.SqlClient;
using Dapper;
using EduNex.Models;
namespace EduNex.DataAccess
{
    public interface IAdvertisementDal
    {
        Task<(IEnumerable<Advertisement> Items, int Total)> GetPaginatedAsync(int page, int limit);
        Task<Advertisement> GetByIdAsync(Guid id);
        Task<Guid> CreateAsync(Advertisement ad);
        Task<bool> UpdateAsync(Guid id, Advertisement ad);
        Task<bool> DeleteAsync(Guid id);
    }

    public class AdvertisementDal : IAdvertisementDal
    {
        private readonly string _connectionString;
        public AdvertisementDal(string connectionString) {
            _connectionString = connectionString;
        }

        public async Task<(IEnumerable<Advertisement> Items, int Total)> GetPaginatedAsync(int page, int limit)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
            SELECT COUNT(*) FROM Advertisements;
            SELECT * FROM Advertisements ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

                using (var multi = await conn.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
                {
                    var total = await multi.ReadFirstAsync<int>();
                    var items = await multi.ReadAsync<Advertisement>(); 

                    return (items, total);
                }
            }
        }

        public async Task<Advertisement> GetByIdAsync(Guid id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                return await conn.QueryFirstOrDefaultAsync<Advertisement>("SELECT * FROM Advertisements WHERE Id = @Id", new { Id = id });
            }
        }

        public async Task<Guid> CreateAsync(Advertisement ad)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                ad.Id = Guid.NewGuid();
                const string sql = "INSERT INTO Advertisements (Id, Title, Description, ImageUrl, LinkUrl, CreatedAt, UpdatedAt) VALUES (@Id, @Title, @Description, @ImageUrl, @LinkUrl, @CreatedAt, @UpdatedAt)";
                await conn.ExecuteAsync(sql, ad);
                return ad.Id;
            }
        }

        public async Task<bool> UpdateAsync(Guid id, Advertisement ad)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = "UPDATE Advertisements SET Title = @Title, Description = @Description, ImageUrl = @ImageUrl, LinkUrl = @LinkUrl, UpdatedAt = SYSUTCDATETIME() WHERE Id = @Id";
                return await conn.ExecuteAsync(sql, new { ad.Title, ad.Description, ad.ImageUrl, ad.LinkUrl, Id = id }) > 0;
            }
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                return await conn.ExecuteAsync("DELETE FROM Advertisements WHERE Id = @Id", new { Id = id }) > 0;
            }
        }
    }

}
