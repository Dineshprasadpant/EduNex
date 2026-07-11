using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace EduNex.Models
{
    // ---- Requests -----------------------------------------------------------

    public class CreateAnnouncementRequest
    {
        [Required, StringLength(300, MinimumLength = 3)]
        public string Title { get; set; } = string.Empty;

        [Required, MinLength(1, ErrorMessage = "Description is required")]
        public string Description { get; set; } = string.Empty;

        // No [Url] - the zod schema is a plain optional string here,
        // unlike some other modules' image fields.
        public string? Image { get; set; }

        public Guid? MediaId { get; set; }

        [RegularExpression("^(public|enrolled)$")]
        public string Privacy { get; set; } = "public";

        public Guid? CourseId { get; set; }
        public List<Guid>? ResourceMediaIds { get; set; }
    }

    public class UpdateAnnouncementRequest
    {
        [StringLength(300, MinimumLength = 3)]
        public string? Title { get; set; }

        public string? Description { get; set; }
        public string? Image { get; set; }
        public Guid? MediaId { get; set; }

        [RegularExpression("^(public|enrolled)$")]
        public string? Privacy { get; set; }

        public Guid? CourseId { get; set; }

        // null = key omitted, don't touch announcement_resources at all.
        // non-null (including empty list) = key was present, replace the
        // full resource set. This distinction is exactly what the TS
        // `data.resourceMediaIds !== undefined` check relies on, and it
        // falls out of ASP.NET's JSON binding for free here.
        public List<Guid>? ResourceMediaIds { get; set; }
    }

    // No [Range] on Page/Limit and no [RegularExpression] on Privacy here -
    // on purpose. The TS listAnnouncementsSchema has no extra refinement
    // beyond z.coerce.number() (rejects non-numeric, but not 0/negative)
    // and a bare z.string() for privacy (any value passes through as a
    // literal filter - matches happen to return zero rows for a bogus
    // value, no error). Non-numeric Page/Limit still 422s here via
    // ASP.NET's own int? binding failure, which lines up with zod's
    // number-coercion rejection.
    public class ListAnnouncementsQuery
    {
        public int? Page { get; set; }
        public int? Limit { get; set; }
        public string? Search { get; set; }
        public string? Privacy { get; set; }
    }

    // ---- Responses ------------------------------------------------------

    // Shaped/joined shape used by list - nested Media, no Resources.
    public class AnnouncementDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Image { get; set; }
        public Guid? MediaId { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Privacy { get; set; } = string.Empty;
        public Guid? CourseId { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        public MediaSummaryDto? Media { get; set; }
    }

    // Adds Resources - used by getById only, same asymmetry pattern as
    // Courses' base/full split and Users' list/getById split.
    public class AnnouncementDetailDto : AnnouncementDto
    {
        public List<AnnouncementResourceDto> Resources { get; set; } = new();
    }

    public class AnnouncementResourceDto
    {
        public Guid Id { get; set; }
        public Guid MediaId { get; set; }
        public string Url { get; set; } = string.Empty;
        public string Filename { get; set; } = string.Empty;
        public string OriginalName { get; set; } = string.Empty;
        public string MimeType { get; set; } = string.Empty;
        public int Size { get; set; }
    }

    public class AnnouncementEmailPayload
    {
        public string Title { get; set; } = string.Empty;
        public List<string> Content { get; set; } = new();
        public string AnnouncedDate { get; set; } = string.Empty;
    }
}