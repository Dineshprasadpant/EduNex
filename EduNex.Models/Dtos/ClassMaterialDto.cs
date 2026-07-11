namespace EduNex.Models.Dtos
{
    public class ClassMaterialDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string FileUrl { get; set; } = string.Empty;
        public Guid CourseId { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class CreateClassMaterialDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string FileUrl { get; set; } = string.Empty;
        public Guid CourseId { get; set; }
    }

    public class UpdateClassMaterialDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? FileUrl { get; set; }
        public Guid? CourseId { get; set; }
    }
}
