using System;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.DataAccess;

namespace EduNex.Services
{
    public interface IClassMaterialService
    {
        Task<ClassMaterial> GetClassMaterialAsync(Guid id);
        Task<ClassMaterial> CreateClassMaterialAsync(ClassMaterial material);
        Task<ClassMaterial> UpdateClassMaterialAsync(Guid id, ClassMaterial material);
        Task<bool> DeleteClassMaterialAsync(Guid id);
        Task<object> GetPaginatedClassMaterialsAsync(Guid batchId, int page, int limit);
        Task<object> GetAllPaginatedClassMaterialsAsync(int page, int limit);
    }

    public class ClassMaterialService : IClassMaterialService
    {
        private readonly IClassMaterialDal _dal;
        public ClassMaterialService(IClassMaterialDal dal) => _dal = dal;

        public async Task<ClassMaterial> GetClassMaterialAsync(Guid id) => await _dal.GetByIdAsync(id);

        public async Task<ClassMaterial> CreateClassMaterialAsync(ClassMaterial material)
        {
            var id = await _dal.CreateAsync(material);
            return await _dal.GetByIdAsync(id);
        }

        public async Task<ClassMaterial> UpdateClassMaterialAsync(Guid id, ClassMaterial material)
        {
            await _dal.UpdateAsync(id, material);
            return await _dal.GetByIdAsync(id);
        }

        public async Task<bool> DeleteClassMaterialAsync(Guid id) => await _dal.DeleteAsync(id);

        public async Task<object> GetPaginatedClassMaterialsAsync(Guid batchId, int page, int limit)
        {
            var (items, total) = await _dal.GetPaginatedByBatchAsync(batchId, page, limit);
            return new { materials = items, meta = new { total, page, limit, totalPages = (int)Math.Ceiling((double)total / limit), hasNextPage = (page * limit) < total, hasPreviousPage = page > 1 } };
        }

        public async Task<object> GetAllPaginatedClassMaterialsAsync(int page, int limit)
        {
            var (items, total) = await _dal.GetAllPaginatedAsync(page, limit);
            return new { materials = items, meta = new { total, page, limit, totalPages = (int)Math.Ceiling((double)total / limit), hasNextPage = (page * limit) < total, hasPreviousPage = page > 1 } };
        }
    }
}
