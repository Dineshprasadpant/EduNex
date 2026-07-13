using EduNex.DataAccess;
using EduNex.Models;

namespace EduNex.Services
{
    public interface ISubscriberService
    {
        Task<object> AddSubscriberAsync(string email);
        Task<PagedResponse<Subscriber>> GetSubscribersAsync(int page, int limit);
        Task<bool> RemoveSubscriberAsync(string email);
        Task<Subscriber?> GetSubscriberByEmailAsync(string email);
    }

    public class SubscriberService : ISubscriberService
    {
        private readonly ISubscriberDal _dal;
        private readonly IAnalyticsService _analytics;

        public SubscriberService(ISubscriberDal dal, IAnalyticsService analytics)
        {
            _dal = dal;
            _analytics = analytics;
        }

        public async Task<object> AddSubscriberAsync(string email)
        {
            //if (await _dal.ExistsAsync(email))
            //    throw new Exception("Email already subscribed.");

            //await _dal.CreateAsync(email);
            //await _analytics.();
            return new { message = "Subscriber added successfully." };
        }

        public async Task<PagedResponse<Subscriber>> GetSubscribersAsync(int page, int limit)
        {
            return (await _dal.GetPaginatedAsync(page, limit)).ToPagedResponse(page, limit);
        }

        public async Task<bool> RemoveSubscriberAsync(string email) => await _dal.DeleteAsync(email);

        public async Task<Subscriber?> GetSubscriberByEmailAsync(string email) => await _dal.GetByEmailAsync(email);
    }
}