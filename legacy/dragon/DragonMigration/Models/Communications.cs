using System;
using System.Collections.Generic;

namespace Dragon.Models
{
    public class Announcement
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Image { get; set; }
        public DateTime AnnouncedDate { get; set; } = DateTime.UtcNow;
        public List<string> Content { get; set; } = new List<string>();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Relationships / Nested (mapped to tables)
        public Cta Cta { get; set; }
        public List<ResourceMaterial> ResourceMaterials { get; set; } = new List<ResourceMaterial>();
        public List<SubInformation> SubInformation { get; set; } = new List<SubInformation>();
    }

    public class News
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Image { get; set; }
        public DateTime PublishedDate { get; set; } = DateTime.UtcNow;
        public string Publisher { get; set; }
        public List<string> Content { get; set; } = new List<string>();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Relationships / Nested
        public Cta Cta { get; set; }
        public List<ResourceMaterial> ResourceMaterials { get; set; } = new List<ResourceMaterial>();
        public List<SubInformation> SubInformation { get; set; } = new List<SubInformation>();
    }

    public class Cta
    {
        public string Title { get; set; }
        public string ImageUrl { get; set; } // Specific to News CTA
        public string Description { get; set; }
        public List<CtaButton> Buttons { get; set; } = new List<CtaButton>();
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
        public string Url { get; set; }
    }

    public class SubInformation
    {
        public string Title { get; set; }
        public List<string> BulletPoints { get; set; } = new List<string>();
        public string Description { get; set; }
    }
}
