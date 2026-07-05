using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.DataAccess;

namespace EduNex.Services
{
    public interface IEventService
    {
        Task<Event> CreateEventAsync(Event @event);
        Task<Event> GetEventAsync(Guid id);
        Task<object> GetByMonthAndYearAsync(string month, string year);
        Task<object> GetAllEventsAsync(int page, int limit);
        Task<Event> UpdateEventAsync(Guid id, Event @event);
        Task<object> DeleteEventAsync(Guid id);
    }

    public class EventService : IEventService
    {
        private readonly IEventDal _dal;
        public EventService(IEventDal dal) => _dal = dal;

        public async Task<Event> CreateEventAsync(Event ev)
        {
            var id = await _dal.CreateAsync(ev);
            return await _dal.GetByIdAsync(id);
        }

        public async Task<Event> GetEventAsync(Guid id) => await _dal.GetByIdAsync(id);

        public async Task<object> GetByMonthAndYearAsync(string month, string year)
        {
            var items = await _dal.GetByMonthAndYearAsync(month, year);
            return new { data = items };
        }

        public async Task<object> GetAllEventsAsync(int page, int limit)
        {
            var (items, total) = await _dal.GetAllPaginatedAsync(page, limit);
            return new { data = items, page, limit, total };
        }

        public async Task<Event> UpdateEventAsync(Guid id, Event ev)
        {
            await _dal.UpdateAsync(id, ev);
            return await _dal.GetByIdAsync(id);
        }

        public async Task<object> DeleteEventAsync(Guid id)
        {
            var ev = await _dal.GetByIdAsync(id);
            await _dal.DeleteAsync(id);
            return new { message = "Event deleted successfully", @event = ev };
        }
    }
}
