using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    public enum UserRole
    {
        Admin,
        Teacher,
        User
    }

    public enum UserStatus
    {
        Unverified,
        Verified
    }

    public enum PlatformPreference
    {
        Online,
        Offline,
        AsPerCourse
    }

    public enum UserPlan
    {
        Full,
        Half,
        Free
    }
    public class UserAuthState
    {
        public Guid Id { get; set; }
        public bool IsBlocked { get; set; }
    }

    public class User
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "student";
        public string? Image { get; set; }
        public bool IsVerified { get; set; }
        public bool IsBlocked { get; set; }
        public bool LoginLocked { get; set; }
        public int FailedLoginAttempts { get; set; }
        public DateTimeOffset? LastLoginAt { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }


    public class UserExamPerformance
    {
        public Guid ExamId { get; set; }
        public string ExamName { get; set; }
        public int TotalQuestions { get; set; }
        public int CorrectAnswers { get; set; }
        public int UnAnsweredQuestions { get; set; }
        public decimal TotalMarksObtained { get; set; }
        public decimal TotalMarks { get; set; }
    }
}
