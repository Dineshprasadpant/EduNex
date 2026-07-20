using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using EduNex.DataAccess;
using EduNex.Models;

namespace EduNex.Services
{
    public interface ICategoryService
    {
        Task<(List<Category> Data, PaginationMeta? Meta)> ListAsync(int? page, int? limit);
        Task<Category> GetByIdAsync(Guid id);
        Task<Category> CreateAsync(CreateCategoryRequestDto input);
        Task<Category> UpdateAsync(Guid id, UpdateCategoryRequestDto input);
        Task RemoveAsync(Guid id);
    }

    public class CategoryService : ICategoryService
    {
        private readonly ICategoryDal _categoryDal;

        public CategoryService(ICategoryDal categoryDal)
        {
            _categoryDal = categoryDal;
        }

        private static readonly Regex NonAlphaNumeric = new(@"[^a-z0-9]+", RegexOptions.Compiled);

        private static string Slugify(string name)
        {
            var slug = NonAlphaNumeric.Replace(name.ToLowerInvariant(), "-").Trim('-');
            return slug.Length > 0 ? slug : "category";
        }

        private static string GenerateUniqueSlug(string name, IEnumerable<string> existingSlugs)
        {
            var existing = new HashSet<string>(existingSlugs, StringComparer.OrdinalIgnoreCase);
            var baseSlug = Slugify(name);
            var slug = baseSlug;
            var counter = 1;
            while (existing.Contains(slug))
            {
                slug = $"{baseSlug}-{counter}";
                counter++;
            }
            return slug;
        }

        public async Task<(List<Category> Data, PaginationMeta? Meta)> ListAsync(int? page, int? limit)
        {
            if (!limit.HasValue)
            {
                var all = await _categoryDal.FindAllAsync();
                return (all, null);
            }

            var pagination = Paginator.Paginate(page?.ToString(), limit.Value.ToString());
            var data = await _categoryDal.FindAllAsync(new DalPagination { Offset = pagination.Offset, Limit = pagination.Limit });
            var total = await _categoryDal.CountAllAsync();
            return (data, PaginationMeta.Create(total, pagination.Page, pagination.Limit));
        }

        public async Task<Category> GetByIdAsync(Guid id)
        {
            var category = await _categoryDal.FindByIdAsync(id);
            if (category is null) throw new NotFoundException("Category not found");
            return category;
        }

        public async Task<Category> CreateAsync(CreateCategoryRequestDto input)
        {
            var existingSlugs = await _categoryDal.FindSlugsAsync();
            var slug = GenerateUniqueSlug(input.Name, existingSlugs);
            return await _categoryDal.CreateAsync(input.Name, slug, input.Description);
        }

        public async Task<Category> UpdateAsync(Guid id, UpdateCategoryRequestDto input)
        {
            var existing = await _categoryDal.FindByIdAsync(id);
            if (existing is null) throw new NotFoundException("Category not found");

            string? slug = null;
            if (!string.IsNullOrEmpty(input.Name) && input.Name != existing.Name)
            {
                var existingSlugs = (await _categoryDal.FindSlugsAsync()).Where(s => s != existing.Slug);
                slug = GenerateUniqueSlug(input.Name, existingSlugs);
            }

            return await _categoryDal.UpdateAsync(id, input.Name, input.Description, slug)
                ?? throw new NotFoundException("Category not found");
        }

        public async Task RemoveAsync(Guid id)
        {
            var existing = await _categoryDal.FindByIdAsync(id);
            if (existing is null) throw new NotFoundException("Category not found");
            await _categoryDal.RemoveAsync(id);
        }
    }
}