using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduNex.Models
{

    public class Subscriber
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
    }
    public class FileUploadResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string Url { get; set; }
        public string Key { get; set; }
        public long Size { get; set; }
        public string Format { get; set; }
        public Guid public_id { get; set; }
        public string OriginalFileName { get; set; }
    }
    public class Advertisement
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public Guid? MediaId { get; set; }
        public string? LinkUrl { get; set; }
        public string? ButtonText { get; set; }
        public string? RedirectUrl { get; set; }
        public string Privacy { get; set; } = "all";
        public bool IsActive { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }

    public class Feedback
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public short Rating { get; set; }
        public string FeedbackText { get; set; } = string.Empty;
        public string? AdminReply { get; set; }
        public DateTimeOffset? RepliedAt { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
    public class CreateFeedbackRequest
    {
        [Required, StringLength(200, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, Range(1, 5)]
        public int Rating { get; set; }

        [Required, MinLength(5)]
        public string FeedbackText { get; set; } = string.Empty;
        public string? TurnstileToken { get; set; }
    }

    public class ReplyFeedbackRequest
    {
        [Required, StringLength(2000, MinimumLength = 1)]
        public string Reply { get; set; } = string.Empty;
    }

    public class ListFeedbackQuery
    {
        public int? Page { get; set; }
        public int? Limit { get; set; }
        public int? Rating { get; set; }
    }

    public class FeedbackStatsDto
    {
        public double AverageRating { get; set; }
        public int TotalFeedback { get; set; }
    }
    public class ListCategoriesQueryDto
    {
        public int? Page { get; set; }
        public int? Limit { get; set; }
    }

    public class CreateCategoryRequestDto
    {
        public string Name { get; set; } = "";
        public string? Description { get; set; }
    }

    public class UpdateCategoryRequestDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
    }

        public class CreateClassMaterialRequest
        {
            [Required, StringLength(200, MinimumLength = 2)]
            public string Title { get; set; } = string.Empty;

            public string? Description { get; set; }

            [Required]
            public Guid MediaId { get; set; }

            [Required]
            public Guid CourseId { get; set; }
        }

        // No null-clearing ambiguity on ANY field here (none of these are
        // .nullable() in the zod schema, only .optional()) - so "was this key
        // sent" and "should this go in the SQL SET clause" are the same
        // question. See IClassMaterialDal.UpdateAsync for the genuine partial
        // update this enables, unlike the merge-trick used elsewhere.
        public class UpdateClassMaterialRequest
        {
            [StringLength(200, MinimumLength = 2)]
            public string? Title { get; set; }

            public string? Description { get; set; }
            public Guid? MediaId { get; set; }
            public Guid? CourseId { get; set; }
        }

        // Strict validation here (matches z.coerce.number().int().positive()
        // .max(100) exactly) - unlike Announcements/Events' looser query schemas.
        public class ListMaterialsQuery
        {
            [Range(1, int.MaxValue)]
            public int? Page { get; set; }

            [Range(1, 100)]
            public int? Limit { get; set; }

            public string? Search { get; set; }
            public Guid? CourseId { get; set; }
        }

        // ---- Internal (joined) shapes - never serialized directly ---------------

        public class ClassMaterialDetailDto
        {
            public Guid Id { get; set; }
            public string Title { get; set; } = string.Empty;
            public string? Description { get; set; }
            public string? FileUrl { get; set; }
            public Guid? MediaId { get; set; }
            public Guid? CourseId { get; set; }
            public DateTimeOffset CreatedAt { get; set; }
            public DateTimeOffset UpdatedAt { get; set; }
            public MediaDetailDto? Media { get; set; }
            public CourseSummaryDto? Course { get; set; }
            public CreatedByDto? CreatedBy { get; set; }
        }

        public class MediaDetailDto
        {
            public Guid Id { get; set; }
            public string? Url { get; set; }
            public string? S3Key { get; set; }
            public string OriginalName { get; set; } = string.Empty;
            public string MimeType { get; set; } = string.Empty;
            public int Size { get; set; }
        }

        public class CourseSummaryDto
        {
            public Guid Id { get; set; }
            public string Title { get; set; } = string.Empty;
            public string Slug { get; set; } = string.Empty;
        }

        public class CreatedByDto
        {
            public Guid Id { get; set; }
            public string FirstName { get; set; } = string.Empty;
            public string LastName { get; set; } = string.Empty;
        }

        // Join-field carriers for Dapper multi-mapping - reuse
        // class_materials.media_id / .course_id / .created_by as the nested
        // objects' ids (same trick as MediaJoinFields elsewhere), so these
        // never need their own "id" column selected.
        public class MediaDetailJoinFields
        {
            public string? MediaUrl { get; set; }
            public string? MediaS3Key { get; set; }
            public string? MediaOriginalName { get; set; }
            public string? MediaMimeType { get; set; }
            public int? MediaSize { get; set; }
        }

        public class CourseSummaryJoinFields
        {
            public string? CourseTitle { get; set; }
            public string? CourseSlug { get; set; }
        }

        public class CreatedByJoinFields
        {
            public string? CreatedByFirstName { get; set; }
            public string? CreatedByLastName { get; set; }
        }

        // ---- Public response shapes ---------------------------------------------

        // sanitize()'d shape - NO FileUrl at all (clients must use the
        // download/view-url/stream endpoints), and Media is reduced to
        // SafeMediaDto (no url/s3Key ever exposed here).
        public class ClassMaterialResponseDto
        {
            public Guid Id { get; set; }
            public string Title { get; set; } = string.Empty;
            public string? Description { get; set; }
            public Guid? MediaId { get; set; }
            public Guid? CourseId { get; set; }
            public DateTimeOffset CreatedAt { get; set; }
            public DateTimeOffset UpdatedAt { get; set; }
            public SafeMediaDto? Media { get; set; }
            public CourseSummaryDto? Course { get; set; }
            public CreatedByDto? CreatedBy { get; set; }
        }

        public class SafeMediaDto
        {
            public Guid Id { get; set; }
            public string OriginalName { get; set; } = string.Empty;
            public string MimeType { get; set; } = string.Empty;
            public int Size { get; set; }
        }

        // create/update return the RAW un-joined row (stripFileUrl applied,
        // but no media/course/createdBy nesting at all) - same asymmetry
        // pattern as every other module converted so far in this project.
        public class ClassMaterialRawDto
        {
            public Guid Id { get; set; }
            public string Title { get; set; } = string.Empty;
            public string? Description { get; set; }
            public Guid? MediaId { get; set; }
            public Guid? CourseId { get; set; }
            public DateTimeOffset CreatedAt { get; set; }
            public DateTimeOffset UpdatedAt { get; set; }
        }

        public class DownloadResultDto
        {
            public string Url { get; set; } = string.Empty;
            public int ExpiresIn { get; set; }
        }

        public class ViewUrlResultDto
        {
            public string Url { get; set; } = string.Empty;
            public int ExpiresIn { get; set; }
            public string MimeType { get; set; } = string.Empty;
        }

        // Not JSON-serialized - the controller pipes Body directly as the
        // HTTP response with custom headers.
        public class StreamResultDto
        {
            public Stream Body { get; set; } = Stream.Null;
            public string FileName { get; set; } = string.Empty;
            public string MimeType { get; set; } = string.Empty;
            public long? ContentLength { get; set; }
        }

        public class ClassMaterialAddedMailData
        {
            public string Title { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string CourseName { get; set; } = string.Empty;
            public string PortalUrl { get; set; } = string.Empty;
        }
    
}
