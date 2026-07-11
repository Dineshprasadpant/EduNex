using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using EduNex.Models;
using EduNex.Models.Dtos;
using Microsoft.Data.SqlClient;

namespace EduNex.DataAccess
{
    public interface IClassMaterialDal
    {
        Task<ClassMaterialDto?> GetByIdAsync(Guid id);
        Task<Guid> CreateAsync(ClassMaterial material);
        Task<bool> UpdateAsync(Guid id, ClassMaterial material);
        Task<bool> DeleteAsync(Guid id);
        Task<(IEnumerable<ClassMaterialDto> Items, int Total)> GetPaginatedByBatchAsync(Guid batchId, int limit, int offset);
        Task<(IEnumerable<ClassMaterialDto> Items, int Total)> GetAllPaginatedAsync(int limit, int offset);
    }

    public class ClassMaterialDal : IClassMaterialDal
    {
        private readonly string _connectionString;
        public ClassMaterialDal(string connectionString) => _connectionString = connectionString;
        private IDbConnection Connection => new SqlConnection(_connectionString);

        public async Task<ClassMaterialDto?> GetByIdAsync(Guid id)
        {
            using var db = Connection;
            const string sql = "SELECT * FROM dbo.class_materials WHERE id = @Id";
            return await db.QuerySingleOrDefaultAsync<ClassMaterialDto>(sql, new { Id = id });
        }

        public async Task<Guid> CreateAsync(ClassMaterial material)
        {
            using var db = Connection;
            material.Id = Guid.NewGuid();
            material.CreatedAt = DateTimeOffset.UtcNow;
            material.UpdatedAt = DateTimeOffset.UtcNow;

            const string sql = @"
                INSERT INTO dbo.class_materials (id, title, description, file_url, course_id, created_at, updated_at)
                VALUES (@Id, @Title, @Description, @FileUrl, @CourseId, @CreatedAt, @UpdatedAt);";

            await db.ExecuteAsync(sql, material);
            return material.Id;
        }

        public async Task<bool> UpdateAsync(Guid id, ClassMaterial material)
        {
            using var db = Connection;
            const string sql = @"
                UPDATE dbo.class_materials 
                SET title = @Title, description = @Description, file_url = @FileUrl, 
                    course_id = @CourseId, updated_at = @UpdatedAt 
                WHERE id = @Id";

            material.UpdatedAt = DateTimeOffset.UtcNow;
            material.Id = id;

            return await db.ExecuteAsync(sql, material) > 0;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using var db = Connection;
            return await db.ExecuteAsync("DELETE FROM dbo.class_materials WHERE id = @Id", new { Id = id }) > 0;
        }

        public async Task<(IEnumerable<ClassMaterialDto> Items, int Total)> GetAllPaginatedAsync(int limit, int offset)
        {
            using var db = Connection;
            const string sql = @"
                SELECT COUNT(*) FROM dbo.class_materials;
                SELECT * FROM dbo.class_materials 
                ORDER BY created_at DESC 
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            using var multi = await db.QueryMultipleAsync(sql, new { Offset = offset, Limit = limit });
            var total = await multi.ReadFirstAsync<int>();
            var items = await multi.ReadAsync<ClassMaterialDto>();
            return (items, total);
        }

        public async Task<(IEnumerable<ClassMaterialDto> Items, int Total)> GetPaginatedByBatchAsync(Guid batchId, int limit, int offset)
        {
            // Note: Re-implementing logic based on project DB structure. 
            // If ClassMaterialBatches exists, adjust query. Assuming course_id for now based on new DTO.
            using var db = Connection;
            const string sql = @"
                SELECT COUNT(*) FROM dbo.class_materials WHERE course_id = @BatchId;
                SELECT * FROM dbo.class_materials 
                WHERE course_id = @BatchId
                ORDER BY created_at DESC 
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            using var multi = await db.QueryMultipleAsync(sql, new { BatchId = batchId, Offset = offset, Limit = limit });
            var total = await multi.ReadFirstAsync<int>();
            var items = await multi.ReadAsync<ClassMaterialDto>();
            return (items, total);
        }
    }
}
