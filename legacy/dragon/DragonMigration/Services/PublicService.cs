using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dragon.DTOs;
using Dragon.Repositories;

namespace Dragon.Services
{
    public interface IPublicService
    {
        Task<object> GetAnnouncementsAsync(int page, int limit);
        Task<object> GetCourseSummaryAsync(int page, int limit);
        Task<object> GetAdvertisementsAsync(int page, int limit);
        Task RecordVisitAsync(bool isNewVisitor, string source);
    }

    public class PublicService : IPublicService
    {
        private readonly IPublicRepository _publicRepository;

        public PublicService(IPublicRepository publicRepository)
        {
            _publicRepository = publicRepository;
        }

        public async Task<object> GetAnnouncementsAsync(int page, int limit)
        {
            var (items, total) = await _publicRepository.GetAnnouncementsAsync(page, limit);
            return new { 
                data = new {
                    total,
                    page,
                    limit,
                    announcements = items
                }
            };
        }

        public async Task<object> GetCourseSummaryAsync(int page, int limit)
        {
            var (items, total) = await _publicRepository.GetCourseSummaryAsync(page, limit);
            return new { 
                status = "success", 
                data = new {
                    courses = items,
                    pagination = new {
                        currentPage = page,
                        itemsPerPage = limit,
                        totalItems = total,
                        totalPages = (int)Math.Ceiling((double)total / limit),
                        hasNextPage = page * limit < total,
                        hasPreviousPage = page > 1
                    }
                }
            };
        }

        public async Task<object> GetAdvertisementsAsync(int page, int limit)
        {
            var (items, total) = await _publicRepository.GetAdvertisementsAsync(page, limit);
            return new { 
                currentObjects = items, 
                totalObjects = total, 
                currentPage = page, 
                totalPages = (int)Math.Ceiling((double)total / limit) 
            };
        }

        public async Task RecordVisitAsync(bool isNewVisitor, string source)
        {
            var now = DateTime.UtcNow;
            await _publicRepository.RecordVisitAsync(now.Month, now.Year, isNewVisitor, source);
        }
    }
}
