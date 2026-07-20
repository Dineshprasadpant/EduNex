using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    // ===================================================================
    // Raw DB row shapes (Dapper targets)
    // ===================================================================

    // Flat, double-joined row (galleryItems + item_media alias + thumb_media
    // alias) -- kept flat rather than using Dapper multi-mapping to avoid
    // splitOn ambiguity between two joins to the same table.
    public class GalleryItemJoinedRow
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = default!;
        public string? Description { get; set; }
        public string MediaType { get; set; } = default!;
        public string MediaUrl { get; set; } = default!;
        public Guid? MediaId { get; set; }
        public string? ThumbnailUrl { get; set; }
        public Guid? ThumbnailMediaId { get; set; }
        public int Position { get; set; }
        public bool IsActive { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }

        public string? ItemMediaUrl { get; set; }
        public string? ItemMediaFilename { get; set; }
        public string? ItemMediaMimeType { get; set; }

        public string? ThumbMediaUrl { get; set; }
        public string? ThumbMediaFilename { get; set; }
        public string? ThumbMediaMimeType { get; set; }
    }

    // Raw, un-joined row returned by INSERT/UPDATE .returning() equivalents.
    public class GalleryItemRow
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = default!;
        public string? Description { get; set; }
        public string MediaType { get; set; } = default!;
        public string MediaUrl { get; set; } = default!;
        public Guid? MediaId { get; set; }
        public string? ThumbnailUrl { get; set; }
        public Guid? ThumbnailMediaId { get; set; }
        public int Position { get; set; }
        public bool IsActive { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }


    public class GalleryMediaRefDto
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("url")] public string? Url { get; set; }
        [JsonPropertyName("filename")] public string? Filename { get; set; }
        [JsonPropertyName("mimeType")] public string? MimeType { get; set; }
    }

    public class GalleryItemDto
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("title")] public string Title { get; set; } = default!;
        [JsonPropertyName("description")] public string? Description { get; set; }
        [JsonPropertyName("mediaType")] public string MediaType { get; set; } = default!;
        [JsonPropertyName("mediaUrl")] public string MediaUrl { get; set; } = default!;
        [JsonPropertyName("mediaId")] public Guid? MediaId { get; set; }
        [JsonPropertyName("thumbnailUrl")] public string? ThumbnailUrl { get; set; }
        [JsonPropertyName("thumbnailMediaId")] public Guid? ThumbnailMediaId { get; set; }
        [JsonPropertyName("position")] public int Position { get; set; }
        [JsonPropertyName("isActive")] public bool IsActive { get; set; }
        [JsonPropertyName("createdAt")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("updatedAt")] public DateTimeOffset UpdatedAt { get; set; }
        [JsonPropertyName("media")] public GalleryMediaRefDto? Media { get; set; }
        [JsonPropertyName("thumbnailMedia")] public GalleryMediaRefDto? ThumbnailMedia { get; set; }
    }

    // create/update shape -- raw row, no nested media (matches the
    // asymmetry seen in every other module: mutating endpoints return the
    // un-joined row).
    public class GalleryItemRawDto
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("title")] public string Title { get; set; } = default!;
        [JsonPropertyName("description")] public string? Description { get; set; }
        [JsonPropertyName("mediaType")] public string MediaType { get; set; } = default!;
        [JsonPropertyName("mediaUrl")] public string MediaUrl { get; set; } = default!;
        [JsonPropertyName("mediaId")] public Guid? MediaId { get; set; }
        [JsonPropertyName("thumbnailUrl")] public string? ThumbnailUrl { get; set; }
        [JsonPropertyName("thumbnailMediaId")] public Guid? ThumbnailMediaId { get; set; }
        [JsonPropertyName("position")] public int Position { get; set; }
        [JsonPropertyName("isActive")] public bool IsActive { get; set; }
        [JsonPropertyName("createdAt")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("updatedAt")] public DateTimeOffset UpdatedAt { get; set; }
    }

    // ===================================================================
    // Inbound request DTOs -- mirror gallery.schema.ts
    // ===================================================================

    public class CreateGalleryRequest
    {
        [Required, MinLength(1, ErrorMessage = "Title required"), MaxLength(200)]
        public string Title { get; set; } = default!;

        public string? Description { get; set; }

        [Required, RegularExpression("^(image|video)$")]
        public string MediaType { get; set; } = default!;

        [Required, MinLength(1, ErrorMessage = "Media is required")]
        public string MediaUrl { get; set; } = default!;

        public Guid? MediaId { get; set; }
        public string? ThumbnailUrl { get; set; }
        public Guid? ThumbnailMediaId { get; set; }
        public int? Position { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateGalleryRequest
    {
        [MinLength(1), MaxLength(200)]
        public string? Title { get; set; }

        public string? Description { get; set; }

        [RegularExpression("^(image|video)$")]
        public string? MediaType { get; set; }

        [MinLength(1)]
        public string? MediaUrl { get; set; }

        public Guid? MediaId { get; set; }
        public string? ThumbnailUrl { get; set; }
        public Guid? ThumbnailMediaId { get; set; }
        public int? Position { get; set; }
        public bool? IsActive { get; set; }
    }
}