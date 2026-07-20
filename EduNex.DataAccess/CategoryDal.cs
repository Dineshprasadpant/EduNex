using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using EduNex.Api.DataAccess;
using EduNex.Models;
using Microsoft.Data.SqlClient;

namespace EduNex.DataAccess
{
    public interface ICategoryDal
    {
        Task<List<Category>> FindAllAsync(DalPagination? pagination = null);
        Task<int> CountAllAsync();
        Task<Category?> FindByIdAsync(Guid id);
        Task<Category> CreateAsync(string name, string slug, string? description);
        Task<Category?> UpdateAsync(Guid id, string? name, string? description, string? slug);
        Task RemoveAsync(Guid id);
        Task<List<string>> FindSlugsAsync();
    }

    // Raw connectionString constructor, matching the sibling XxxDal pattern.
    public class CategoryDal(IDbConnectionFactory _dbconn) : ICategoryDal
    {
        
        private static bool IsUniqueViolation(SqlException ex) => ex.Number is 2601 or 2627;

        public async Task<List<Category>> FindAllAsync(DalPagination? pagination = null)
        {
            using var connection = _dbconn.CreateConnection();
            if (pagination is null)
            {
                return (await connection.QueryAsync<Category>(
                    "SELECT * FROM dbo.categories ORDER BY name ASC")).ToList();
            }

            const string sql = @"
                SELECT * FROM dbo.categories
                ORDER BY name ASC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY";
            return (await connection.QueryAsync<Category>(sql, new { pagination.Offset, pagination.Limit })).ToList();
        }

        public async Task<int> CountAllAsync()
        {
            using var connection = _dbconn.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<int>("SELECT COUNT(*) FROM dbo.categories");
        }

        public async Task<Category?> FindByIdAsync(Guid id)
        {
            using var connection = _dbconn.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<Category>(
                "SELECT * FROM dbo.categories WHERE id = @Id", new { Id = id });
        }

        public async Task<Category> CreateAsync(string name, string slug, string? description)
        {
            using var connection = _dbconn.CreateConnection();
            const string sql = @"
                INSERT INTO dbo.categories (id, name, slug, description)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @Name, @Slug, @Description)";
            try
            {
                return await connection.QuerySingleAsync<Category>(sql, new { Name = name, Slug = slug, Description = description });
            }
            catch (SqlException ex) when (IsUniqueViolation(ex))
            {
                throw new ConflictException("A category with this name already exists");
            }
        }

        public async Task<Category?> UpdateAsync(Guid id, string? name, string? description, string? slug)
        {
            var sets = new List<string> { "updated_at = SYSDATETIMEOFFSET()" };
            var p = new DynamicParameters();
            p.Add("Id", id);

            if (name is not null) { sets.Add("name = @Name"); p.Add("Name", name); }
            if (description is not null) { sets.Add("description = @Description"); p.Add("Description", description); }
            if (slug is not null) { sets.Add("slug = @Slug"); p.Add("Slug", slug); }

            var sql = $"UPDATE dbo.categories SET {string.Join(", ", sets)} OUTPUT INSERTED.* WHERE id = @Id";
            using var connection = _dbconn.CreateConnection();
            try
            {
                return await connection.QueryFirstOrDefaultAsync<Category>(sql, p);
            }
            catch (SqlException ex) when (IsUniqueViolation(ex))
            {
                throw new ConflictException("A category with this name already exists");
            }
        }

        public async Task RemoveAsync(Guid id)
        {
            using var connection = _dbconn.CreateConnection();
            // Courses referencing this category get category_id set to NULL
            // automatically via FK_courses_category ON DELETE SET NULL.
            await connection.ExecuteAsync("DELETE FROM dbo.categories WHERE id = @Id", new { Id = id });
        }

        public async Task<List<string>> FindSlugsAsync()
        {
            using var connection = _dbconn.CreateConnection();
            return (await connection.QueryAsync<string>("SELECT slug FROM dbo.categories")).ToList();
        }
    }
}