using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    public class MediaRow
    {
        public Guid Id { get; set; }
        public string Filename { get; set; } = default!;
        public string OriginalName { get; set; } = default!;
        public string MimeType { get; set; } = default!;
        public long Size { get; set; }
        public string Url { get; set; } = default!;
        public string? S3Key { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public Guid? UploadedBy { get; set; }
    }

    public class MediaListRow : MediaRow
    {
        public string? UploaderFirstName { get; set; }
        public string? UploaderLastName { get; set; }
    }

    public class UploadedByDto
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("firstName")] public string FirstName { get; set; } = "";
        [JsonPropertyName("lastName")] public string LastName { get; set; } = "";
    }

    // Nested shape -- mirrors mediaRepository.selectShape, used by
    // list/getById in the Node code.
    public class MediaDto
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("filename")] public string Filename { get; set; } = default!;
        [JsonPropertyName("originalName")] public string OriginalName { get; set; } = default!;
        [JsonPropertyName("mimeType")] public string MimeType { get; set; } = default!;
        [JsonPropertyName("size")] public long Size { get; set; }
        [JsonPropertyName("url")] public string Url { get; set; } = default!;
        [JsonPropertyName("s3Key")] public string? S3Key { get; set; }
        [JsonPropertyName("createdAt")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("uploadedBy")] public UploadedByDto? UploadedBy { get; set; }
    }

    // Flat shape -- mirrors mediaRepository.create's raw .returning() row
    // in Node (uploadedBy is a bare id there, NOT the nested object).
    // Intentionally inconsistent with MediaDto to match Node's actual
    // behavior (create() doesn't re-join to users).
    public class MediaCreatedDto
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("filename")] public string Filename { get; set; } = default!;
        [JsonPropertyName("originalName")] public string OriginalName { get; set; } = default!;
        [JsonPropertyName("mimeType")] public string MimeType { get; set; } = default!;
        [JsonPropertyName("size")] public long Size { get; set; }
        [JsonPropertyName("url")] public string Url { get; set; } = default!;
        [JsonPropertyName("s3Key")] public string? S3Key { get; set; }
        [JsonPropertyName("createdAt")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("uploadedBy")] public Guid? UploadedBy { get; set; }
    }

    public class CreateMediaRequest
    {
        [Required, MinLength(1)] public string Filename { get; set; } = default!;
        [Required, MinLength(1)] public string OriginalName { get; set; } = default!;
        [Required, MinLength(1)] public string MimeType { get; set; } = default!;
        [Range(1, long.MaxValue)] public long Size { get; set; }
        [Required, Url] public string Url { get; set; } = default!;
        public string? S3Key { get; set; }
    }

    // Shared MIME/size policy for uploads that should behave like the
    // Node files.controller multer config (used by the /files/upload
    // endpoint that backs media creation). Local-disk equivalent of
    // Node's S3-backed upload -- no bucket, just wwwroot.
    public static class MediaUploadPolicy
    {
        public const long MaxFileSizeBytes = 50 * 1024 * 1024; // 50 MB

        public static readonly string[] AllowedMimeTypes =
        {
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "application/pdf",
            "video/mp4", "video/webm",
            "audio/mpeg", "audio/wav",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
    }
}