using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduNex.DataAccess;
using EduNex.Models;
using EduNex.Models.Dtos;

namespace EduNex.Services
{
    public interface IEventService
    {
        Task<(List<EventDto> Data, object? Meta)> ListAsync(int page, int limit, string? privacy, string? search);
        Task<EventDto> GetByIdAsync(Guid id);
        Task<EventDto> CreateAsync(CreateEventDto input);
        Task<EventDto> UpdateAsync(Guid id, UpdateEventDto input);
        Task DeleteAsync(Guid id);
    }

    public class EventService : IEventService
    {
        private readonly IEventDal _dal;
        public EventService(IEventDal dal) => _dal = dal;

        public async Task<(List<EventDto> Data, object? Meta)> ListAsync(int page, int limit, string? privacy, string? search)
        {
            int p = Math.Max(1, page);
            int l = Math.Min(100, Math.Max(1, limit));
            int offset = (p - 1) * l;

            var result = await _dal.ListAsync(l, offset, privacy, search);
            var meta = new { Page = p, Limit = l, Total = result.Total, TotalPages = (int)Math.Ceiling((double)result.Total / l) };
            return (result.Data, meta);
        }

        public async Task<EventDto> GetByIdAsync(Guid id)
        {
            var ev = await _dal.GetByIdAsync(id);
            if (ev == null) throw new Exception("Event not found");
            return ev;
        }

        public async Task<EventDto> CreateAsync(CreateEventDto input)
        {
            var id = await _dal.CreateAsync(input);
            return await _dal.GetByIdAsync(id) ?? throw new Exception("Failed to retrieve created event");
        }

        public async Task<EventDto> UpdateAsync(Guid id, UpdateEventDto input)
        {
            var updated = await _dal.UpdateAsync(id, input);
            if (updated == null) throw new Exception("Event not found");
            return updated;
        }

        public async Task DeleteAsync(Guid id)
        {
            await _dal.DeleteAsync(id);
        }
    }
}
