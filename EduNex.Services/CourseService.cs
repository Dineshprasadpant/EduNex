using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EduNex.DataAccess;
using EduNex.Models;
using EduNex.Models.Dtos;

namespace EduNex.Services
{
    public interface ICourseService
    {
        Task<(List<CourseDto> Data, object? Meta)> ListAsync(int page, int limit, bool? isActive);
        Task<CourseDto> GetByIdAsync(Guid id);
        Task<CourseDto> GetBySlugAsync(string slug);
        Task<CourseDto> CreateAsync(CreateCourseDto input);
        Task<CourseDto> UpdateAsync(Guid id, UpdateCourseDto input);
        Task DeleteAsync(Guid id);
        Task<int> RecordViewAsync(Guid id);
    }

    public class CourseService : ICourseService
    {
        private readonly ICourseDal _courseDal;

        public CourseService(ICourseDal courseDal)
        {
            _courseDal = courseDal;
        }

        public async Task<(List<CourseDto> Data, object? Meta)> ListAsync(int page, int limit, bool? isActive)
        {
            int p = Math.Max(1, page);
            int l = Math.Min(100, Math.Max(1, limit));
            int offset = (p - 1) * l;

            var result = await _courseDal.ListAsync(l, offset, isActive);
            
            var meta = new
            {
                Page = p,
                Limit = l,
                Total = result.Total,
                TotalPages = (int)Math.Ceiling((double)result.Total / l)
            };

            return (result.Data, meta);
        }

        public async Task<CourseDto> GetByIdAsync(Guid id)
        {
            var course = await _courseDal.GetByIdAsync(id);
            if (course == null) throw new Exception("Course not found");
            return course;
        }

        public async Task<CourseDto> GetBySlugAsync(string slug)
        {
            var course = await _courseDal.GetBySlugAsync(slug);
            if (course == null) throw new Exception("Course not found");
            return course;
        }

        public async Task<CourseDto> CreateAsync(CreateCourseDto input)
        {
            var existingSlugs = await _courseDal.GetAllSlugsAsync();
            var slug = SlugHelper.GenerateUniqueSlug(input.Title, existingSlugs);
            
            var course = new CourseDto
            {
                Title = input.Title,
                Slug = slug,
                Overview = input.Overview,
                Price = input.Price,
                Discount = input.Discount,
                DurationDays = input.DurationDays,
                CourseType = input.CourseType,
                Description = input.Description,
                Information = input.Information,
                CategoryId = input.CategoryId,
                Image = input.Image,
                MediaId = input.MediaId,
                IsTrending = input.IsTrending,
                IsActive = input.IsActive,
                FreeFeatures = input.FreeFeatures,
                HalfFeatures = input.HalfFeatures,
                PaidFeatures = input.PaidFeatures,
                Views = 0
            };

            return await _courseDal.InsertAsync(course);
        }

        public async Task<CourseDto> UpdateAsync(Guid id, UpdateCourseDto input)
        {
            var existing = await _courseDal.GetByIdAsync(id);
            if (existing == null) throw new Exception("Course not found");

            string? slug = null;
            if (input.Title != null && input.Title != existing.Title)
            {
                var existingSlugs = (await _courseDal.GetAllSlugsAsync()).Where(s => s != existing.Slug).ToList();
                slug = SlugHelper.GenerateUniqueSlug(input.Title, existingSlugs);
            }

            existing.Title = input.Title ?? existing.Title;
            existing.Overview = input.Overview ?? existing.Overview;
            existing.Price = input.Price ?? existing.Price;
            existing.Discount = input.Discount ?? existing.Discount;
            existing.DurationDays = input.DurationDays ?? existing.DurationDays;
            existing.CourseType = input.CourseType ?? existing.CourseType;
            existing.Description = input.Description ?? existing.Description;
            existing.Information = input.Information ?? existing.Information;
            existing.CategoryId = input.CategoryId ?? existing.CategoryId;
            existing.Image = input.Image ?? existing.Image;
            existing.MediaId = input.MediaId ?? existing.MediaId;
            existing.IsTrending = input.IsTrending ?? existing.IsTrending;
            existing.IsActive = input.IsActive ?? existing.IsActive;
            existing.FreeFeatures = input.FreeFeatures ?? existing.FreeFeatures;
            existing.HalfFeatures = input.HalfFeatures ?? existing.HalfFeatures;
            existing.PaidFeatures = input.PaidFeatures ?? existing.PaidFeatures;
            
            if (slug != null) existing.Slug = slug;

            var updated = await _courseDal.UpdateAsync(id, existing);
            if (updated == null) throw new Exception("Failed to update course");
            return updated;
        }

        public async Task DeleteAsync(Guid id)
        {
            var existing = await _courseDal.GetByIdAsync(id);
            if (existing == null) throw new Exception("Course not found");
            await _courseDal.DeleteAsync(id);
        }

        public async Task<int> RecordViewAsync(Guid id)
        {
            return await _courseDal.IncrementViewsAsync(id);
        }
    }
}
