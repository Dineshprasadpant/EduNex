// ============================================================================
// Dragon Institute - Dapper POCO Models
// Matches dragon_institute_sqlexpress.sql exactly (31 tables).
//
// IMPORTANT - required one-time setup for Dapper to map snake_case columns
// (first_name, created_at, ...) onto these PascalCase properties (FirstName,
// CreatedAt, ...). Add this ONCE at application startup (e.g. top of
// Program.cs, before the app runs):
//
//     Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;
//
// Without this line, Dapper will silently leave PascalCase properties as
// null/default because it only does exact/case-insensitive matches by
// default. This single flag makes every model below work with plain
// "SELECT * FROM table_name" style queries with no column aliasing needed.
//
// Nullability follows the SQL schema exactly: NOT NULL columns are
// non-nullable C# types, nullable columns use ? (Guid?, string?, etc.)
// ============================================================================

using System;

namespace EduNex.Models
{

    public class Media
    {
        public Guid Id { get; set; }
        public string Filename { get; set; } = string.Empty;
        public string OriginalName { get; set; } = string.Empty;
        public string MimeType { get; set; } = string.Empty;
        public int Size { get; set; }
        public string Url { get; set; } = string.Empty;
        public string? S3Key { get; set; }
        public Guid? UploadedBy { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class Category
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }

 
    public class TeacherProfile
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string? Bio { get; set; }
        public string? Specialization { get; set; }
        public bool EnableDisplayInAbout { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }

    public class StudentProfile
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Plan { get; set; } = "free";
        public Guid? CourseId { get; set; }
        public string? PaymentImage { get; set; }
        public string? CitizenshipCertificate { get; set; }
        public bool InitialVerification { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }

    public class TeacherCourse
    {
        public Guid Id { get; set; }
        public Guid TeacherProfileId { get; set; }
        public Guid CourseId { get; set; }
        public DateTimeOffset AssignedAt { get; set; }
    }
   

    public class EventResource
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public Guid MediaId { get; set; }
    }

    public class GalleryItem
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string MediaType { get; set; } = "image";
        public string MediaUrl { get; set; } = string.Empty;
        public Guid? MediaId { get; set; }
        public string? ThumbnailUrl { get; set; }
        public Guid? ThumbnailMediaId { get; set; }
        // Maps to the [position] column (bracketed in SQL because
        // POSITION is a reserved-ish word); MatchNamesWithUnderscores
        // still matches "position" -> "Position" with no issue.
        public int Position { get; set; }
        public bool IsActive { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }

 

    public class SiteContent
    {
        public Guid Id { get; set; }
        // Maps to the [key] column (bracketed in SQL, reserved word).
        public string Key { get; set; } = string.Empty;
        // Was jsonb in Postgres; stored as NVARCHAR(MAX) JSON text here.
        // Deserialize with System.Text.Json as needed by caller.
        public string Data { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }


    public class ContactMessage
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = "pending";
        public string? AdminReply { get; set; }
        public DateTimeOffset? RepliedAt { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }

   

    public class RefreshToken
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTimeOffset ExpiresAt { get; set; }
        public bool IsRevoked { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class ActiveSession
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public string SessionToken { get; set; } = string.Empty;
        public string? PagePath { get; set; }
        public DateTimeOffset LastSeen { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
    }

    public class UserPayment
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string PaymentImageUrl { get; set; } = string.Empty;
        public string? Amount { get; set; }
        public string? Note { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class AnalyticsDaily
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public int TotalVisitors { get; set; }
        public int TotalPageViews { get; set; }
        public int NewRegistrations { get; set; }
        public int PlanFree { get; set; }
        public int PlanHalf { get; set; }
        public int PlanFull { get; set; }
        public int SubscribersGained { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class AnalyticsUtmSource
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public string Source { get; set; } = string.Empty;
        public int Visits { get; set; }
    }

    // No surrogate Id - composite primary key (session_token, page_path, date)
    public class AnalyticsPageView
    {
        public string SessionToken { get; set; } = string.Empty;
        public string PagePath { get; set; } = string.Empty;
        public DateTime Date { get; set; }
    }

    // No surrogate Id - composite primary key (session_token, date)
    public class AnalyticsVisitorSession
    {
        public string SessionToken { get; set; } = string.Empty;
        public DateTime Date { get; set; }
    }
}
