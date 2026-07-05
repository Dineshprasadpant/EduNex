using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    public class ClassMaterial
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        
        [JsonPropertyName("material_id")]
        public string MaterialId { get; set; }
        
        public string Title { get; set; }
        public string Description { get; set; }
        
        [JsonPropertyName("file_url")]
        public string FileUrl { get; set; }
        
        [JsonPropertyName("batches")]
        public List<Guid> BatchIds { get; set; } = new List<Guid>();
        
        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }
        
        [JsonPropertyName("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // Navigation for populated views
        [JsonPropertyName("populatedBatches")]
        public List<BatchRef> PopulatedBatches { get; set; } = new List<BatchRef>();
    }
}
