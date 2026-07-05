using System;
using System.Collections.Generic;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;
using Dapper;
using EduNex.Models;
using System.Linq;

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

        public async Task<ClassMaterial> GetByIdAsync(Guid id)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                return await conn.QueryFirstOrDefaultAsync<ClassMaterial>("SELECT * FROM ClassMaterials WHERE Id = @Id", new { Id = id });
            }
        }

        public async Task<Guid> CreateAsync(ClassMaterial material)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                using (var trans = conn.BeginTransaction())
                {
                    try
                    {
                        material.Id = Guid.NewGuid();
                        const string sql = @"
                            INSERT INTO ClassMaterials (Id, ExternalMaterialId, Title, Description, FileUrl, CreatedAt, UpdatedAt)
                            VALUES (@Id, @MaterialId, @Title, @Description, @FileUrl, SYSUTCDATETIME(), SYSUTCDATETIME())";
                        
                        await conn.ExecuteAsync(sql, material, trans);

                        if (material.BatchIds?.Any() == true)
                        {
                            const string batchSql = "INSERT INTO ClassMaterialBatches (MaterialId, BatchId) VALUES (@MatId, @BatchId)";
                            await conn.ExecuteAsync(batchSql, material.BatchIds.Select(bId => new { MatId = material.Id, BatchId = bId }), trans);
                        }

                        trans.Commit();
                        return material.Id;
                    }
                    catch { trans.Rollback(); throw; }
                }
            }
        }

        public async Task<bool> UpdateAsync(Guid id, ClassMaterial material)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                using (var trans = conn.BeginTransaction())
                {
                    try
                    {
                        const string sql = "UPDATE ClassMaterials SET Title = @Title, Description = @Description, FileUrl = @FileUrl, UpdatedAt = SYSUTCDATETIME() WHERE Id = @Id";
                        var rows = await conn.ExecuteAsync(sql, new { material.Title, material.Description, material.FileUrl, Id = id }, trans);

                        await conn.ExecuteAsync("DELETE FROM ClassMaterialBatches WHERE MaterialId = @Id", new { Id = id }, trans);
                        if (material.BatchIds?.Any() == true)
                        {
                            const string batchSql = "INSERT INTO ClassMaterialBatches (MaterialId, BatchId) VALUES (@MatId, @BatchId)";
                            await conn.ExecuteAsync(batchSql, material.BatchIds.Select(bId => new { MatId = id, BatchId = bId }), trans);
                        }

                        trans.Commit();
                        return rows > 0;
                    }
                    catch { trans.Rollback(); throw; }
                }
            }
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                return await conn.ExecuteAsync("DELETE FROM ClassMaterials WHERE Id = @Id", new { Id = id }) > 0;
            }
        }

        public async Task<(IEnumerable<ClassMaterial> Items, int Total)> GetPaginatedByBatchAsync(Guid batchId, int page, int limit)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT COUNT(*) FROM ClassMaterialBatches WHERE BatchId = @BatchId;
                    SELECT m.* FROM ClassMaterials m INNER JOIN ClassMaterialBatches mb ON m.Id = mb.MaterialId WHERE mb.BatchId = @BatchId ORDER BY m.CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";
                using (var multi = await conn.QueryMultipleAsync(sql, new { BatchId = batchId, Offset = (page - 1) * limit, Limit = limit }))
                {
                    return (await multi.ReadAsync<ClassMaterial>(), await multi.ReadFirstAsync<int>());
                }
            }
        }

        public async Task<(IEnumerable<ClassMaterial> Items, int Total)> GetAllPaginatedAsync(int page, int limit)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT COUNT(*) FROM ClassMaterials;
                    SELECT * FROM ClassMaterials ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
                    SELECT mb.MaterialId, b.Id, b.BatchName FROM Batches b INNER JOIN ClassMaterialBatches mb ON b.Id = mb.BatchId INNER JOIN (SELECT Id FROM ClassMaterials ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY) m ON mb.MaterialId = m.Id;";
                using (var multi = await conn.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
                {
                    var total = await multi.ReadFirstAsync<int>();
                    var materials = (await multi.ReadAsync<ClassMaterial>()).ToList();
                    var batchLinks = await multi.ReadAsync<dynamic>();

                    foreach (var mat in materials)
                        mat.PopulatedBatches = batchLinks.Where(bl => bl.MaterialId == mat.Id).Select(bl => new BatchRef { Id = bl.Id, BatchName = bl.BatchName }).ToList();

                    return (materials, total);
                }
            }
        }
    }
}
