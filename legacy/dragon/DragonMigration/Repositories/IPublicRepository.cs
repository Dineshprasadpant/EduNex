using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dragon.Models;
using Dragon.DTOs;

namespace Dragon.Repositories
{
    public interface IPublicRepository
    {
        // Announcements
        Task<(IEnumerable<AnnouncementDto> Items, int Total)> GetAnnouncementsAsync(int page, int limit);
        
        // Courses
        Task<(IEnumerable<CourseDto> Items, int Total)> GetCourseSummaryAsync(int page, int limit);
        
        // Advertisements
        Task<(IEnumerable<AdvertisementDto> Items, int Total)> GetAdvertisementsAsync(int page, int limit);
        
        // Analytics
        Task RecordVisitAsync(int month, int year, bool isNewVisitor, string source);
    }
}
