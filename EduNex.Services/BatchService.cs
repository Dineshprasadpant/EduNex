using EduNex.DataAccess;
using EduNex.Models;
using System;
using System.Threading.Tasks;
using static EduNex.DataAccess.BatchDal;

namespace EduNex.Services
{
    public interface IBatchService
    {
        Task<object> CreateBatchAsync(createBatchDto batch);
        Task<Batch> GetBatchAsync(Guid id);
        Task<object> GetAllBatchesAsync(int page, int limit);
        Task<Batch> UpdateBatchAsync(Guid id, createBatchDto batch);
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

        public async Task<object> CreateBatchAsync(createBatchDto batch)
        {
            var id = await _batchDal.CreateAsync(batch);
            return await _batchDal.GetByIdAsync(id);
        }

        public async Task<Batch> GetBatchAsync(Guid id) => await _batchDal.GetByIdAsync(id);
        public async Task<object> GetAllBatchesAsync(int page, int limit)
        {
            var (items, total) = await _batchDal.GetAllPaginatedAsync(page, limit);

            var totalPages = (int)Math.Ceiling((double)total / limit);

            return new 
            {
                data = items.Select(x => new BatchResponseDto
                {
                    _id = x.Id.ToString(),
                    batch_name = x.BatchName,
                    course = x.CourseId == null ? null : new CourseDto
                    {
                        _id = x.CourseId.ToString(),
                        title = x.CourseTitle
                    },
                    createdAt = x.CreatedAt,
                    updatedAt = x.UpdatedAt
                }).ToList(),

                meta = new 
                {
                    total = total,
                    page = page,
                    limit = limit,
                    hasNext = page < totalPages,
                    hasPrev = page > 1,
                    totalPages = totalPages
                }
            };
        }
        public async Task<Batch> UpdateBatchAsync(Guid id, createBatchDto batch)
        {
            Batch b= await _batchDal.GetByIdAsync(id);
            if (b == null)
                return null;
            b.BatchName = batch.batch_name;
            await _batchDal.UpdateAsync(id, b);
            return b;
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
