using System.ComponentModel.DataAnnotations;

namespace EduNex.Models
{
    public class ListUsersQuery
    {
        [Range(1, int.MaxValue, ErrorMessage = "Page must be a positive integer.")]
        public int? Page { get; set; }

        [Range(1, 100, ErrorMessage = "Limit must be between 1 and 100.")]
        public int? Limit { get; set; }

        [RegularExpression("^(student|teacher|admin)$", ErrorMessage = "Role must be student, teacher, or admin.")]
        public string? Role { get; set; }

        public string? Search { get; set; }

        public string? IsVerified { get; set; }
    }
    public class CreateUserRequest
    {
        [Required, StringLength(100, MinimumLength = 2)]
        public string FirstName { get; set; } = string.Empty;

        [Required, StringLength(100, MinimumLength = 2)]
        public string LastName { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, StringLength(30, MinimumLength = 10)]
        public string Phone { get; set; } = string.Empty;

        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required, RegularExpression("^(student|teacher)$", ErrorMessage = "Role must be student or teacher.")]
        public string Role { get; set; } = string.Empty;

        public bool? IsVerified { get; set; }
        public string? Image { get; set; }

        [RegularExpression("^(free|half|paid)$")]
        public string? Plan { get; set; }
        public Guid? CourseId { get; set; }
        public string? PaymentImage { get; set; }
        public string? CitizenshipCertificate { get; set; }
        public string? Bio { get; set; }
        [StringLength(200)]
        public string? Specialization { get; set; }
        public bool? EnableDisplayInAbout { get; set; }
        public List<Guid>? CourseIds { get; set; }
    }

    public class UpdateUserRequest
    {
        [StringLength(100, MinimumLength = 2)]
        public string? FirstName { get; set; }

        [StringLength(100, MinimumLength = 2)]
        public string? LastName { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        [StringLength(30, MinimumLength = 10)]
        public string? Phone { get; set; }

        public string? Image { get; set; }
        public bool? IsVerified { get; set; }
        public bool? IsBlocked { get; set; }
        public bool? LoginLocked { get; set; }

        // student fields
        [RegularExpression("^(free|half|paid)$")]
        public string? Plan { get; set; }
        public Guid? CourseId { get; set; }
        public string? PaymentImage { get; set; }
        public string? CitizenshipCertificate { get; set; }

        // teacher fields
        public string? Bio { get; set; }
        [StringLength(200)]
        public string? Specialization { get; set; }
        public bool? EnableDisplayInAbout { get; set; }
        public List<Guid>? CourseIds { get; set; }
    }

    public class ResetPasswordRequest
    {
        [Required, MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class BlockUserRequest
    {
        [Required]
        public bool Blocked { get; set; }
    }

    public class UpdateProfileRequest
    {
        public string? Bio { get; set; }
        [StringLength(200)]
        public string? Specialization { get; set; }
    }

    public class UpdateEnrollmentRequest
    {
        public Guid? CourseId { get; set; }
        public string? PaymentImage { get; set; }
        public string? CitizenshipCertificate { get; set; }
    }

  
    public class UserListItemDto
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Image { get; set; }
        public bool IsVerified { get; set; }
        public bool IsBlocked { get; set; }
        public bool LoginLocked { get; set; }
        public DateTimeOffset? LastLoginAt { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }

    public class TeacherProfileWithCoursesDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string? Bio { get; set; }
        public string? Specialization { get; set; }
        public bool EnableDisplayInAbout { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        public List<TeacherCourseDto> Courses { get; set; } = new();
    }

    public class TeacherProfileDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string? Bio { get; set; }
        public string? Specialization { get; set; }
        public bool EnableDisplayInAbout { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }
    public class TeacherCourseDto
    {
        public Guid Id { get; set; }
        public Guid TeacherProfileId { get; set; }
        public Guid CourseId { get; set; }
        public DateTimeOffset AssignedAt { get; set; }
    }


    public class TeacherAboutDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string? Bio { get; set; }
        public string? Specialization { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Image { get; set; }
        public List<TeacherAboutCourseDto> Courses { get; set; } = new();
    }

    public class TeacherAboutCourseDto
    {
        public Guid CourseId { get; set; }
        public string Title { get; set; } = string.Empty;
    }

    public class ResetPasswordResultDto
    {
        public string Message { get; set; } = "Password reset successfully";
    }
}