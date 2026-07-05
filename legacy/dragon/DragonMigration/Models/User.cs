using System;
using System.Collections.Generic;

namespace Dragon.Models
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

    public class User
    {
        public Guid Id { get; set; }
        public string Fullname { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string PasswordHash { get; set; }
        public UserRole Role { get; set; }
        public UserStatus Status { get; set; } = UserStatus.Unverified;
        public PlatformPreference? PlatformPreference { get; set; }
        public Guid? BatchId { get; set; }
        public Guid CourseEnrolledId { get; set; }
        public string CitizenshipImageUrl { get; set; }
        public List<string> PaymentImages { get; set; } = new List<string>();
        public string PlanUpgradedFrom { get; set; }
        public UserPlan Plan { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public List<UserExamPerformance> ExamsAttended { get; set; } = new List<UserExamPerformance>();
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
