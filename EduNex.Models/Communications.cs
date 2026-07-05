using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    public class Announcement
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Image { get; set; } // full URL

        public DateTime AnnouncedDate { get; set; } = DateTime.UtcNow;

        public List<string> Content { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Cta Cta { get; set; }
        public List<ResourceMaterial> ResourceMaterials { get; set; } = new();
        public List<SubInformation> SubInformation { get; set; } = new();
    }

    public class News
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Image { get; set; } // full URL

        public DateTime PublishedDate { get; set; } = DateTime.UtcNow;
        public string Publisher { get; set; }

        public List<string> Content { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Cta? Cta { get; set; }
        public List<ResourceMaterial> ResourceMaterials { get; set; } = new();
        public List<SubInformation> SubInformation { get; set; } = new();
    }
    public class CreateNewsDto
    {
        public string Title { get; set; } = string.Empty;

        public string Publisher { get; set; } = string.Empty;

        public List<string> Content { get; set; } = new();

        public DateTime PublishedDate { get; set; }

        public List<ResourceMaterial> ResourceMaterials { get; set; } = new();

        public string? FeaturedImage { get; set; }

        public string? Image { get; set; }
    }
    public class Cta
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public List<CtaButton> Buttons { get; set; } = new();
    }

    public class CtaButton
    {
        public string ButtonName { get; set; }
        public string Href { get; set; }
    }

    public class ResourceMaterial
    {
        public string MaterialName { get; set; }
        public string FileType { get; set; }
        public long? FileSize { get; set; }
        public string Url { get; set; } // full URL or static path
    }

    public class SubInformation
    {
        public string Title { get; set; }
        public List<string> BulletPoints { get; set; } = new();
        public string Description { get; set; }
    }
}