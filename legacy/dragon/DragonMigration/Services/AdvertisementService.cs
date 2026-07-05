using EduNex.DataAccess;
using EduNex.Models;
namespace EduNex.Services
{
    public interface IAdvertisementService
    {
        Task<object> GetAdvertisementsAsync(int page, int limit);
        Task<object> GetAdvertisementAsync(Guid id);
        Task<object> CreateAdAsync(Advertisement ad);
        Task<object> UpdateAdAsync(Guid id, Advertisement ad);
        Task DeleteAdAsync(Guid id);
    }

    public class AdvertisementService : IAdvertisementService
    {
        private readonly IAdvertisementDal _repo;
        public AdvertisementService(IAdvertisementDal repo)
        {
            _repo = repo;
        }

        public async Task<object> GetAdvertisementsAsync(int page, int limit)
        {
            var (items, total) = await _repo.GetPaginatedAsync(page, limit);
            return new
            {
                totalObjects = total,
                totalPages = (int)Math.Ceiling((double)total / limit),
                currentPage = page,
                currentObjects = items
            };
        }

        public async Task<object> GetAdvertisementAsync(Guid id) => await _repo.GetByIdAsync(id);

        public async Task<object> CreateAdAsync(Advertisement ad)
        {
            ad.CreatedAt = ad.UpdatedAt = DateTime.UtcNow;
            var id = await _repo.CreateAsync(ad);
            return await _repo.GetByIdAsync(id);
        }

        public async Task<object> UpdateAdAsync(Guid id, Advertisement ad)
        {
            await _repo.UpdateAsync(id, ad);
            return await _repo.GetByIdAsync(id);
        }

        public async Task DeleteAdAsync(Guid id) => await _repo.DeleteAsync(id);
    }
}
