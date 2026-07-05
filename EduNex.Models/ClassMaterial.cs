using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    public class ClassMaterial
    {
        public Guid Id { get; set; }

        [JsonPropertyName("material_id")]
        public string ExternalMaterialId { get; set; }

        public string Title { get; set; }
        public string Description { get; set; }

        [JsonPropertyName("file_url")]
        public string FileUrl { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        [JsonPropertyName("batches")]
        public List<Guid> BatchIds { get; set; } = new();

        [JsonIgnore]
        public List<BatchRef> Batches { get; set; } = new();
    }

    public class BatchRef
    {
        public Guid Id { get; set; }
        public string BatchName { get; set; }
    }
}