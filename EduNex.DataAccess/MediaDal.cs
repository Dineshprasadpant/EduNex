using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using EduNex.Api.DataAccess;
using EduNex.Models;
using Microsoft.Data.SqlClient;

namespace EduNex.DataAccess
{
    public interface IMediaDal
    {
        Task<(IEnumerable<MediaListRow> Data, int Total)> FindAllAsync(
            string? search, string? mimeType, int offset, int limit);
        Task<MediaListRow?> FindByIdAsync(Guid id);
        Task<MediaRow> CreateAsync(
            string filename, Guid id, string originalName, string mimeType, long size,
            string url, string? s3Key, Guid? uploadedBy);
        Task RemoveAsync(Guid id);
    }

    public class MediaDal(IDbConnectionFactory _dbconn) : IMediaDal
    {

        private const string JoinedSelect = @"
            SELECT
                m.id AS Id, m.filename AS Filename, m.original_name AS OriginalName,
                m.mime_type AS MimeType, m.size AS Size, m.url AS Url, m.s3_key AS S3Key,
                m.uploaded_by AS UploadedBy, m.created_at AS CreatedAt,
                u.first_name AS UploaderFirstName, u.last_name AS UploaderLastName
            FROM dbo.media m
            LEFT JOIN dbo.users u ON u.id = m.uploaded_by";

        public async Task<(IEnumerable<MediaListRow> Data, int Total)> FindAllAsync(
            string? search, string? mimeType, int offset, int limit)
        {
            using var conn = _dbconn.CreateConnection();

            var where = @"
                WHERE (@Search IS NULL OR m.original_name LIKE '%' + @Search + '%')
                  AND (@MimeType IS NULL OR m.mime_type LIKE '%' + @MimeType + '%')";

            var sql = $@"
                {JoinedSelect}
                {where}
                ORDER BY m.created_at DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

                SELECT COUNT(*) FROM dbo.media m
                {where};";

            var parameters = new
            {
                Search = string.IsNullOrWhiteSpace(search) ? null : search,
                MimeType = string.IsNullOrWhiteSpace(mimeType) ? null : mimeType,
                Offset = offset,
                Limit = limit
            };

            using var multi = await conn.QueryMultipleAsync(sql, parameters);
            var data = await multi.ReadAsync<MediaListRow>();
            var total = await multi.ReadFirstAsync<int>();
            return (data, total);
        }

        public async Task<MediaListRow?> FindByIdAsync(Guid id)
        {
            using var conn = _dbconn.CreateConnection();
            var sql = $"{JoinedSelect} WHERE m.id = @Id;";
            return await conn.QueryFirstOrDefaultAsync<MediaListRow>(sql, new { Id = id });
        }

        public async Task<MediaRow> CreateAsync(
            string filename, Guid id, string originalName, string mimeType, long size,
            string url, string? s3Key, Guid? uploadedBy)
        {
            using var conn = _dbconn.CreateConnection();
            const string sql = @"
                INSERT INTO dbo.media (id,filename, original_name, mime_type, size, url, s3_key, uploaded_by)
                OUTPUT INSERTED.id AS Id, INSERTED.filename AS Filename,
                       INSERTED.original_name AS OriginalName, INSERTED.mime_type AS MimeType,
                       INSERTED.size AS Size, INSERTED.url AS Url, INSERTED.s3_key AS S3Key,
                       INSERTED.uploaded_by AS UploadedBy, INSERTED.created_at AS CreatedAt
                VALUES (@Id,@Filename, @OriginalName, @MimeType, @Size, @Url, @S3Key, @UploadedBy);";

            return await conn.QuerySingleAsync<MediaRow>(sql, new
            {
                Id=id,
                Filename = filename,
                OriginalName = originalName,
                MimeType = mimeType,
                Size = size,
                Url = url,
                S3Key = s3Key,
                UploadedBy = uploadedBy
            });
        }

        public async Task RemoveAsync(Guid id)
        {
            using var conn = _dbconn.CreateConnection();
            await conn.ExecuteAsync("DELETE FROM dbo.media WHERE id = @Id", new { Id = id });
        }
    }
}