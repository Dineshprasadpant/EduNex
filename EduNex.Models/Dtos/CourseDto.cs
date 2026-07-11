namespace EduNex.Models.Dtos
{
    public class CourseDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Overview { get; set; } = string.Empty;
        public decimal? Price { get; set; }
        public int Discount { get; set; }
        public int DurationDays { get; set; }
        public string CourseType { get; set; } = "offline";
        public string Description { get; set; } = string.Empty;
        public string? Information { get; set; }
        public Guid? CategoryId { get; set; }
        public string? Image { get; set; }
        public Guid? MediaId { get; set; }
        public bool IsTrending { get; set; }
        public bool IsActive { get; set; }
        public int Views { get; set; }
        public string? FreeFeatures { get; set; }
        public string? HalfFeatures { get; set; }
        public string? PaidFeatures { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }

    public class CreateCourseDto
    {
        public string Title { get; set; } = string.Empty;
        public string Overview { get; set; } = string.Empty;
        public decimal? Price { get; set; }
        public int Discount { get; set; }
        public int DurationDays { get; set; }
        public string CourseType { get; set; } = "offline";
        public string Description { get; set; } = string.Empty;
        public string? Information { get; set; }
        public Guid? CategoryId { get; set; }
        public string? Image { get; set; }
        public Guid? MediaId { get; set; }
        public bool IsTrending { get; set; }
        public bool IsActive { get; set; }
        public string? FreeFeatures { get; set; }
        public string? HalfFeatures { get; set; }
        public string? PaidFeatures { get; set; }
    }

    public class UpdateCourseDto
    {
        public string? Title { get; set; }
        public string? Overview { get; set; }
        public decimal? Price { get; set; }
        public int? Discount { get; set; }
        public int? DurationDays { get; set; }
        public string? CourseType { get; set; }
        public string? Description { get; set; }
        public string? Information { get; set; }
        public Guid? CategoryId { get; set; }
        public string? Image { get; set; }
        public Guid? MediaId { get; set; }
        public bool? IsTrending { get; set; }
        public bool? IsActive { get; set; }
        public string? FreeFeatures { get; set; }
        public string? HalfFeatures { get; set; }
        public string? PaidFeatures { get; set; }
    }
}
