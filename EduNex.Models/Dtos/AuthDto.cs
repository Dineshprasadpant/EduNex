using Microsoft.AspNetCore.Http;

namespace EduNex.Models
{
    public static class PlanType
    {
        public const string Free = "free";
        public const string Half = "half";
        public const string Full = "full";

        public static readonly string[] All = { Free, Half, Full };
    }

    public static class DocUploadRules
    {
        public static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".pdf" };
        public static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/webp", "application/pdf"
        };
        public const long MaxFileSizeBytes = 3 * 1024 * 1024; 
    }


    public class LoginRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    // Bound via [FromForm] on POST /auth/register, mirroring multer's
    // .fields([{name:'citizenship'}, {name:'payment'}]).
    public class RegisterRequestDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public Guid? CourseId { get; set; }
        public string Plan { get; set; } = PlanType.Free;

        public IFormFile? Citizenship { get; set; }
        public IFormFile? Payment { get; set; }
    }

    public class RefreshRequestDto
    {
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class LogoutRequestDto
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
    public class UserDto
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
        public int FailedLoginAttempts { get; set; }
        public DateTimeOffset? LastLoginAt { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }

        public static UserDto FromEntity(User u) => new()
        {
            Id = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Email = u.Email,
            Phone = u.Phone,
            Role = u.Role,
            Image = u.Image,
            IsVerified = u.IsVerified,
            IsBlocked = u.IsBlocked,
            LoginLocked = u.LoginLocked,
            LastLoginAt = u.LastLoginAt,
            CreatedAt = u.CreatedAt,
            UpdatedAt = u.UpdatedAt,
        };
    }

    public class ActiveRefreshTokenWithUser
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public DateTimeOffset ExpiresAt { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsBlocked { get; set; }
    }

    public class RegisterResponseDto
    {
        public UserDto User { get; set; } = default!;
        public string Message { get; set; } = string.Empty;
    }

    public class TokenPairDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class LoginResultDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public UserDto User { get; set; } = default!;
    }
}