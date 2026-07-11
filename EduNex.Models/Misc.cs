using System;
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
}
