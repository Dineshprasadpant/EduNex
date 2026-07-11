using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using EduNex.DataAccess;
using EduNex.Models;
using EduNex.Models.Dtos;

namespace EduNex.Services
{
    public static class SlugHelper
    {
        public static string Slugify(string text)
        {
            var str = text.ToLower().Trim();
            var regex1 = new Regex(@"[^\w\s-]");
            str = regex1.Replace(str, "");
            var regex2 = new Regex(@"[\s_-]+");
            str = regex2.Replace(str, "-");
            var regex3 = new Regex(@"^-+|-+$");
            str = regex3.Replace(str, "");
            return str;
        }

        public static string GenerateUniqueSlug(string baseSlug, List<string> existingSlugs)
        {
            var slug = Slugify(baseSlug);
            if (!existingSlugs.Contains(slug)) return slug;
            int counter = 1;
            while (existingSlugs.Contains($"{slug}-{counter}")) counter++;
            return $"{slug}-{counter}";
        }
    }

    public interface ICategoryService
    {
        Task<(List<Category> Data, object? Meta)> ListAsync(int? page, int? limit);
        Task<Category> GetByIdAsync(Guid id);
        Task<Category> CreateAsync(CreateCategoryDto input);
        Task<Category> UpdateAsync(Guid id, UpdateCategoryDto input);
        Task DeleteAsync(Guid id);
    }

    public class CategoryService : ICategoryService
    {
        private readonly ICategoryDal _categoryDal;

        public CategoryService(ICategoryDal categoryDal)
        {
            _categoryDal = categoryDal;
        }

        public async Task<(List<Category> Data, object? Meta)> ListAsync(int? page, int? limit)
        {
            if (!limit.HasValue)
            {
                var data = await _categoryDal.ListAsync(int.MaxValue, 0);
                return (data.Data, null);
            }

            int p = Math.Max(1, page ?? 1);
            int l = Math.Min(100, Math.Max(1, limit.Value));
            int offset = (p - 1) * l;

            var result = await _categoryDal.ListAsync(l, offset);
            
            var meta = new
            {
                Page = p,
                Limit = l,
                Total = result.Total,
                TotalPages = (int)Math.Ceiling((double)result.Total / l)
            };

            return (result.Data, meta);
        }

        public async Task<Category> GetByIdAsync(Guid id)
        {
            var category = await _categoryDal.GetByIdAsync(id);
            if (category == null) throw new Exception("Category not found"); // Replace with custom exception
            return category;
        }

        public async Task<Category> CreateAsync(CreateCategoryDto input)
        {
            var existingSlugs = await _categoryDal.GetAllSlugsAsync();
            var slug = SlugHelper.GenerateUniqueSlug(input.Name, existingSlugs);
            
            try
            {
                return await _categoryDal.InsertCategoryAsync(new Category
                {
                    Name = input.Name,
                    Slug = slug,
                    Description = input.Description
                });
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
            {
                throw new Exception("A category with this name already exists");
            }
        }

        public async Task<Category> UpdateAsync(Guid id, UpdateCategoryDto input)
        {
            var existing = await _categoryDal.GetByIdAsync(id);
            if (existing == null) throw new Exception("Category not found");

            string? slug = null;
            if (input.Name != null && input.Name != existing.Name)
            {
                var existingSlugs = (await _categoryDal.GetAllSlugsAsync()).Where(s => s != existing.Slug).ToList();
                slug = SlugHelper.GenerateUniqueSlug(input.Name, existingSlugs);
            }

            try
            {
                existing.Name = input.Name ?? existing.Name;
                existing.Description = input.Description ?? existing.Description;
                if (slug != null) existing.Slug = slug;

                var updated = await _categoryDal.UpdateCategoryAsync(existing);
                if (updated == null) throw new Exception("Failed to update category");
                return updated;
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
            {
                throw new Exception("A category with this name already exists");
            }
        }

        public async Task DeleteAsync(Guid id)
        {
            var existing = await _categoryDal.GetByIdAsync(id);
            if (existing == null) throw new Exception("Category not found");
            await _categoryDal.DeleteCategoryAsync(id);
        }
    }
}
