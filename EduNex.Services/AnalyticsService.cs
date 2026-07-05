using System;
using System.Threading.Tasks;
using EduNex.DataAccess;
namespace EduNex.Services
{
    public interface IAnalyticsService
    {
        Task TrackVisitAsync(bool isNewVisitor, string source);
        Task TrackSubscriberAsync();
        Task TrackEnrollmentAsync(string plan);
        Task<object> FetchMonthlyDataAsync(int month, int year);
        Task<object> FetchYearlyDataAsync(int year);
        Task<object> FetchAllDataAsync();
    }

    public class AnalyticsService : IAnalyticsService
    {
        private readonly IAnalyticsDal _repo;
        public AnalyticsService(IAnalyticsDal repo) => _repo = repo;

        public async Task TrackVisitAsync(bool isNewVisitor, string source)
        {
            var now = DateTime.UtcNow;
            await _repo.RecordVisitAsync(now.Month, now.Year, isNewVisitor, source);
        }

        public async Task TrackSubscriberAsync()
        {
            var now = DateTime.UtcNow;
            await _repo.IncrementSubscribersAsync(now.Month, now.Year);
        }

        public async Task TrackEnrollmentAsync(string plan)
        {
            var now = DateTime.UtcNow;
            await _repo.IncrementEnrollmentAsync(now.Month, now.Year, plan);
        }

        public async Task<object> FetchMonthlyDataAsync(int month, int year) => await _repo.GetByMonthYearAsync(month, year);
        public async Task<object> FetchYearlyDataAsync(int year) => await _repo.GetByYearAsync(year);
        public async Task<object> FetchAllDataAsync() => await _repo.GetAllAsync();
    }
}
