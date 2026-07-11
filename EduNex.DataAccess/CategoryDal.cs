using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
using EduNex.Models;

namespace EduNex.DataAccess
{
    public interface ICategoryDal
    {
        Task<(List<Category> Data, int Total)> ListAsync(int limit, int offset);
        Task<Category?> GetByIdAsync(Guid id);
        Task<Category> InsertCategoryAsync(Category category);
        Task<Category?> UpdateCategoryAsync(Category category);
        Task DeleteCategoryAsync(Guid id);
        Task<List<string>> GetAllSlugsAsync();
    }

    public class CategoryDal : ICategoryDal
    {
        private readonly string _connectionString;

        public CategoryDal(string connectionString)
        {
            _connectionString = connectionString;
        }

        private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

        public async Task<(List<Category> Data, int Total)> ListAsync(int limit, int offset)
        {
            using IDbConnection db = CreateConnection();
            
            var rowsSql = @"
                SELECT * FROM dbo.categories
                ORDER BY name ASC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            var countSql = "SELECT COUNT(*) FROM dbo.categories;";

            var rows = (await db.QueryAsync<Category>(rowsSql, new { Offset = offset, Limit = limit })).ToList();
            var total = await db.ExecuteScalarAsync<int>(countSql);

            return (rows, total);
        }

        public async Task<Category?> GetByIdAsync(Guid id)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT * FROM dbo.categories WHERE id = @Id";
            return await db.QuerySingleOrDefaultAsync<Category>(sql, new { Id = id });
        }

        public async Task<Category> InsertCategoryAsync(Category category)
        {
            using IDbConnection db = CreateConnection();

            category.Id = Guid.NewGuid();
            category.CreatedAt = DateTimeOffset.UtcNow;
            category.UpdatedAt = DateTimeOffset.UtcNow;

            const string sql = @"
                INSERT INTO dbo.categories (id, name, slug, description, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (@Id, @Name, @Slug, @Description, @CreatedAt, @UpdatedAt);";

            return await db.QuerySingleAsync<Category>(sql, category);
        }

        public async Task<Category?> UpdateCategoryAsync(Category category)
        {
            using IDbConnection db = CreateConnection();

            category.UpdatedAt = DateTimeOffset.UtcNow;

            const string sql = @"
                UPDATE dbo.categories
                SET name = @Name,
                    slug = @Slug,
                    description = @Description,
                    updated_at = @UpdatedAt
                OUTPUT INSERTED.*
                WHERE id = @Id;";

            return await db.QuerySingleOrDefaultAsync<Category>(sql, category);
        }

        public async Task DeleteCategoryAsync(Guid id)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "DELETE FROM dbo.categories WHERE id = @Id";
            await db.ExecuteAsync(sql, new { Id = id });
        }

        public async Task<List<string>> GetAllSlugsAsync()
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT slug FROM dbo.categories";
            var slugs = await db.QueryAsync<string>(sql);
            return slugs.ToList();
        }
    }
}
