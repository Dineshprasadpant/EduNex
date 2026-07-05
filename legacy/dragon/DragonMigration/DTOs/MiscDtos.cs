using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Dragon.DTOs
{
    // --- Announcements ---
    public class AnnouncementDto
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public string Title { get; set; }
        public List<string> Content { get; set; }
        public DateTime AnnouncedDate { get; set; }
        public string Image { get; set; }
    }

    public class AnnouncementResponseDto
    {
        [JsonPropertyName("data")]
        public AnnouncementDataDto Data { get; set; }
    }

    public class AnnouncementDataDto
    {
        public int Total { get; set; }
        public int Page { get; set; }
        public int Limit { get; set; }
        public IEnumerable<AnnouncementDto> Announcements { get; set; }
    }

    // --- Advertisements ---
    public class AdvertisementDto
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string ImageUrl { get; set; }
        public string LinkUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class AdvertisementResponseDto
    {
        public int TotalObjects { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
        public IEnumerable<AdvertisementDto> CurrentObjects { get; set; }
    }

    // --- Feedback ---
    public class FeedbackDto
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public int Rating { get; set; }
        public string Feedback { get; set; } // Note: property name is 'feedback' in Node
        public DateTime CreatedAt { get; set; }
    }

    // --- Subscriber ---
    public class SubscriberDto
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public string Email { get; set; }
    }
}
