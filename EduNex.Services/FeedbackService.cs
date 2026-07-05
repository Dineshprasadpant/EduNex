using EduNex.DataAccess;
using EduNex.Models;

namespace EduNex.Services
{
    public interface IFeedbackService
    {
        Task<object> CreateFeedbackAsync(Feedback feedback);
        Task<PagedResponse<Feedback>> GetFeedbacksAsync(int page, int limit);
        Task<PagedResponse<Feedback>> GetPositiveFeedbacksAsync(int page, int limit);
        Task<object> DeleteFeedbackAsync(Guid id);
    }

    public class FeedbackService : IFeedbackService
    {
        private readonly IFeedbackDal _dal;
        public FeedbackService(IFeedbackDal dal) => _dal = dal;

        public async Task<object> CreateFeedbackAsync(Feedback fb)
        {
            if (fb.Rating < 1 || fb.Rating > 5)
                throw new Exception("Rating must be between 1 and 5.");

            var id = await _dal.CreateAsync(fb);
            var result = await _dal.GetByIdAsync(id);
            return new { success = true, data = result };
        }

        public async Task<PagedResponse<Feedback>> GetFeedbacksAsync(int page, int limit)
        {
            return (await _dal.GetPaginatedAsync(page, limit)).ToPagedResponse(page, limit);
        }

        public async Task<PagedResponse<Feedback>> GetPositiveFeedbacksAsync(int page, int limit)
        {
            return (await _dal.GetPositivePaginatedAsync(page, limit)).ToPagedResponse(page, limit);
        }

        public async Task<object> DeleteFeedbackAsync(Guid id)
        {
            if (!await _dal.DeleteAsync(id))
                throw new Exception("Feedback not found.");
            return new { success = true, message = "Feedback deleted successfully." };
        }
    }
}