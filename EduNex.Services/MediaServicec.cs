using System;
using System.Linq;
using System.Threading.Tasks;
using EduNex.DataAccess;
using EduNex.Models;

namespace EduNex.Services
{
    public interface IMediaService
    {
        Task<(System.Collections.Generic.IEnumerable<MediaDto> Data, PaginationMeta Meta)> ListMediaAsync(
            int page, int limit, string? search, string? mimeType);
        Task<MediaDto?> GetByIdAsync(Guid id);
        Task<MediaCreatedDto> CreateMediaAsync(CreateMediaRequest input, Guid? uploadedBy);
        Task<bool> DeleteMediaAsync(Guid id);
    }

    public class MediaService : IMediaService
    {
        private readonly IMediaDal _dal;
        private readonly IFileService _fileService;

        public MediaService(IMediaDal dal, IFileService fileService)
        {
            _dal = dal;
            _fileService = fileService;
        }

        public async Task<(System.Collections.Generic.IEnumerable<MediaDto>, PaginationMeta)> ListMediaAsync(
            int page, int limit, string? search, string? mimeType)
        {
            page = Math.Max(1, page);
            limit = Math.Min(100, Math.Max(1, limit));
            var offset = (page - 1) * limit;

            var (rows, total) = await _dal.FindAllAsync(search, mimeType, offset, limit);
            var data = rows.Select(MapDto);
            return (data, PaginationMeta.Create(total, page, limit));
        }

        public async Task<MediaDto?> GetByIdAsync(Guid id)
        {
            var row = await _dal.FindByIdAsync(id);
            return row == null ? null : MapDto(row);
        }

        public async Task<MediaCreatedDto> CreateMediaAsync(CreateMediaRequest input, Guid? uploadedBy)
        {
            var row = await _dal.CreateAsync(
                input.Filename, Guid.NewGuid(), input.OriginalName, input.MimeType, input.Size,
                input.Url, input.S3Key, uploadedBy);

            return new MediaCreatedDto
            {
                Id = row.Id,
                Filename = row.Filename,
                OriginalName = row.OriginalName,
                MimeType = row.MimeType,
                Size = row.Size,
                Url = row.Url,
                S3Key = row.S3Key,
                CreatedAt = row.CreatedAt,
                UploadedBy = row.UploadedBy
            };
        }

        public async Task<bool> DeleteMediaAsync(Guid id)
        {
            var item = await _dal.FindByIdAsync(id);
            if (item == null) return false;

            if (!string.IsNullOrWhiteSpace(item.S3Key))
            {
                // best-effort, same as Node's .catch(() => {})
                try { await _fileService.DeleteFileAsync(item.S3Key); }
                catch { /* ignore cleanup errors */ }
            }

            await _dal.RemoveAsync(id);
            return true;
        }

        private static MediaDto MapDto(MediaListRow r) => new()
        {
            Id = r.Id,
            Filename = r.Filename,
            OriginalName = r.OriginalName,
            MimeType = r.MimeType,
            Size = r.Size,
            Url = r.Url,
            S3Key = r.S3Key,
            CreatedAt = r.CreatedAt,
            UploadedBy = r.UploadedBy != null
                ? new UploadedByDto
                {
                    Id = r.UploadedBy.Value,
                    FirstName = r.UploaderFirstName ?? "",
                    LastName = r.UploaderLastName ?? ""
                }
                : null
        };
    }
}