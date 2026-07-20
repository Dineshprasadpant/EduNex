using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using EduNex.Api.DataAccess;
using EduNex.Models;
using Microsoft.Data.SqlClient;

namespace EduNex.DataAccess
{
    public interface IGalleryDal
    {
        Task<(IEnumerable<GalleryItemJoinedRow> Data, int Total)> FindAllAsync(bool? isActive, int limit, int offset);
        Task<GalleryItemJoinedRow?> FindByIdAsync(Guid id);
        Task<GalleryItemRow> CreateAsync(GalleryItemRow data);
        Task<GalleryItemRow?> UpdateAsync(Guid id, UpdateGalleryRequest patch);
        Task RemoveAsync(Guid id);
    }

    public class GalleryDal(IDbConnectionFactory _dbconn) : IGalleryDal
    {

        private const string JoinedSelect = @"
            SELECT
                g.id AS Id, g.title AS Title, g.description AS Description,
                g.media_type AS MediaType, g.media_url AS MediaUrl, g.media_id AS MediaId,
                g.thumbnail_url AS ThumbnailUrl, g.thumbnail_media_id AS ThumbnailMediaId,
                g.[position] AS Position, g.is_active AS IsActive,
                g.created_at AS CreatedAt, g.updated_at AS UpdatedAt,
                im.url AS ItemMediaUrl, im.filename AS ItemMediaFilename, im.mime_type AS ItemMediaMimeType,
                tm.url AS ThumbMediaUrl, tm.filename AS ThumbMediaFilename, tm.mime_type AS ThumbMediaMimeType
            FROM dbo.gallery_items g
            LEFT JOIN dbo.media im ON im.id = g.media_id
            LEFT JOIN dbo.media tm ON tm.id = g.thumbnail_media_id";

        public async Task<(IEnumerable<GalleryItemJoinedRow> Data, int Total)> FindAllAsync(
            bool? isActive, int limit, int offset)
        {
            using var conn = _dbconn.CreateConnection();

            const string where = "WHERE (@IsActive IS NULL OR g.is_active = @IsActive)";

            var sql = $@"
                {JoinedSelect}
                {where}
                ORDER BY g.[position] ASC, g.created_at DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

                SELECT COUNT(*) FROM dbo.gallery_items g
                {where};";

            using var multi = await conn.QueryMultipleAsync(sql, new { IsActive = isActive, Offset = offset, Limit = limit });
            var data = await multi.ReadAsync<GalleryItemJoinedRow>();
            var total = await multi.ReadFirstAsync<int>();
            return (data, total);
        }

        public async Task<GalleryItemJoinedRow?> FindByIdAsync(Guid id)
        {
            using var conn = _dbconn.CreateConnection();
            var sql = $"{JoinedSelect} WHERE g.id = @Id;";
            return await conn.QueryFirstOrDefaultAsync<GalleryItemJoinedRow>(sql, new { Id = id });
        }

        public async Task<GalleryItemRow> CreateAsync(GalleryItemRow data)
        {
            using var conn = _dbconn.CreateConnection();
            const string sql = @"
                INSERT INTO dbo.gallery_items
                    (title, description, media_type, media_url, media_id,
                     thumbnail_url, thumbnail_media_id, [position], is_active)
                OUTPUT INSERTED.id AS Id, INSERTED.title AS Title, INSERTED.description AS Description,
                       INSERTED.media_type AS MediaType, INSERTED.media_url AS MediaUrl,
                       INSERTED.media_id AS MediaId, INSERTED.thumbnail_url AS ThumbnailUrl,
                       INSERTED.thumbnail_media_id AS ThumbnailMediaId, INSERTED.[position] AS Position,
                       INSERTED.is_active AS IsActive, INSERTED.created_at AS CreatedAt,
                       INSERTED.updated_at AS UpdatedAt
                VALUES (@Title, @Description, @MediaType, @MediaUrl, @MediaId,
                        @ThumbnailUrl, @ThumbnailMediaId, @Position, @IsActive);";

            return await conn.QuerySingleAsync<GalleryItemRow>(sql, new
            {
                data.Title,
                data.Description,
                data.MediaType,
                data.MediaUrl,
                data.MediaId,
                data.ThumbnailUrl,
                data.ThumbnailMediaId,
                data.Position,
                data.IsActive
            });
        }

        public async Task<GalleryItemRow?> UpdateAsync(Guid id, UpdateGalleryRequest patch)
        {
            var sets = new List<string> { "updated_at = SYSDATETIMEOFFSET()" };
            var parameters = new DynamicParameters();
            parameters.Add("Id", id);

            if (patch.Title != null) { sets.Add("title = @Title"); parameters.Add("Title", patch.Title); }
            if (patch.Description != null) { sets.Add("description = @Description"); parameters.Add("Description", patch.Description); }
            if (patch.MediaType != null) { sets.Add("media_type = @MediaType"); parameters.Add("MediaType", patch.MediaType); }
            if (patch.MediaUrl != null) { sets.Add("media_url = @MediaUrl"); parameters.Add("MediaUrl", patch.MediaUrl); }
            if (patch.MediaId.HasValue) { sets.Add("media_id = @MediaId"); parameters.Add("MediaId", patch.MediaId); }
            if (patch.ThumbnailUrl != null) { sets.Add("thumbnail_url = @ThumbnailUrl"); parameters.Add("ThumbnailUrl", patch.ThumbnailUrl); }
            if (patch.ThumbnailMediaId.HasValue) { sets.Add("thumbnail_media_id = @ThumbnailMediaId"); parameters.Add("ThumbnailMediaId", patch.ThumbnailMediaId); }
            if (patch.Position.HasValue) { sets.Add("[position] = @Position"); parameters.Add("Position", patch.Position); }
            if (patch.IsActive.HasValue) { sets.Add("is_active = @IsActive"); parameters.Add("IsActive", patch.IsActive); }

            using var conn = _dbconn.CreateConnection();
            var sql = $@"
                UPDATE dbo.gallery_items SET {string.Join(", ", sets)}
                OUTPUT INSERTED.id AS Id, INSERTED.title AS Title, INSERTED.description AS Description,
                       INSERTED.media_type AS MediaType, INSERTED.media_url AS MediaUrl,
                       INSERTED.media_id AS MediaId, INSERTED.thumbnail_url AS ThumbnailUrl,
                       INSERTED.thumbnail_media_id AS ThumbnailMediaId, INSERTED.[position] AS Position,
                       INSERTED.is_active AS IsActive, INSERTED.created_at AS CreatedAt,
                       INSERTED.updated_at AS UpdatedAt
                WHERE id = @Id;";

            return await conn.QueryFirstOrDefaultAsync<GalleryItemRow>(sql, parameters);
        }

        public async Task RemoveAsync(Guid id)
        {
            using var conn = _dbconn.CreateConnection();
            await conn.ExecuteAsync("DELETE FROM dbo.gallery_items WHERE id = @Id", new { Id = id });
        }
    }
}