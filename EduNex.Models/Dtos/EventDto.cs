namespace EduNex.Models.Dtos
{
    public class EventDto
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
    }

    public class CreateEventDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = "Other";
        public DateTimeOffset EventDate { get; set; }
        public string? Address { get; set; }
        public string Privacy { get; set; } = "public";
        public Guid? CourseId { get; set; }
        public string? Image { get; set; }
        public Guid? MediaId { get; set; }
        public List<Guid>? ResourceMediaIds { get; set; }
    }

    public class UpdateEventDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Category { get; set; }
        public DateTimeOffset? EventDate { get; set; }
        public string? Address { get; set; }
        public string? Privacy { get; set; }
        public Guid? CourseId { get; set; }
        public string? Image { get; set; }
        public Guid? MediaId { get; set; }
        public List<Guid>? ResourceMediaIds { get; set; }
    }
}
