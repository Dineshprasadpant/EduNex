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
    // 1:1 with siteContentRepository (site-content.repository.ts).
    public interface ISiteContentDal
    {
        Task<List<SiteContentRow>> FindAllAsync();
        Task<SiteContentRow?> FindByKeyAsync(string key);
        Task<SiteContentRow> UpsertAsync(string key, string dataJson);
        Task InsertIfMissingAsync(string key, string dataJson);
    }

    // Raw connectionString constructor, matching the sibling XxxDal pattern
    // (new AuthDal(connectionString), new ExamDal(connectionString), etc.)
    public class SiteContentDal(IDbConnectionFactory _dbconn) : ISiteContentDal
    {

        public async Task<List<SiteContentRow>> FindAllAsync()
        {
            using var connection = _dbconn.CreateConnection();
            const string sql = "SELECT [key] AS [Key], data AS Data, updated_at AS UpdatedAt FROM dbo.site_content";
            return (await connection.QueryAsync<SiteContentRow>(sql)).ToList();
        }

        public async Task<SiteContentRow?> FindByKeyAsync(string key)
        {
            using var connection = _dbconn.CreateConnection();
            const string sql = @"
                SELECT TOP 1 [key] AS [Key], data AS Data, updated_at AS UpdatedAt
                FROM dbo.site_content
                WHERE [key] = @Key";
            return await connection.QueryFirstOrDefaultAsync<SiteContentRow>(sql, new { Key = key });
        }

        // SQL Server has no ON CONFLICT DO UPDATE, so MERGE stands in for
        // Drizzle's onConflictDoUpdate({ target: siteContent.key, ... }).
        public async Task<SiteContentRow> UpsertAsync(string key, string dataJson)
        {
            using var connection = _dbconn.CreateConnection();
            const string sql = @"
                MERGE INTO dbo.site_content AS target
                USING (SELECT @Key AS [Key]) AS source
                ON target.[key] = source.[Key]
                WHEN MATCHED THEN
                    UPDATE SET data = @Data, updated_at = SYSDATETIMEOFFSET()
                WHEN NOT MATCHED THEN
                    INSERT (id, [key], data) VALUES (NEWID(), @Key, @Data)
                OUTPUT inserted.[key] AS [Key], inserted.data AS Data, inserted.updated_at AS UpdatedAt;";
            return await connection.QuerySingleAsync<SiteContentRow>(sql, new { Key = key, Data = dataJson });
        }

        // Insert-only-if-absent, equivalent of onConflictDoNothing({ target: siteContent.key }).
        public async Task InsertIfMissingAsync(string key, string dataJson)
        {
            using var connection = _dbconn.CreateConnection();
            const string sql = @"
                IF NOT EXISTS (SELECT 1 FROM dbo.site_content WHERE [key] = @Key)
                    INSERT INTO dbo.site_content (id, [key], data) VALUES (NEWID(), @Key, @Data);";
            await connection.ExecuteAsync(sql, new { Key = key, Data = dataJson });
        }
    }
}