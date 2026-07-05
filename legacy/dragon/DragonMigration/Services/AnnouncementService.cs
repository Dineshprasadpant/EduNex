using System;
using System.Threading.Tasks;
using Dragon.Models;
using Dragon.Repositories;

namespace Dragon.Services
{
    public interface IAnnouncementService
    {
        Task<object> CreateAnnouncementAsync(Announcement announcement);
        Task<object> GetAnnouncementAsync(Guid id);
        Task<object> GetAllAnnouncementsAsync(int page, int limit);
        Task<object> UpdateAnnouncementAsync(Guid id, Announcement announcement);
        Task<object> DeleteAnnouncementAsync(Guid id);
    }

    public class AnnouncementService : IAnnouncementService
    {
        private readonly IAnnouncementRepository _repo;
        public AnnouncementService(IAnnouncementRepository repo) => _repo = repo;

        public async Task<object> CreateAnnouncementAsync(Announcement ann)
        {
            ann.CreatedAt = ann.UpdatedAt = DateTime.UtcNow;
            var id = await _repo.CreateAsync(ann);
            return await _repo.GetByIdAsync(id);
        }

        public async Task<object> GetAnnouncementAsync(Guid id) => await _repo.GetByIdAsync(id);

        public async Task<object> GetAllAnnouncementsAsync(int page, int limit)
        {
            var (items, total) = await _repo.GetAllPaginatedAsync(page, limit);
            return new { data = items, total, page, limit }; // Wrapped to match Node exactly
        }

        public async Task<object> UpdateAnnouncementAsync(Guid id, Announcement ann)
        {
            await _repo.UpdateAsync(id, ann);
            return await _repo.GetByIdAsync(id);
        }

        public async Task<object> DeleteAnnouncementAsync(Guid id)
        {
            var ann = await _repo.GetByIdAsync(id);
            await _repo.DeleteAsync(id);
            return new { message = "Announcement deleted successfully", announcement = ann };
        }
    }
}
