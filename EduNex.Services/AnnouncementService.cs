using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using EduNex.Common;
using EduNex.DataAccess;
using EduNex.Models;

namespace EduNex.Services
{
    public interface IAnnouncementService
    {
        Task<Announcement> CreateAsync(CreateAnnouncementRequest input);
        Task<(List<AnnouncementDto> Data, int Total, int Page, int Limit)> ListAsync(
            ListAnnouncementsQuery query, (Guid UserId, string Role)? requester);
        Task<AnnouncementDetailDto> GetByIdAsync(Guid id, (Guid UserId, string Role)? requester);
        Task<Announcement> UpdateAsync(Guid id, UpdateAnnouncementRequest input);
        Task DeleteAsync(Guid id);
    }

    public class AnnouncementService : IAnnouncementService
    {
        private readonly IAnnouncementDal _repo;
        private readonly IMailService _mail;

        public AnnouncementService(IAnnouncementDal repo, IMailService mail)
        {
            _repo = repo;
            _mail = mail;
        }

        public async Task<Announcement> CreateAsync(CreateAnnouncementRequest input)
        {
            var announcement = await _repo.CreateAsync(new Announcement
            {
                Title = input.Title,
                Description = input.Description,
                Image = input.Image,
                MediaId = input.MediaId,
                Privacy = input.Privacy ?? "public",
                CourseId = input.CourseId
            }, input.ResourceMediaIds);

            NotifyAfterCreate(input);

            return announcement;
        }

        // Fire-and-forget - NOT awaited by CreateAsync's caller, matching
        // `void (async () => {...})()` in the source. Errors are swallowed
        // silently (announcement emails are best-effort).
        private void NotifyAfterCreate(CreateAnnouncementRequest input)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    var payload = BuildEmailPayload(input);

                    var emails = input.Privacy == "enrolled" && input.CourseId.HasValue
                        ? await _repo.GetEnrolledUserEmailsAsync(input.CourseId.Value)
                        : await _repo.GetAllUserEmailsAsync();

                    if (emails.Count == 0) return;

                    await _mail.SendAnnouncementAsync(emails, payload);
                }
                catch
                {
                    // Silent - announcement emails are best-effort.
                }
            });
        }

        private static AnnouncementEmailPayload BuildEmailPayload(CreateAnnouncementRequest input)
        {
            var stripped = Regex.Replace(input.Description, "<[^>]*>", "");
            var content = stripped.Length > 200 ? stripped[..200] : stripped;

            return new AnnouncementEmailPayload
            {
                Title = input.Title,
                Content = new List<string> { content },
                AnnouncedDate = DateTimeOffset.UtcNow.ToString("O")
            };
        }

        public async Task<(List<AnnouncementDto> Data, int Total, int Page, int Limit)> ListAsync(
            ListAnnouncementsQuery query, (Guid UserId, string Role)? requester)
        {
            var page = Math.Max(1, query.Page ?? 1);
            var limit = Math.Min(100, Math.Max(1, query.Limit ?? 10));
            var offset = (page - 1) * limit;

            var filters = new AnnouncementFilters { Search = query.Search };

            // Server-side scoping: admins/teachers see everything; students
            // see public + their-course; anonymous callers see only public.
            // The student's courseId is derived from their session, never
            // trusted from the query, so a client can't peek at another
            // course's items.
            if (requester?.Role == "admin" || requester?.Role == "teacher")
            {
                if (!string.IsNullOrEmpty(query.Privacy))
                    filters.Privacy = query.Privacy;
            }
            else if (requester?.Role == "student")
            {
                var courseId = await _repo.FindStudentCourseIdAsync(requester.Value.UserId);
                if (courseId.HasValue)
                    filters.EnrolledCourseId = courseId;
                else
                    filters.Privacy = "public";
            }
            else
            {
                filters.Privacy = "public";
            }

            var (data, total) = await _repo.FindAllAsync(filters, limit, offset);
            return (data, total, page, limit);
        }

        public async Task<AnnouncementDetailDto> GetByIdAsync(Guid id, (Guid UserId, string Role)? requester)
        {
            var announcement = await _repo.FindByIdAsync(id) ?? throw new NotFoundException("Announcement not found");

            if (announcement.Privacy == "public") return announcement;
            if (requester?.Role == "admin" || requester?.Role == "teacher") return announcement;

            if (requester == null)
                throw new ForbiddenException("Sign in to view this announcement");

            // Enrolled-with-no-courseId: any authenticated student is fine.
            if (!announcement.CourseId.HasValue && requester.Value.Role == "student")
                return announcement;

            // Enrolled-for-specific-course: caller must be in that course.
            if (announcement.CourseId.HasValue && requester.Value.Role == "student")
            {
                var courseId = await _repo.FindStudentCourseIdAsync(requester.Value.UserId);
                if (courseId == announcement.CourseId) return announcement;
            }

            throw new ForbiddenException("You do not have access to this announcement");
        }

        public async Task<Announcement> UpdateAsync(Guid id, UpdateAnnouncementRequest input)
        {
            var existing = await _repo.FindByIdAsync(id) ?? throw new NotFoundException("Announcement not found");

            // Merge-then-full-update for scalar fields (same documented
            // trade-off as the other modules: can't explicitly null out a
            // nullable field this way). ResourceMediaIds bypasses this
            // entirely - see IAnnouncementDal.UpdateAsync.
            var merged = new Announcement
            {
                Title = input.Title ?? existing.Title,
                Description = input.Description ?? existing.Description,
                Image = input.Image ?? existing.Image,
                MediaId = input.MediaId ?? existing.MediaId,
                Privacy = input.Privacy ?? existing.Privacy,
                CourseId = input.CourseId ?? existing.CourseId
            };

            return await _repo.UpdateAsync(id, merged, input.ResourceMediaIds)
                ?? throw new NotFoundException("Announcement not found");
        }

        public async Task DeleteAsync(Guid id)
        {
            var res = await _repo.FindByIdAsync(id); 
            if(res == null)
                throw new NotFoundException("Announcement not found");
            await _repo.RemoveAsync(id);
        }
    }
}