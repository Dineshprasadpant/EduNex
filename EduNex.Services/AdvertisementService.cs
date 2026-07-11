using System;
using System.Threading.Tasks;
using EduNex.DataAccess;
using EduNex.Models;

namespace EduNex.Services
{
    public interface IAdvertisementService
    {
        Task<PagedResult<AdvertisementDto>> ListAsync(bool? isActive, int page, int limit, int offset);
        Task<AdvertisementDto> GetByIdAsync(Guid id);
        Task<AdvertisementDto> CreateAsync(CreateAdvertisementRequest input);
        Task<AdvertisementDto> UpdateAsync(Guid id, UpdateAdvertisementRequest input);
        Task DeleteAsync(Guid id);
    }

    public class AdvertisementService : IAdvertisementService
    {
        private readonly IAdvertisementDal _repo;

        public AdvertisementService(IAdvertisementDal repo)
        {
            _repo = repo;
        }

        public Task<PagedResult<AdvertisementDto>> ListAsync(bool? isActive, int page, int limit, int offset) =>
            _repo.GetAllAsync(isActive, page, limit, offset);

        public async Task<AdvertisementDto> GetByIdAsync(Guid id) =>
            await _repo.GetByIdAsync(id) ?? throw new NotFoundException("Advertisement not found");

        public async Task<AdvertisementDto> CreateAsync(CreateAdvertisementRequest input) =>
            await _repo.CreateAsync(input);

        public async Task<AdvertisementDto> UpdateAsync(Guid id, UpdateAdvertisementRequest input)
        {
            if (!await _repo.ExistsAsync(id))
                throw new NotFoundException("Advertisement not found");

            return await _repo.UpdateAsync(id, input)
                ?? throw new NotFoundException("Advertisement not found");
        }

        public async Task DeleteAsync(Guid id)
        {
            if (!await _repo.ExistsAsync(id))
                throw new NotFoundException("Advertisement not found");

            await _repo.DeleteAsync(id);
        }
    }
}