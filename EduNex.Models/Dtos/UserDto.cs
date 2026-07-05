using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    // Nested objects for populated fields
    public class BatchRefDto
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        [JsonPropertyName("batch_name")]
        public string BatchName { get; set; }
    }

    public class CourseRefDto
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        [JsonPropertyName("title")]
        public string Title { get; set; }
    }

    public class updateUserDto
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public string Fullname { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Role { get; set; }
        public string Status { get; set; }
        public string Plan { get; set; }
        public string Batch { get; set; }
    }
    public class UserDto
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        public string Fullname { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Role { get; set; }
        public string Status { get; set; }
        public string Plan { get; set; }
        
        [JsonPropertyName("batch")]
        public object Batch { get; set; } // Can be Guid or BatchRefDto
        
        [JsonPropertyName("courseEnrolled")]
        public object? CourseEnrolled { get; set; } // Can be Guid or CourseRefDto
        
        public string? CitizenshipImageUrl { get; set; }
        
        [JsonPropertyName("paymentImage")]
        public List<List<string>>?PaymentImage { get; set; } // Matches [[String]]
        
        public string? PlanUpgradedFrom { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AuthResponseDto
    {
        public bool Success { get; set; }
        public string Token { get; set; }
        public UserDto User { get; set; }
    }
    public class UserLoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
    public class UserRegistrationDto
    {
        public string Fullname { get; set; }
        public string? Role { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Password { get; set; }
        public string Plan { get; set; }
        public Guid CourseEnrolled { get; set; }
        public string CitizenshipImageUrl { get; set; }
        public string? PlatformPreference { get; set; }
    }
}
