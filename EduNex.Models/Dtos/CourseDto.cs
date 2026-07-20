using System;
using System.Collections.Generic;

namespace EduNex.Models
{

    public class CategorySummaryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";
        public string Slug { get; set; } = "";
    }

    // Public shape -- deliberately has NO Information property at all (not
    // just null/hidden), mirroring baseSelect never selecting that column
    // so a public endpoint can't leak it even by accident.
    public class CourseListDto
    {
        public Guid Id { get; set; }
        public string Slug { get; set; } = "";
        public string Title { get; set; } = "";
        public string Overview { get; set; } = "";
        public decimal? Price { get; set; }
        public int Discount { get; set; }
        public int DurationDays { get; set; }
        public string CourseTypeValue { get; set; } = CourseType.Offline;
        public string Description { get; set; } = "";
        public string? Image { get; set; }
        public Guid? MediaId { get; set; }
        public Guid? CategoryId { get; set; }
        public bool IsTrending { get; set; }
        public bool IsActive { get; set; }
        public int Views { get; set; }
        public string? FreeFeatures { get; set; }
        public string? HalfFeatures { get; set; }
        public string? PaidFeatures { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        public MediaSummaryDto? Media { get; set; }
        public CategorySummaryDto? Category { get; set; }
    }

    // Admin (getById) / the enrolled student's own course (GET /courses/me).
    public class CourseDetailDto : CourseListDto
    {
        public string? Information { get; set; }
    }

    public class ViewResultDto
    {
        public int Views { get; set; }
    }

    public class TopViewedCourseDto
    {
        public Guid Id { get; set; }
        public string Slug { get; set; } = "";
        public string Title { get; set; } = "";
        public int Views { get; set; }
    }

    // ---- request DTOs ----
    public class ListCoursesQueryDto
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 20;
        public string? CourseType { get; set; }
        public string? Search { get; set; }
        public bool? IsTrending { get; set; }
        // Present in listCoursesSchema but not actually read by
        // coursesService.listCourses/listAllCourses -- kept for parity,
        // currently unused by the service just like the TS version.
        public bool? IsActive { get; set; }
        public Guid? CategoryId { get; set; }
        public bool? Uncategorized { get; set; }
    }

    public class CreateCourseRequestDto
    {
        public string Title { get; set; } = "";
        public string Overview { get; set; } = "";
        public decimal? Price { get; set; }
        public int Discount { get; set; } = 0;
        public int DurationDays { get; set; }
        public string CourseTypeValue { get; set; } = CourseType.Offline;
        public string Description { get; set; } = "";
        public string? Information { get; set; }
        public Guid? CategoryId { get; set; }
        public string? Image { get; set; }
        public Guid? MediaId { get; set; }
        public bool IsTrending { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public string? FreeFeatures { get; set; }
        public string? HalfFeatures { get; set; }
        public string? PaidFeatures { get; set; }
    }

    // All-optional partial update -- same omitted-vs-explicitly-null caveat
    // flagged in the exams/events modules applies to CategoryId/MediaId here.
    public class UpdateCourseRequestDto
    {
        public string? Title { get; set; }
        public string? Overview { get; set; }
        public decimal? Price { get; set; }
        public int? Discount { get; set; }
        public int? DurationDays { get; set; }
        public string? CourseTypeValue { get; set; }
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