using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.DataAccess;

namespace EduNex.Services
{
    public interface ICourseService
    {
        Task<object> GetCoursesSummaryAsync(int page, int limit);
        Task<object> GetCoursesFullDetailsAsync(int page, int limit);
        Task<object> CreateCourseAsync(Course course);
        Task<object> GetCourseByIdAsync(Guid id);
        Task<object> GetByDeliveryModeAsync(string mode, int page, int limit);
        Task<object> UpdateCourseAsync(Guid id, Course course);
        Task<object> DeleteCourseAsync(Guid id);
    }

    public class CourseService : ICourseService
    {
        private readonly ICourseDal _dal;
        public CourseService(ICourseDal dal) => _dal = dal;

        public async Task<object> GetCoursesSummaryAsync(int page, int limit)
        {
            var (items, total) = await _dal.GetSummaryPaginatedAsync(page, limit);
            return WrapResponse(items, total, page, limit);
        }

        public async Task<object> GetCoursesFullDetailsAsync(int page, int limit)
        {
            var (items, total) = await _dal.GetFullDetailsPaginatedAsync(page, limit);
            return WrapResponse(items, total, page, limit);
        }

        public async Task<object> CreateCourseAsync(Course course)
        {
            // Price calculation logic
            if (course.DeliveryMode == "online") course.Price = course.OnlinePrice;
            else if (course.DeliveryMode == "offline") course.Price = course.OfflinePrice;
            else if (course.DeliveryMode == "hybrid") course.Price = Math.Min(course.OnlinePrice, course.OfflinePrice);

            var id = await _dal.CreateAsync(course);
            var result = await _dal.GetByIdAsync(id);
            return new { status = "success", data = new { course = result } };
        }

        public async Task<object> GetCourseByIdAsync(Guid id)
        {
            var course = await _dal.GetByIdAsync(id);
            if (course == null) throw new Exception("Course not found");
            return new { status = "success", data = course };
        }

        public async Task<object> GetByDeliveryModeAsync(string mode, int page, int limit)
        {
            var (items, total) = await _dal.GetByDeliveryModeAsync(mode, page, limit);
            return WrapResponse(items, total, page, limit);
        }

        public async Task<object> UpdateCourseAsync(Guid id, Course course)
        {
            await _dal.UpdateAsync(id, course);
            var result = await _dal.GetByIdAsync(id);
            return new { status = "success", data = new { course = result } };
        }

        public async Task<object> DeleteCourseAsync(Guid id)
        {
            await _dal.DeleteAsync(id);
            return new { status = "success", message = "Course deleted successfully" };
        }

        private object WrapResponse(IEnumerable<Course> items, int total, int page, int limit)
        {
            return new
            {
                courses = items,
                pagination = new
                {
                    currentPage = page,
                    itemsPerPage = limit,
                    totalItems = total,
                    totalPages = (int)Math.Ceiling((double)total / limit),
                    hasNextPage = (page * limit) < total,
                    hasPreviousPage = page > 1
                }
            };
        }
    }
}
