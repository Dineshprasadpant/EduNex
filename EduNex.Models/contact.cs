using System.ComponentModel.DataAnnotations;

namespace EduNex.Models;

public class CreateContactDto
{
    [Required, MinLength(2), MaxLength(200)]
    public string Name { get; set; } = default!;

    [Required, EmailAddress]
    public string Email { get; set; } = default!;

    [MaxLength(40)]
    public string? Phone { get; set; }

    [Required, MinLength(3), MaxLength(300)]
    public string Subject { get; set; } = default!;

    [Required, MinLength(20)]
    public string Message { get; set; } = default!;
}

public class ReplyContactDto
{
    [Required, MinLength(1), MaxLength(2000)]
    public string Reply { get; set; } = default!;
}

public class ContactQueryDto
{
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 10;
    public string? Status { get; set; } // "pending" | "replied"
    public string? Search { get; set; }
}

public class ContactStatsDto
{
    public int Total { get; set; }
    public int Pending { get; set; }
    public int Replied { get; set; }
}

