using EduNex.Models;
using EduNex.DataAccess;

namespace EduNex.Services
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
        private readonly IAnnouncementDal _repo;
        public AnnouncementService(IAnnouncementDal repo) => _repo = repo;

        public async Task<object> CreateAnnouncementAsync(Announcement ann)
        {
            ann.CreatedAt = ann.UpdatedAt = DateTime.UtcNow;
            var id = await _repo.CreateAsync(ann);
            return await _repo.GetByIdAsync(id) ?? throw new Exception("Failed to create announcement.");
        }

        public async Task<object> GetAnnouncementAsync(Guid id)
        {
            return await _repo.GetByIdAsync(id) ?? throw new Exception("Announcement not found.");
        }

        public async Task<object> GetAllAnnouncementsAsync(int page, int limit)
        {
            var result = await _repo.GetAllPaginatedAsync(page, limit);
            return new
            {
                data = new
                {
                    total = result.Total,
                    page,
                    limit,
                    announcements = result.Items
                }
            };
        }

        public async Task<object> UpdateAnnouncementAsync(Guid id, Announcement ann)
        {
            await _repo.UpdateAsync(id, ann);
            return await _repo.GetByIdAsync(id) ?? throw new Exception("Announcement not found.");
        }

        public async Task<object> DeleteAnnouncementAsync(Guid id)
        {
            var ann = await _repo.GetByIdAsync(id) ?? throw new Exception("Announcement not found.");
            await _repo.DeleteAsync(id);
            return new { message = "Announcement deleted successfully", announcement = ann };
        }
    }
}