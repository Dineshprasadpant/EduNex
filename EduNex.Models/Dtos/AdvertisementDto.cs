using System;
using System.ComponentModel.DataAnnotations;

namespace EduNex.Models
{

    public class AdvertisementDto
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

        // Populated only on list/get-by-id (joined query); null on create,
        // matching the TS repository's behavior.
        public MediaSummaryDto? Media { get; set; }
    }

    // Used internally by Dapper's multi-mapping for the media half of the
    // joined row - has no Id of its own; the DAL reuses advertisements.media_id
    // as the media's id, same trick the TS repository's shapeRow() uses.
    public class MediaJoinFields
    {
        public string? MediaUrl { get; set; }
        public string? MediaFilename { get; set; }
        public string? MediaMimeType { get; set; }
    }

    // ---- Request shapes -------------------------------------------------------

    public class CreateAdvertisementRequest
    {
        [Required]
        [StringLength(200, MinimumLength = 2)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? ImageUrl { get; set; }

        public Guid? MediaId { get; set; }

        [Url]
        public string? LinkUrl { get; set; }

        [StringLength(100)]
        public string? ButtonText { get; set; }

        [Url]
        public string? RedirectUrl { get; set; }

        // Allowed values: "all" (everyone) / "guests" (non-authenticated only)
        [RegularExpression("^(all|guests)$", ErrorMessage = "Privacy must be 'all' or 'guests'.")]
        public string Privacy { get; set; } = "all";

        public bool IsActive { get; set; } = true;
    }

    public class UpdateAdvertisementRequest
    {
        [StringLength(200, MinimumLength = 2)]
        public string? Title { get; set; }

        public string? Description { get; set; }

        public string? ImageUrl { get; set; }

        public Guid? MediaId { get; set; }

        [Url]
        public string? LinkUrl { get; set; }

        [StringLength(100)]
        public string? ButtonText { get; set; }

        [Url]
        public string? RedirectUrl { get; set; }

        [RegularExpression("^(all|guests)$", ErrorMessage = "Privacy must be 'all' or 'guests'.")]
        public string? Privacy { get; set; }

        public bool? IsActive { get; set; }
    }

    public class ListAdvertisementsQuery
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 10;
        public bool? IsActive { get; set; }
    }
}