using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using EduNex.DataAccess;
using EduNex.Models;
using Ganss.Xss;

namespace EduNex.Services
{
    public interface ICourseService
    {
        Task<Course> CreateCourseAsync(CreateCourseRequestDto input);
        Task<(List<CourseListDto> Data, PaginationMeta Meta)> ListCoursesAsync(ListCoursesQueryDto query);
        Task<(List<CourseListDto> Data, PaginationMeta Meta)> ListAllCoursesAsync(ListCoursesQueryDto query);
        Task<CourseDetailDto> GetCourseByIdAsync(Guid id);
        Task<CourseListDto> GetCourseBySlugAsync(string slug);
        Task<CourseDetailDto?> GetMyCourseAsync(Guid userId);
        Task<Course> UpdateCourseAsync(Guid id, UpdateCourseRequestDto input);
        Task DeleteCourseAsync(Guid id);
        Task<ViewResultDto> RecordViewAsync(Guid id);
        Task<List<TopViewedCourseDto>> GetTopViewedAsync(int limit = 10);
    }

    public class CourseService : ICourseService
    {
        private readonly ICourseDal _courseDal;
        private static readonly HtmlSanitizer Sanitizer = BuildSanitizer();

        public CourseService(ICourseDal courseDal)
        {
            _courseDal = courseDal;
        }

        private static HtmlSanitizer BuildSanitizer()
        {
            var sanitizer = new HtmlSanitizer();
            // sanitize-html's ALLOWED_TAGS = its defaults + these extras.
            foreach (var tag in new[] { "img", "h1", "h2", "h3", "span", "u", "s" })
                sanitizer.AllowedTags.Add(tag);

            // Approximates sanitize-html's per-tag ALLOWED_ATTRIBUTES:
            // '*' -> class/style, img -> src/alt/width/height, plus
            // whatever Ganss already treats as generally-safe (href, etc.).
            sanitizer.RemovingAttribute += (_, e) =>
            {
                var tag = e.Tag.TagName.ToLowerInvariant();
                var attr = e.Attribute.Name.ToLowerInvariant();
                var allowed = attr is "class" or "style"
                    || (tag == "img" && attr is "src" or "alt" or "width" or "height");
                if (allowed) e.Cancel = true;
            };
            return sanitizer;
        }

        private static string? SanitizeOrNull(string? html) =>
            string.IsNullOrEmpty(html) ? html : Sanitizer.Sanitize(html);

        private static CreateCourseRequestDto SanitizeCreate(CreateCourseRequestDto input) => new()
        {
            Title = input.Title,
            Overview = input.Overview,
            Price = input.Price,
            Discount = input.Discount,
            DurationDays = input.DurationDays,
            CourseTypeValue = input.CourseTypeValue,
            Description = SanitizeOrNull(input.Description) ?? input.Description,
            Information = SanitizeOrNull(input.Information),
            CategoryId = input.CategoryId,
            Image = input.Image,
            MediaId = input.MediaId,
            IsTrending = input.IsTrending,
            IsActive = input.IsActive,
            FreeFeatures = SanitizeOrNull(input.FreeFeatures),
            HalfFeatures = SanitizeOrNull(input.HalfFeatures),
            PaidFeatures = SanitizeOrNull(input.PaidFeatures),
        };

        private static UpdateCourseRequestDto SanitizeUpdate(UpdateCourseRequestDto input) => new()
        {
            Title = input.Title,
            Overview = input.Overview,
            Price = input.Price,
            Discount = input.Discount,
            DurationDays = input.DurationDays,
            CourseTypeValue = input.CourseTypeValue,
            Description = SanitizeOrNull(input.Description),
            Information = SanitizeOrNull(input.Information),
            CategoryId = input.CategoryId,
            Image = input.Image,
            MediaId = input.MediaId,
            IsTrending = input.IsTrending,
            IsActive = input.IsActive,
            FreeFeatures = SanitizeOrNull(input.FreeFeatures),
            HalfFeatures = SanitizeOrNull(input.HalfFeatures),
            PaidFeatures = SanitizeOrNull(input.PaidFeatures),
        };

        private static readonly Regex NonAlphaNumeric = new(@"[^a-z0-9]+", RegexOptions.Compiled);

        private static string Slugify(string title)
        {
            var slug = NonAlphaNumeric.Replace(title.ToLowerInvariant(), "-").Trim('-');
            return slug.Length > 0 ? slug : "course";
        }

        private async Task<string> GenerateUniqueSlugAsync(string title)
        {
            var existingSlugs = await _courseDal.FindSlugsAsync();
            var existing = new HashSet<string>(existingSlugs, StringComparer.OrdinalIgnoreCase);
            var baseSlug = Slugify(title);
            var slug = baseSlug;
            var counter = 1;
            while (existing.Contains(slug))
            {
                slug = $"{baseSlug}-{counter}";
                counter++;
            }
            return slug;
        }

        public async Task<Course> CreateCourseAsync(CreateCourseRequestDto input)
        {
            var slug = await GenerateUniqueSlugAsync(input.Title);
            var sanitized = SanitizeCreate(input);
            return await _courseDal.CreateAsync(sanitized, slug);
        }

        public async Task<(List<CourseListDto> Data, PaginationMeta Meta)> ListCoursesAsync(ListCoursesQueryDto query)
        {
            var pagination = Paginator.Paginate(query.Page.ToString(), query.Limit.ToString());
            var filters = new CourseFilters
            {
                CourseType = query.CourseType,
                Search = query.Search,
                IsTrending = query.IsTrending,
                CategoryId = query.CategoryId,
                Uncategorized = query.Uncategorized ?? false,
                ActiveOnly = true,
            };
            var (data, total) = await _courseDal.FindAllAsync(
                filters, new DalPagination { Offset = pagination.Offset, Limit = pagination.Limit });
            return (data, PaginationMeta.Create(total, pagination.Page, pagination.Limit));
        }

        public async Task<(List<CourseListDto> Data, PaginationMeta Meta)> ListAllCoursesAsync(ListCoursesQueryDto query)
        {
            var pagination = Paginator.Paginate(query.Page.ToString(), query.Limit.ToString());
            // Matches coursesService.listAllCourses exactly: only
            // courseType/search are forwarded, everything else (isTrending,
            // categoryId, uncategorized) is intentionally ignored here.
            var filters = new CourseFilters
            {
                CourseType = query.CourseType,
                Search = query.Search,
                ActiveOnly = false,
            };
            var (data, total) = await _courseDal.FindAllAsync(
                filters, new DalPagination { Offset = pagination.Offset, Limit = pagination.Limit });
            return (data, PaginationMeta.Create(total, pagination.Page, pagination.Limit));
        }

        public async Task<CourseDetailDto> GetCourseByIdAsync(Guid id)
        {
            var course = await _courseDal.FindByIdAsync(id);
            if (course is null) throw new NotFoundException("Course not found");
            return course;
        }

        public async Task<CourseListDto> GetCourseBySlugAsync(string slug)
        {
            var course = await _courseDal.FindBySlugAsync(slug);
            if (course is null) throw new NotFoundException("Course not found");
            return course;
        }

        // The authenticated student's own enrolled course, including
        // Information. Returns null when not enrolled -- no throw, matches
        // getMyCourse in courses.service.ts exactly.
        public async Task<CourseDetailDto?> GetMyCourseAsync(Guid userId) =>
            await _courseDal.FindEnrolledByUserAsync(userId);

        public async Task<Course> UpdateCourseAsync(Guid id, UpdateCourseRequestDto input)
        {
            var existing = await _courseDal.FindByIdAsync(id);
            if (existing is null) throw new NotFoundException("Course not found");

            var sanitized = SanitizeUpdate(input);

            string? newSlug = null;
            if (!string.IsNullOrEmpty(sanitized.Title) && sanitized.Title != existing.Title)
                newSlug = await GenerateUniqueSlugAsync(sanitized.Title);

            return await _courseDal.UpdateAsync(id, sanitized, newSlug) ?? throw new NotFoundException("Course not found");
        }

        public async Task DeleteCourseAsync(Guid id)
        {
            var existing = await _courseDal.FindByIdAsync(id);
            if (existing is null) throw new NotFoundException("Course not found");
            await _courseDal.RemoveAsync(id);
        }

        // Records a public page view (dedupe is handled client-side).
        public async Task<ViewResultDto> RecordViewAsync(Guid id)
        {
            var views = await _courseDal.IncrementViewsAsync(id);
            if (views is null) throw new NotFoundException("Course not found");
            return new ViewResultDto { Views = views.Value };
        }

        // Admin analytics: courses ranked by view count.
        public async Task<List<TopViewedCourseDto>> GetTopViewedAsync(int limit = 10) =>
            await _courseDal.FindTopViewedAsync(limit);
    }
}