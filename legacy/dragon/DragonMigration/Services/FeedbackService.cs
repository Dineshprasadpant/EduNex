using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.DataAccess;

namespace EduNex.Services
{
    public interface IFeedbackService
    {
        Task<object> CreateFeedbackAsync(Feedback feedback);
        Task<object> GetFeedbacksAsync(int page, int limit);
        Task<object> GetPositiveFeedbacksAsync(int page, int limit);
        Task<object> DeleteFeedbackAsync(Guid id);
    }

    public class FeedbackService : IFeedbackService
    {
        private readonly IFeedbackDal _dal;
        public FeedbackService(IFeedbackDal dal) => _dal = dal;

        public async Task<object> CreateFeedbackAsync(Feedback fb)
        {
            if (fb.Rating < 1 || fb.Rating > 5) throw new Exception("Rating must be between 1 and 5");
            
            var id = await _dal.CreateAsync(fb);
            var result = await _dal.GetByIdAsync(id);
            return new { status = "success", data = result };
        }

        public async Task<object> GetFeedbacksAsync(int page, int limit)
        {
            var (items, total) = await _dal.GetPaginatedAsync(page, limit);
            return WrapResponse(items, total, page, limit);
        }

        public async Task<object> GetPositiveFeedbacksAsync(int page, int limit)
        {
            var (items, total) = await _dal.GetPositivePaginatedAsync(page, limit);
            return WrapResponse(items, total, page, limit);
        }

        public async Task<object> DeleteFeedbackAsync(Guid id)
        {
            var success = await _dal.DeleteAsync(id);
            if (!success) throw new Exception("Feedback not found");
            return new { success = true, message = "Feedback deleted successfully" };
        }

        private object WrapResponse(IEnumerable<Feedback> items, int total, int page, int limit)
        {
            return new
            {
                data = items,
                pagination = new
                {
                    total,
                    page,
                    limit,
                    totalPages = (int)Math.Ceiling((double)total / limit)
                }
            };
        }
    }
}
