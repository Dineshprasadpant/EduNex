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
    public interface IClassMaterialDal
    {
        Task<ClassMaterial> GetByIdAsync(Guid id);
        Task<Guid> CreateAsync(ClassMaterial material);
        Task<bool> UpdateAsync(Guid id, ClassMaterial material);
        Task<bool> DeleteAsync(Guid id);
        Task<(IEnumerable<ClassMaterial> Items, int Total)> GetPaginatedByBatchAsync(Guid batchId, int page, int limit);
        Task<(IEnumerable<ClassMaterial> Items, int Total)> GetAllPaginatedAsync(int page, int limit);
    }

    public class ClassMaterialDal : IClassMaterialDal
    {
        private readonly string _connectionString;
        public ClassMaterialDal(string connectionString) => _connectionString = connectionString;
        private IDbConnection Connection => new SqlConnection(_connectionString);

        private const string SelectColumns = @"
            Id, material_id AS ExternalMaterialId, Title, Description, FileUrl, CreatedAt, UpdatedAt";

        public async Task<ClassMaterial> GetByIdAsync(Guid id)
        {
            using var db = Connection;
            const string sql = $@"
                SELECT {SelectColumns} FROM ClassMaterials WHERE Id = @Id;
                SELECT b.Id, b.BatchName 
                FROM Batches b
                INNER JOIN ClassMaterialBatches mb ON b.Id = mb.BatchId
                WHERE mb.MaterialId = @Id;";

            using var multi = await db.QueryMultipleAsync(sql, new { Id = id });
            var material = await multi.ReadFirstOrDefaultAsync<ClassMaterial>();
            if (material == null) return null;

            material.Batches = (await multi.ReadAsync<BatchRef>()).ToList();
            material.BatchIds = material.Batches.Select(b => b.Id).ToList();
            return material;
        }

        public async Task<Guid> CreateAsync(ClassMaterial material)
        {
            using var db = Connection;
            db.Open();
            using var trans = db.BeginTransaction();
            try
            {
                material.Id = Guid.NewGuid();
                const string sql = @"
                    INSERT INTO ClassMaterials (Id, material_id, Title, Description, FileUrl, CreatedAt, UpdatedAt)
                    VALUES (@Id, @ExternalMaterialId, @Title, @Description, @FileUrl, SYSUTCDATETIME(), SYSUTCDATETIME())";

                await db.ExecuteAsync(sql, new
                {
                    material.Id,
                    material.ExternalMaterialId,
                    material.Title,
                    material.Description,
                    material.FileUrl
                }, trans);

                if (material.BatchIds?.Any() == true)
                {
                    const string batchSql = "INSERT INTO ClassMaterialBatches (MaterialId, BatchId) VALUES (@MatId, @BatchId)";
                    await db.ExecuteAsync(batchSql, material.BatchIds.Select(bId => new { MatId = material.Id, BatchId = bId }), trans);
                }

                trans.Commit();
                return material.Id;
            }
            catch { trans.Rollback(); throw; }
        }

        public async Task<bool> UpdateAsync(Guid id, ClassMaterial material)
        {
            using var db = Connection;
            db.Open();
            using var trans = db.BeginTransaction();
            try
            {
                const string sql = @"
                    UPDATE ClassMaterials 
                    SET Title = @Title, Description = @Description, FileUrl = @FileUrl, 
                        material_id = @ExternalMaterialId, UpdatedAt = SYSUTCDATETIME() 
                    WHERE Id = @Id";

                var rows = await db.ExecuteAsync(sql, new
                {
                    material.Title,
                    material.Description,
                    material.FileUrl,
                    material.ExternalMaterialId,
                    Id = id
                }, trans);

                if (rows == 0)
                {
                    trans.Rollback();
                    return false;
                }

                if (material.BatchIds != null)
                {
                    await db.ExecuteAsync("DELETE FROM ClassMaterialBatches WHERE MaterialId = @Id", new { Id = id }, trans);
                    if (material.BatchIds.Any())
                    {
                        const string batchSql = "INSERT INTO ClassMaterialBatches (MaterialId, BatchId) VALUES (@MatId, @BatchId)";
                        await db.ExecuteAsync(batchSql, material.BatchIds.Select(bId => new { MatId = id, BatchId = bId }), trans);
                    }
                }

                trans.Commit();
                return true;
            }
            catch { trans.Rollback(); throw; }
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using var db = Connection;
            return await db.ExecuteAsync("DELETE FROM ClassMaterials WHERE Id = @Id", new { Id = id }) > 0;
        }

        public async Task<(IEnumerable<ClassMaterial> Items, int Total)> GetPaginatedByBatchAsync(Guid batchId, int page, int limit)
        {
            using var db = Connection;
            const string sql = @"
        SELECT COUNT(*) FROM ClassMaterialBatches WHERE BatchId = @BatchId;

        SELECT m.Id, m.material_id AS ExternalMaterialId, m.Title, m.Description, m.FileUrl, m.CreatedAt, m.UpdatedAt
        FROM ClassMaterials m
        INNER JOIN ClassMaterialBatches mb ON m.Id = mb.MaterialId
        WHERE mb.BatchId = @BatchId
        ORDER BY m.CreatedAt DESC
        OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            using var multi = await db.QueryMultipleAsync(sql, new { BatchId = batchId, Offset = (page - 1) * limit, Limit = limit });
            var total = await multi.ReadFirstAsync<int>();
            var items = (await multi.ReadAsync<ClassMaterial>()).ToList();

            if (items.Any())
            {
                var ids = items.Select(i => i.Id).ToList();
                const string batchSql = @"
            SELECT mb.MaterialId, b.Id, b.BatchName
            FROM Batches b
            INNER JOIN ClassMaterialBatches mb ON b.Id = mb.BatchId
            WHERE mb.MaterialId IN @Ids;";

                var links = (await db.QueryAsync<dynamic>(batchSql, new { Ids = ids })).ToList();
                foreach (var mat in items)
                {
                    mat.Batches = links.Where(l => l.MaterialId == mat.Id)
                                        .Select(l => new BatchRef { Id = l.Id, BatchName = l.BatchName })
                                        .ToList();
                }
            }

            return (items, total);
        }

        public async Task<(IEnumerable<ClassMaterial> Items, int Total)> GetAllPaginatedAsync(int page, int limit)
        {
            using var db = Connection;
            const string sql = $@"
                SELECT COUNT(*) FROM ClassMaterials;

                SELECT {SelectColumns} FROM ClassMaterials 
                ORDER BY CreatedAt DESC 
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

                SELECT mb.MaterialId, b.Id, b.BatchName 
                FROM Batches b
                INNER JOIN ClassMaterialBatches mb ON b.Id = mb.BatchId
                WHERE mb.MaterialId IN (
                    SELECT Id FROM ClassMaterials 
                    ORDER BY CreatedAt DESC 
                    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
                );";

            using var multi = await db.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit });
            var total = await multi.ReadFirstAsync<int>();
            var materials = (await multi.ReadAsync<ClassMaterial>()).ToList();
            var batchLinks = (await multi.ReadAsync<(Guid MaterialId, Guid Id, string BatchName)>()).ToList();

            foreach (var mat in materials)
            {
                mat.Batches = batchLinks
                    .Where(bl => bl.MaterialId == mat.Id)
                    .Select(bl => new BatchRef { Id = bl.Id, BatchName = bl.BatchName })
                    .ToList();
                mat.BatchIds = mat.Batches.Select(b => b.Id).ToList();
            }

            return (materials, total);
        }
    }
}