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
    public interface IAdvertisementDal
    {
        Task<PagedResult<AdvertisementDto>> GetAllAsync(bool? isActive, int page, int limit, int offset);
        Task<AdvertisementDto?> GetByIdAsync(Guid id);
        Task<bool> ExistsAsync(Guid id);
        Task<AdvertisementDto> CreateAsync(CreateAdvertisementRequest input);
        Task<AdvertisementDto?> UpdateAsync(Guid id, UpdateAdvertisementRequest input);
        Task DeleteAsync(Guid id);
    }

    public class AdvertisementDal : IAdvertisementDal
    {
        private readonly string _connectionString;

        public AdvertisementDal(string connectionString)
        {
            _connectionString = connectionString;
        }

        private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

        public async Task<PagedResult<AdvertisementDto>> GetAllAsync(bool? isActive, int page, int limit, int offset)
        {
            using IDbConnection db = CreateConnection();

            var whereClause = isActive.HasValue ? "WHERE a.is_active = @IsActive" : "";


            var rowsSql = $@"
                SELECT
                    a.id, a.title, a.description, a.image_url, a.media_id, a.link_url,
                    a.button_text, a.redirect_url, a.privacy, a.is_active, a.created_at, a.updated_at,
                    m.url AS media_url, m.filename AS media_filename, m.mime_type AS media_mime_type
                FROM dbo.advertisements a
                LEFT JOIN dbo.media m ON m.id = a.media_id
                {whereClause}
                ORDER BY a.created_at DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

            var countSql = $"SELECT COUNT(*) FROM dbo.advertisements a {whereClause};";

            var rows = await db.QueryAsync<AdvertisementDto, MediaJoinFields, AdvertisementDto>(
                rowsSql,
                (ad, mediaFields) => AttachMedia(ad, mediaFields),
                new { IsActive = isActive, Offset = offset, Limit = limit },
                splitOn: "media_url"
            );

            var total = await db.ExecuteScalarAsync<int>(countSql, new { IsActive = isActive });

            return new PagedResult<AdvertisementDto>
            {
                Data = rows.ToList(),
                Total = total
            };
        }

        public async Task<AdvertisementDto?> GetByIdAsync(Guid id)
        {
            using IDbConnection db = CreateConnection();

            const string sql = @"
                SELECT
                    a.id, a.title, a.description, a.image_url, a.media_id, a.link_url,
                    a.button_text, a.redirect_url, a.privacy, a.is_active, a.created_at, a.updated_at,
                    m.url AS media_url, m.filename AS media_filename, m.mime_type AS media_mime_type
                FROM dbo.advertisements a
                LEFT JOIN dbo.media m ON m.id = a.media_id
                WHERE a.id = @Id;";

            var rows = await db.QueryAsync<AdvertisementDto, MediaJoinFields, AdvertisementDto>(
                sql,
                (ad, mediaFields) => AttachMedia(ad, mediaFields),
                new { Id = id },
                splitOn: "media_url"
            );

            return rows.SingleOrDefault();
        }

        public async Task<bool> ExistsAsync(Guid id)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "SELECT COUNT(1) FROM dbo.advertisements WHERE id = @Id";
            var count = await db.ExecuteScalarAsync<int>(sql, new { Id = id });
            return count > 0;
        }

        public async Task<AdvertisementDto> CreateAsync(CreateAdvertisementRequest input)
        {
            using IDbConnection db = CreateConnection();

            var id = Guid.NewGuid();
            var now = DateTimeOffset.UtcNow;

            const string sql = @"
                INSERT INTO dbo.advertisements
                    (id, title, description, image_url, media_id, link_url, button_text,
                     redirect_url, privacy, is_active, created_at, updated_at)
                VALUES
                    (@Id, @Title, @Description, @ImageUrl, @MediaId, @LinkUrl, @ButtonText,
                     @RedirectUrl, @Privacy, @IsActive, @CreatedAt, @UpdatedAt);";

            await db.ExecuteAsync(sql, new
            {
                Id = id,
                input.Title,
                input.Description,
                input.ImageUrl,
                input.MediaId,
                input.LinkUrl,
                input.ButtonText,
                input.RedirectUrl,
                input.Privacy,
                input.IsActive,
                CreatedAt = now,
                UpdatedAt = now
            });

            // No media join here - mirrors the TS repository, which returns the
            // raw inserted row from .returning() without a join.
            return new AdvertisementDto
            {
                Id = id,
                Title = input.Title,
                Description = input.Description,
                ImageUrl = input.ImageUrl,
                MediaId = input.MediaId,
                LinkUrl = input.LinkUrl,
                ButtonText = input.ButtonText,
                RedirectUrl = input.RedirectUrl,
                Privacy = input.Privacy,
                IsActive = input.IsActive,
                CreatedAt = now,
                UpdatedAt = now,
                Media = null
            };
        }

        public async Task<AdvertisementDto?> UpdateAsync(Guid id, UpdateAdvertisementRequest input)
        {
            using IDbConnection db = CreateConnection();

            var existing = await GetByIdAsync(id);
            if (existing is null) return null;

            var updatedAt = DateTimeOffset.UtcNow;

            const string sql = @"
                UPDATE dbo.advertisements
                SET title = @Title,
                    description = @Description,
                    image_url = @ImageUrl,
                    media_id = @MediaId,
                    link_url = @LinkUrl,
                    button_text = @ButtonText,
                    redirect_url = @RedirectUrl,
                    privacy = @Privacy,
                    is_active = @IsActive,
                    updated_at = @UpdatedAt
                WHERE id = @Id;";

            await db.ExecuteAsync(sql, new
            {
                Id = id,
                Title = input.Title ?? existing.Title,
                Description = input.Description ?? existing.Description,
                ImageUrl = input.ImageUrl ?? existing.ImageUrl,
                MediaId = input.MediaId ?? existing.MediaId,
                LinkUrl = input.LinkUrl ?? existing.LinkUrl,
                ButtonText = input.ButtonText ?? existing.ButtonText,
                RedirectUrl = input.RedirectUrl ?? existing.RedirectUrl,
                Privacy = input.Privacy ?? existing.Privacy,
                IsActive = input.IsActive ?? existing.IsActive,
                UpdatedAt = updatedAt
            });

            return await GetByIdAsync(id);
        }

        public async Task DeleteAsync(Guid id)
        {
            using IDbConnection db = CreateConnection();
            const string sql = "DELETE FROM dbo.advertisements WHERE id = @Id";
            await db.ExecuteAsync(sql, new { Id = id });
        }

        // Reuses advertisements.media_id as the nested Media object's Id,
        // same approach as the TS repository's shapeRow(). Media stays null
        // when there's no media_id (LEFT JOIN produced no match).
        private static AdvertisementDto AttachMedia(AdvertisementDto ad, MediaJoinFields mediaFields)
        {
            ad.Media = ad.MediaId.HasValue
                ? new MediaSummaryDto
                {
                    Id = ad.MediaId.Value,
                    Url = mediaFields.MediaUrl,
                    Filename = mediaFields.MediaFilename,
                    MimeType = mediaFields.MediaMimeType
                }
                : null;
            return ad;
        }
    }
}