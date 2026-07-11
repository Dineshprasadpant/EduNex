using EduNex.DataAccess;
using EduNex.Models;
using EduNex.Models.Dtos;

namespace EduNex.Services
{
    public interface IClassMaterialService
    {
        Task<(List<ClassMaterialDto> Data, object? Meta)> ListAsync(int page, int limit);
        Task<(List<ClassMaterialDto> Data, object? Meta)> ListByBatchAsync(Guid batchId, int page, int limit);
        Task<ClassMaterialDto> GetByIdAsync(Guid id);
        Task<ClassMaterialDto> CreateAsync(CreateClassMaterialDto input);
        Task<ClassMaterialDto> UpdateAsync(Guid id, UpdateClassMaterialDto input);
        Task DeleteAsync(Guid id);
    }

    public class ClassMaterialService : IClassMaterialService
    {
        private readonly IClassMaterialDal _dal;

        public ClassMaterialService(IClassMaterialDal dal) => _dal = dal;

        public async Task<(List<ClassMaterialDto> Data, object? Meta)> ListAsync(int page, int limit)
        {
            int p = Math.Max(1, page);
            int l = Math.Min(100, Math.Max(1, limit));
            int offset = (p - 1) * l;

            var result = await _dal.GetAllPaginatedAsync(l, offset);
            
            var meta = new
            {
                Page = p,
                Limit = l,
                Total = result.Total,
                TotalPages = (int)Math.Ceiling((double)result.Total / l)
            };

            return (result.Items.ToList(), meta);
        }

        public async Task<(List<ClassMaterialDto> Data, object? Meta)> ListByBatchAsync(Guid batchId, int page, int limit)
        {
            int p = Math.Max(1, page);
            int l = Math.Min(100, Math.Max(1, limit));
            int offset = (p - 1) * l;

            var result = await _dal.GetPaginatedByBatchAsync(batchId, l, offset);
            
            var meta = new
            {
                Page = p,
                Limit = l,
                Total = result.Total,
                TotalPages = (int)Math.Ceiling((double)result.Total / l)
            };

            return (result.Items.ToList(), meta);
        }

        public async Task<ClassMaterialDto> GetByIdAsync(Guid id)
        {
            var material = await _dal.GetByIdAsync(id);
            if (material == null) throw new Exception("Class material not found");
            return material;
        }

        public async Task<ClassMaterialDto> CreateAsync(CreateClassMaterialDto input)
        {
            var material = new ClassMaterial
            {
                Title = input.Title,
                Description = input.Description,
                FileUrl = input.FileUrl,
                CourseId = input.CourseId
            };
            
            var id = await _dal.CreateAsync(material);
            return await _dal.GetByIdAsync(id) ?? throw new Exception("Failed to retrieve created material");
        }

        public async Task<ClassMaterialDto> UpdateAsync(Guid id, UpdateClassMaterialDto input)
        {
            var existing = await _dal.GetByIdAsync(id);
            if (existing == null) 
                throw new Exception("Class material not found");
            var material = new ClassMaterial
            {
                Id = id,
                Title = existing.Title,
                Description = input.Description ?? existing.Description,
                FileUrl = input.FileUrl ?? existing.FileUrl,
                CourseId = input.CourseId ?? existing.CourseId
            };
            
            await _dal.UpdateAsync(id, material);
            return await _dal.GetByIdAsync(id) ?? throw new Exception("Failed to retrieve updated material");
        }

        public async Task DeleteAsync(Guid id)
        {
            var success = await _dal.DeleteAsync(id);
            if (!success) throw new Exception("Class material not found");
        }
    }
}
