using System;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.DataAccess;

namespace EduNex.Services
{
    public interface IBatchService
    {
        Task<object> CreateBatchAsync(Batch batch);
        Task<Batch> GetBatchAsync(Guid id);
        Task<object> GetAllBatchesAsync(int page, int limit);
        Task<Batch> UpdateBatchAsync(Guid id, Batch batch);
        Task<bool> DeleteBatchAsync(Guid id);
        
        // Meetings
        Task<Batch> AddMeetingAsync(Guid batchId, ScheduledMeeting meeting);
        Task<Batch> UpdateMeetingAsync(Guid batchId, Guid meetingId, ScheduledMeeting meeting);
        Task<Batch> RemoveMeetingAsync(Guid batchId, Guid meetingId);
        Task<object> CleanupMeetingsAsync();
    }

    public class BatchService : IBatchService
    {
        private readonly IBatchDal _batchDal;
        public BatchService(IBatchDal batchDal) => _batchDal = batchDal;

        public async Task<object> CreateBatchAsync(Batch batch)
        {
            var id = await _batchDal.CreateAsync(batch);
            return await _batchDal.GetByIdAsync(id);
        }

        public async Task<Batch> GetBatchAsync(Guid id) => await _batchDal.GetByIdAsync(id);

        public async Task<object> GetAllBatchesAsync(int page, int limit)
        {
            var (items, total) = await _batchDal.GetAllPaginatedAsync(page, limit);
            return new
            {
                data = items,
                meta = new
                {
                    total,
                    page,
                    limit,
                    hasNext = (page * limit) < total,
                    hasPrev = page > 1,
                    totalPages = (int)Math.Ceiling((double)total / limit)
                }
            };
        }

        public async Task<Batch> UpdateBatchAsync(Guid id, Batch batch)
        {
            await _batchDal.UpdateAsync(id, batch);
            return await _batchDal.GetByIdAsync(id);
        }

        public async Task<bool> DeleteBatchAsync(Guid id) => await _batchDal.DeleteAsync(id);

        public async Task<Batch> AddMeetingAsync(Guid batchId, ScheduledMeeting meeting)
        {
            await _batchDal.AddMeetingAsync(batchId, meeting);
            return await _batchDal.GetByIdAsync(batchId);
        }

        public async Task<Batch> UpdateMeetingAsync(Guid batchId, Guid meetingId, ScheduledMeeting meeting)
        {
            await _batchDal.UpdateMeetingAsync(batchId, meetingId, meeting);
            return await _batchDal.GetByIdAsync(batchId);
        }

        public async Task<Batch> RemoveMeetingAsync(Guid batchId, Guid meetingId)
        {
            await _batchDal.RemoveMeetingAsync(batchId, meetingId);
            return await _batchDal.GetByIdAsync(batchId);
        }

        public async Task<object> CleanupMeetingsAsync()
        {
            int deletedCount = await _batchDal.CleanupExpiredMeetingsAsync();
            return new { success = true, deletedCount };
        }
    }
}
