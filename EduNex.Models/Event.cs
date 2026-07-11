using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    public class Event
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = "Other";
        public DateTimeOffset EventDate { get; set; }
        public string? Address { get; set; }
        public string Privacy { get; set; } = "public";
        public Guid? CourseId { get; set; }
        public string? Image { get; set; }
        public Guid? MediaId { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        public List<ResourceMaterial>? ResourceMaterials { get; set; }
        public List<ExtraInformation>? ExtraInformation { get; set; }

    }
    public class EventMain
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        
        public string Title { get; set; }
        public string Description { get; set; }
        
        [JsonPropertyName("event_type")]
        public string EventType { get; set; } = "Other";
        
        public string Month { get; set; }
        public string Year { get; set; }
        
        [JsonPropertyName("start_date")]
        public DateTime StartDate { get; set; }
        
        [JsonPropertyName("end_date")]
        public DateTime EndDate { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
        
        [JsonPropertyName("updatedAt")]
        public DateTime UpdatedAt { get; set; }

        // Nested Structures
        public Organizer Organizer { get; set; } = new Organizer();
        public Venue Venue { get; set; } = new Venue();
        public List<ResourceMaterial> ResourceMaterials { get; set; } = new List<ResourceMaterial>();
        public List<ExtraInformation> ExtraInformation { get; set; } = new List<ExtraInformation>();
    }

    public class Organizer
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
    }

    public class Venue
    {
        public string Name { get; set; }
        public string Address { get; set; }
    }

    public class ExtraInformation
    {
        public string Title { get; set; }
        public string Description { get; set; }
    }
}
