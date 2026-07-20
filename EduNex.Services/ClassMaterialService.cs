using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using EduNex.Common;
using EduNex.DataAccess;
using EduNex.Models;
using Microsoft.Extensions.Configuration;

namespace EduNex.Services
{
    public interface IClassMaterialService
    {
        Task<(List<ClassMaterialResponseDto> Data, int Total, int Page, int Limit)> ListAsync(
            Guid userId, string userRole, ListMaterialsQuery query);
        Task<ClassMaterialResponseDto> GetByIdAsync(Guid userId, string userRole, Guid id);
        Task<ClassMaterialRawDto> CreateAsync(CreateClassMaterialRequest input, Guid createdBy);
        Task<ClassMaterialRawDto> UpdateAsync(Guid id, UpdateClassMaterialRequest input);
        Task DeleteAsync(Guid id);
        Task<DownloadResultDto> DownloadAsync(Guid userId, string userRole, Guid id);
        Task<ViewUrlResultDto> ViewUrlAsync(Guid userId, string userRole, Guid id);
        Task<StreamResultDto> StreamAsync(Guid userId, string userRole, Guid id);
    }

    public class ClassMaterialService : IClassMaterialService
    {
        private static readonly HashSet<string> PrivilegedRoles = new() { "admin", "teacher" };
        private const int DownloadUrlTtlSeconds = 300;
        private const int ViewUrlTtlSeconds = 60 * 60;

        private readonly IClassMaterialDal _repo;
        private readonly IMediaDal _mediaRepo;
        private readonly ICourseDal _courseRepo;
        private readonly IFileService _fileStorage;
        private readonly IMailService _mail;
        private readonly string _frontendUrl;

        public ClassMaterialService(
            IClassMaterialDal repo,
            IMediaDal mediaRepo,
            ICourseDal courseRepo,
            IFileService fileStorage,
            IMailService mail,
            IConfiguration configuration)
        {
            _repo = repo;
            _mediaRepo = mediaRepo;
            _courseRepo = courseRepo;
            _fileStorage = fileStorage;
            _mail = mail;
            _frontendUrl = configuration["Frontend:Url"] ?? string.Empty;
        }


        public async Task<(List<ClassMaterialResponseDto> Data, int Total, int Page, int Limit)> ListAsync(
            Guid userId, string userRole, ListMaterialsQuery query)
        {
            var page = Math.Max(1, query.Page ?? 1);
            var limit = Math.Min(100, Math.Max(1, query.Limit ?? 10));
            var offset = (page - 1) * limit;

            var (courseIdFilter, emptyForStudent) = await ResolveCourseFilterAsync(userId, userRole, query.CourseId);

            if (emptyForStudent)
                return (new List<ClassMaterialResponseDto>(), 0, page, limit);

            var (rows, total) = await _repo.FindAllAsync(query.Search, courseIdFilter, limit, offset);
            return (rows.Select(Sanitize).ToList(), total, page, limit);
        }

        private async Task<(Guid? CourseId, bool EmptyForStudent)> ResolveCourseFilterAsync(
            Guid userId, string userRole, Guid? requested)
        {
            if (PrivilegedRoles.Contains(userRole))
                return (requested, false);

            var studentCourseId = await _repo.FindStudentCourseIdAsync(userId);
            if (!studentCourseId.HasValue)
                return (null, true);


            return (studentCourseId, false);
        }

        public async Task<ClassMaterialResponseDto> GetByIdAsync(Guid userId, string userRole, Guid id)
        {
            var material = await _repo.FindDetailByIdAsync(id) ?? throw new NotFoundException("Class material not found");
            await AssertCanAccessAsync(userId, userRole, material);
            return Sanitize(material);
        }

        private async Task AssertCanAccessAsync(Guid userId, string userRole, ClassMaterialDetailDto material)
        {
            if (PrivilegedRoles.Contains(userRole)) return;

            var studentCourseId = await _repo.FindStudentCourseIdAsync(userId);
            if (!material.CourseId.HasValue || material.CourseId != studentCourseId)
                throw new ForbiddenException("You do not have access to this material");
        }


        public async Task<DownloadResultDto> DownloadAsync(Guid userId, string userRole, Guid id)
        {
            var (mediaItem, _) = await LoadAccessibleMediaAsync(userId, userRole, id);

            if (!string.IsNullOrEmpty(mediaItem.S3Key))
            {
                var url = await _fileStorage.GetPresignedDownloadUrlAsync(mediaItem.S3Key, DownloadUrlTtlSeconds, mediaItem.OriginalName);
                return new DownloadResultDto { Url = url, ExpiresIn = DownloadUrlTtlSeconds };
            }

            return new DownloadResultDto { Url = mediaItem.Url ?? string.Empty, ExpiresIn = DownloadUrlTtlSeconds };
        }

        public async Task<ViewUrlResultDto> ViewUrlAsync(Guid userId, string userRole, Guid id)
        {
            var (mediaItem, _) = await LoadAccessibleMediaAsync(userId, userRole, id);

            if (!string.IsNullOrEmpty(mediaItem.S3Key))
            {
                var url = await _fileStorage.GetPresignedViewUrlAsync(mediaItem.S3Key, ViewUrlTtlSeconds, mediaItem.MimeType);
                return new ViewUrlResultDto { Url = url, ExpiresIn = ViewUrlTtlSeconds, MimeType = mediaItem.MimeType };
            }

            return new ViewUrlResultDto { Url = mediaItem.Url ?? string.Empty, ExpiresIn = ViewUrlTtlSeconds, MimeType = mediaItem.MimeType };
        }

        public async Task<StreamResultDto> StreamAsync(Guid userId, string userRole, Guid id)
        {
            var (mediaItem, _) = await LoadAccessibleMediaAsync(userId, userRole, id);

            // Unlike download/viewUrl, stream has NO legacy-url fallback -
            // it specifically needs the S3 object.
            if (string.IsNullOrEmpty(mediaItem.S3Key))
                throw new NotFoundException("Underlying media not found");

            var stream = await _fileStorage.GetObjectStreamAsync(mediaItem.S3Key);
            return new StreamResultDto
            {
                Body = stream.Body,
                FileName = mediaItem.OriginalName,
                MimeType = mediaItem.MimeType,
                ContentLength = stream.ContentLength
            };
        }

        // Shared by download/viewUrl/stream: fetch material, check access,
        // then RE-FETCH media independently via mediaRepository (not the
        // joined material.Media) - matches the source's explicit comment
        // ("Re-read media so we get s3Key/url even if the join shape ever
        // changes").
        private async Task<(MediaListRow MediaItem, ClassMaterialDetailDto Material)> LoadAccessibleMediaAsync(
            Guid userId, string userRole, Guid id)
        {
            var material = await _repo.FindDetailByIdAsync(id) ?? throw new NotFoundException("Class material not found");
            await AssertCanAccessAsync(userId, userRole, material);

            if (!material.MediaId.HasValue)
                throw new NotFoundException("No file attached to this material");

            var mediaItem = await _mediaRepo.FindByIdAsync(material.MediaId.Value)
                ?? throw new NotFoundException("Underlying media not found");

            return (mediaItem, material);
        }

        // ---- Crud ----------------------------------------------------------

        public async Task<ClassMaterialRawDto> CreateAsync(CreateClassMaterialRequest input, Guid createdBy)
        {
            var mediaItem = await _mediaRepo.FindByIdAsync(input.MediaId)
                ?? throw new BadRequestException("Selected media not found");

            if (await _courseRepo.FindByIdAsync(input.CourseId) == null)
                throw new BadRequestException("Selected course not found");

            var row = await _repo.CreateAsync(new ClassMaterial
            {
                Title = input.Title,
                Description = input.Description,
                MediaId = input.MediaId,
                CourseId = input.CourseId,
                // Stored for legacy compatibility only - never returned to clients.
                FileUrl = mediaItem.Url,
                CreatedBy = createdBy
            });

            NotifyEnrolledStudents(row.Title, row.Description, input.CourseId);

            return ToRawDto(row);
        }

        public async Task<ClassMaterialRawDto> UpdateAsync(Guid id, UpdateClassMaterialRequest input)
        {
            // Existence check only - matches `if (!existing) throw
            // NotFoundError` before building the patch.
            if(await _repo.FindDetailByIdAsync(id) == null)
                throw new NotFoundException("Class material not found");

            string? newFileUrl = null;
            if (input.MediaId.HasValue)
            {
                var mediaItem = await _mediaRepo.FindByIdAsync(input.MediaId.Value)
                    ?? throw new BadRequestException("Selected media not found");
                newFileUrl = mediaItem.Url;
            }

            if (input.CourseId.HasValue && (await _courseRepo.FindByIdAsync(input.CourseId.Value)) == null)
                throw new BadRequestException("Selected course not found");

            var row = await _repo.UpdateAsync(id, input, newFileUrl)
                ?? throw new NotFoundException("Class material not found");

            return ToRawDto(row);
        }

        public async Task DeleteAsync(Guid id)
        {
            if(await _repo.FindDetailByIdAsync(id) == null)
                throw new NotFoundException("Class material not found");
            await _repo.RemoveAsync(id);
        }

        // ---- Notification ----------------------------------------------

        // Fire-and-forget - matches `void (async () => {...})()`, not
        // awaited by CreateAsync's caller. mailService itself swallows
        // send errors in the source; this wrapper's try/catch covers the
        // lookup step too, same as materialNotificationService.
        private void NotifyEnrolledStudents(string title, string? description, Guid courseId)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    var emailsTask = _repo.FindEnrolledEmailsByCourseAsync(courseId);
                    var courseTask = _courseRepo.FindByIdAsync(courseId);
                    await Task.WhenAll(emailsTask, courseTask);

                    var emails = emailsTask.Result;
                    if (emails.Count == 0) return;

                    var portalUrl = $"{_frontendUrl.TrimEnd('/')}/dashboard/class-materials";

                    await _mail.SendClassMaterialAddedAsync(emails, new ClassMaterialAddedMailData
                    {
                        Title = title,
                        Description = Truncate(StripHtml(description), 300),
                        CourseName = courseTask.Result?.Title ?? "your course",
                        PortalUrl = portalUrl
                    });
                }
                catch
                {
                    // Silent - notifications are best-effort.
                }
            });
        }

        private static string StripHtml(string? s) =>
            string.IsNullOrEmpty(s) ? "" : Regex.Replace(s, "<[^>]*>", "").Trim();

        private static string Truncate(string s, int max) =>
            s.Length <= max ? s : $"{s[..max].TrimEnd()}…";

        // ---- Mapping -----------------------------------------------------

        // sanitize() equivalent: drops FileUrl entirely, reduces Media to
        // SafeMediaDto (no url/s3Key ever exposed here).
        private static ClassMaterialResponseDto Sanitize(ClassMaterialDetailDto m) => new()
        {
            Id = m.Id,
            Title = m.Title,
            Description = m.Description,
            MediaId = m.MediaId,
            CourseId = m.CourseId,
            CreatedAt = m.CreatedAt,
            UpdatedAt = m.UpdatedAt,
            Media = m.Media != null
                ? new SafeMediaDto
                {
                    Id = m.Media.Id,
                    OriginalName = m.Media.OriginalName,
                    MimeType = m.Media.MimeType,
                    Size = m.Media.Size
                }
                : null,
            Course = m.Course,
            CreatedBy = m.CreatedBy
        };

        // create/update return the raw un-joined row (stripFileUrl applied,
        // no media/course/createdBy nesting at all) - same asymmetry
        // pattern seen across every other module converted so far.
        private static ClassMaterialRawDto ToRawDto(ClassMaterial m) => new()
        {
            Id = m.Id,
            Title = m.Title,
            Description = m.Description,
            MediaId = m.MediaId,
            CourseId = m.CourseId,
            CreatedAt = m.CreatedAt,
            UpdatedAt = m.UpdatedAt
        };
    }
}