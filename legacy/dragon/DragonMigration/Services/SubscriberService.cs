using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.DataAccess;

namespace EduNex.Services
{
    public interface ISubscriberService
    {
        Task<object> AddSubscriberAsync(string email);
        Task<object> GetSubscribersAsync(int page, int limit);
        Task<bool> RemoveSubscriberAsync(string email);
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
            if (await _dal.ExistsAsync(email)) throw new Exception("Email already subscribed");
            await _dal.CreateAsync(email);
            await _analytics.TrackSubscriberAsync();
            return new { message = "Subscriber Added Sucessfully" };
        }

        public async Task<object> GetSubscribersAsync(int page, int limit)
        {
            var (items, total) = await _dal.GetPaginatedAsync(page, limit);
            return new { data = items, meta = new { total, page, limit, totalPages = (int)Math.Ceiling((double)total / limit) } };
        }

        public async Task<bool> RemoveSubscriberAsync(string email) => await _dal.DeleteAsync(email);
    }
}
