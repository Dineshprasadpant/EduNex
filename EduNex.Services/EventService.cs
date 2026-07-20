using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduNex.DataAccess;
using EduNex.Models;

namespace EduNex.Services
{
    // 1:1 with eventsService (events.service.ts).
    public interface IEventService
    {
        Task<Event> CreateAsync(CreateEventRequestDto input);
        Task<(List<EventDto> Data, PaginationMeta Meta)> ListAsync(ListEventsQueryDto query, Guid? requesterUserId, string? requesterRole);
        Task<EventDto> GetByIdAsync(Guid id, Guid? requesterUserId, string? requesterRole);
        Task<Event> UpdateAsync(Guid id, UpdateEventRequestDto input);
        Task RemoveAsync(Guid id);
    }

    public class EventService : IEventService
    {
        private readonly IEventDal _eventDal;
        private readonly IMailService _mailService;

        public EventService(IEventDal eventDal, IMailService mailService)
        {
            _eventDal = eventDal;
            _mailService = mailService;
        }

        public async Task<Event> CreateAsync(CreateEventRequestDto input)
        {
            var ev = await _eventDal.CreateAsync(input);
            NotifyAfterCreate(input, ev);
            return ev;
        }

        // Fire-and-forget, matching the Node version's `void (async () => {...})()`
        // -- failures here (subscriber lookup or mail send) must never affect
        // the create() caller, so everything is swallowed.
        private void NotifyAfterCreate(CreateEventRequestDto input, Event ev)
        {
            if (!string.IsNullOrEmpty(input.Privacy) && input.Privacy != PrivacyType.Public) return;

            _ = Task.Run(async () =>
            {
                try
                {
                    var emails = await _eventDal.GetSubscriberEmailsAsync();
                    if (emails.Count == 0) return;

                    await _mailService.SendEventNotificationAsync(emails, new EventMailPayload
                    {
                        Title = ev.Title,
                        Description = ev.Description,
                        StartDate = ev.EventDate.ToString("O"),
                        EndDate = ev.EventDate.ToString("O"),
                        VenueName = ev.Address ?? "",
                        VenueAddress = ev.Address ?? "",
                        EventType = ev.Category,
                    });
                }
                catch
                {
                    // Silent -- event emails are best-effort.
                }
            });
        }

        public async Task<(List<EventDto> Data, PaginationMeta Meta)> ListAsync(
            ListEventsQueryDto query, Guid? requesterUserId, string? requesterRole)
        {
            var pagination = Paginator.Paginate(query.Page.ToString(), query.Limit.ToString());
            var filters = new EventFilters { Search = query.Search };

            if (requesterRole == "admin" || requesterRole == "teacher")
            {
                if (!string.IsNullOrWhiteSpace(query.Privacy)) filters.Privacy = query.Privacy;
            }
            else if (requesterRole == "user" && requesterUserId.HasValue)
            {
                var courseId = await _eventDal.FindStudentCourseIdAsync(requesterUserId.Value);
                if (courseId.HasValue) filters.EnrolledCourseId = courseId;
                else filters.Privacy = PrivacyType.Public;
            }
            else
            {
                filters.Privacy = PrivacyType.Public;
            }

            var (data, total) = await _eventDal.FindAllAsync(
                filters, new DalPagination { Offset = pagination.Offset, Limit = pagination.Limit });

            return (data, PaginationMeta.Create(total, pagination.Page, pagination.Limit));
        }

        public async Task<EventDto> GetByIdAsync(Guid id, Guid? requesterUserId, string? requesterRole)
        {
            var ev = await _eventDal.FindByIdAsync(id);
            if (ev is null) throw new NotFoundException("Event not found");

            if (ev.Privacy == PrivacyType.Public) return ev;
            if (requesterRole == "admin" || requesterRole == "teacher") return ev;

            if (requesterUserId is null) throw new ForbiddenException("Sign in to view this event");

            if (ev.CourseId is null && requesterRole == "user") return ev;

            if (ev.CourseId.HasValue && requesterRole == "user")
            {
                var courseId = await _eventDal.FindStudentCourseIdAsync(requesterUserId.Value);
                if (courseId == ev.CourseId) return ev;
            }

            throw new ForbiddenException("You do not have access to this event");
        }

        public async Task<Event> UpdateAsync(Guid id, UpdateEventRequestDto input)
        {
            var existing = await _eventDal.FindByIdAsync(id);
            if (existing is null) throw new NotFoundException("Event not found");

            return await _eventDal.UpdateAsync(id, input) ?? throw new NotFoundException("Event not found");
        }

        public async Task RemoveAsync(Guid id)
        {
            var existing = await _eventDal.FindByIdAsync(id);
            if (existing is null) throw new NotFoundException("Event not found");
            await _eventDal.RemoveAsync(id);
        }
    }
}