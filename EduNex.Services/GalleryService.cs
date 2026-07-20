using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EduNex.DataAccess;
using EduNex.Models;

namespace EduNex.Services
{
    public interface IGalleryService
    {
        Task<(IEnumerable<GalleryItemDto> Data, PaginationMeta Meta)> ListAsync(int page, int limit, bool? isActive);
        Task<GalleryItemDto?> GetByIdAsync(Guid id);
        Task<GalleryItemRawDto> CreateAsync(CreateGalleryRequest input);
        Task<GalleryItemRawDto?> UpdateAsync(Guid id, UpdateGalleryRequest input);
        Task<bool> RemoveAsync(Guid id);
    }

    public class GalleryService : IGalleryService
    {
        private readonly IGalleryDal _dal;
        public GalleryService(IGalleryDal dal) => _dal = dal;

        public async Task<(IEnumerable<GalleryItemDto>, PaginationMeta)> ListAsync(int page, int limit, bool? isActive)
        {
            page = Math.Max(1, page);
            limit = Math.Max(1, limit);
            var offset = (page - 1) * limit;

            var (rows, total) = await _dal.FindAllAsync(isActive, limit, offset);
            var data = rows.Select(MapDto);
            return (data, PaginationMeta.Create(total, page, limit));
        }

        public async Task<GalleryItemDto?> GetByIdAsync(Guid id)
        {
            var row = await _dal.FindByIdAsync(id);
            return row == null ? null : MapDto(row);
        }

        public async Task<GalleryItemRawDto> CreateAsync(CreateGalleryRequest input)
        {
            var row = await _dal.CreateAsync(new GalleryItemRow
            {
                Title = input.Title,
                Description = input.Description,
                MediaType = input.MediaType,
                MediaUrl = input.MediaUrl,
                MediaId = input.MediaId,
                ThumbnailUrl = input.ThumbnailUrl,
                ThumbnailMediaId = input.ThumbnailMediaId,
                Position = input.Position ?? 0,
                IsActive = input.IsActive
            });

            return MapRawDto(row);
        }

        public async Task<GalleryItemRawDto?> UpdateAsync(Guid id, UpdateGalleryRequest input)
        {
            var existing = await _dal.FindByIdAsync(id);
            if (existing == null) return null;

            var updated = await _dal.UpdateAsync(id, input);
            return updated == null ? null : MapRawDto(updated);
        }

        public async Task<bool> RemoveAsync(Guid id)
        {
            var existing = await _dal.FindByIdAsync(id);
            if (existing == null) return false;

            await _dal.RemoveAsync(id);
            return true;
        }

        private static GalleryItemDto MapDto(GalleryItemJoinedRow r) => new()
        {
            Id = r.Id,
            Title = r.Title,
            Description = r.Description,
            MediaType = r.MediaType,
            MediaUrl = r.MediaUrl,
            MediaId = r.MediaId,
            ThumbnailUrl = r.ThumbnailUrl,
            ThumbnailMediaId = r.ThumbnailMediaId,
            Position = r.Position,
            IsActive = r.IsActive,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
            Media = r.MediaId.HasValue
                ? new GalleryMediaRefDto
                {
                    Id = r.MediaId.Value,
                    Url = r.ItemMediaUrl,
                    Filename = r.ItemMediaFilename,
                    MimeType = r.ItemMediaMimeType
                }
                : null,
            ThumbnailMedia = r.ThumbnailMediaId.HasValue
                ? new GalleryMediaRefDto
                {
                    Id = r.ThumbnailMediaId.Value,
                    Url = r.ThumbMediaUrl,
                    Filename = r.ThumbMediaFilename,
                    MimeType = r.ThumbMediaMimeType
                }
                : null
        };

        private static GalleryItemRawDto MapRawDto(GalleryItemRow r) => new()
        {
            Id = r.Id,
            Title = r.Title,
            Description = r.Description,
            MediaType = r.MediaType,
            MediaUrl = r.MediaUrl,
            MediaId = r.MediaId,
            ThumbnailUrl = r.ThumbnailUrl,
            ThumbnailMediaId = r.ThumbnailMediaId,
            Position = r.Position,
            IsActive = r.IsActive,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        };
    }
}