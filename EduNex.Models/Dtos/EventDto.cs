using System;
using System.Collections.Generic;

namespace EduNex.Models
{
    public static class PrivacyType
    {
        public const string Public = "public";
        public const string Enrolled = "enrolled";
    }

 

    public class MediaSummaryDto
    {
        public Guid Id { get; set; }
        public string Url { get; set; } = "";
        public string Filename { get; set; } = "";
        public string MimeType { get; set; } = "";
    }

    public class EventResourceDto
    {
        public Guid Id { get; set; }
        public Guid MediaId { get; set; }
        public string Url { get; set; } = "";
        public string Filename { get; set; } = "";
        public string OriginalName { get; set; } = "";
        public string MimeType { get; set; } = "";
        public int Size { get; set; }
    }

    // Shaped response -- equivalent of shapeRow() in events.repository.ts:
    // flat media_* columns nested into `Media`, plus `Resources` populated
    // only by findById (null/omitted for list rows).
    public class EventDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string Category { get; set; } = "";
        public DateTimeOffset EventDate { get; set; }
        public string? Address { get; set; }
        public string Privacy { get; set; } = PrivacyType.Public;
        public Guid? CourseId { get; set; }
        public string? Image { get; set; }
        public Guid? MediaId { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        public MediaSummaryDto? Media { get; set; }
        public List<EventResourceDto>? Resources { get; set; }
    }

    // Payload for the fire-and-forget "new public event" notification --
    // matches the shape mailService.sendEvent expects in mail.service.ts.
    public class EventMailPayload
    {
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string StartDate { get; set; } = "";
        public string EndDate { get; set; } = "";
        public string VenueName { get; set; } = "";
        public string VenueAddress { get; set; } = "";
        public string EventType { get; set; } = "";
    }

    // ---- request DTOs ----
    public class ListEventsQueryDto
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 10;
        public string? Privacy { get; set; }
        public string? Search { get; set; }
    }

    public class CreateEventRequestDto
    {
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string Category { get; set; } = "Other";
        public DateTimeOffset EventDate { get; set; }
        public string? Address { get; set; }
        public string Privacy { get; set; } = PrivacyType.Public;
        public Guid? CourseId { get; set; }
        public string? Image { get; set; }
        public Guid? MediaId { get; set; }
        public List<Guid>? ResourceMediaIds { get; set; }
    }

    // All-optional partial update. Same omitted-vs-explicitly-null caveat
    // as the exams module's UpdateExamRequestDto: a plain Guid?/string?
    // can't distinguish "not sent" from "explicitly cleared" for CourseId/
    // MediaId. Not solved here -- flagging it again since events.repository.ts's
    // `data.courseId !== undefined` check relies on exactly that distinction.
    public class UpdateEventRequestDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Category { get; set; }
        public DateTimeOffset? EventDate { get; set; }
        public string? Address { get; set; }
        public string? Privacy { get; set; }
        public Guid? CourseId { get; set; }
        public string? Image { get; set; }
        public Guid? MediaId { get; set; }
        public List<Guid>? ResourceMediaIds { get; set; }
    }
}