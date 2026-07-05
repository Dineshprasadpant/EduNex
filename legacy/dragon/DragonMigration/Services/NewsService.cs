using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.DataAccess;

namespace EduNex.Services
{
    public interface INewsService
    {
        Task<object> CreateNewsAsync(News news);
        Task<object> GetNewsByIdAsync(Guid id);
        Task<object> GetAllNewsAsync(int page, int limit);
        Task<object> UpdateNewsAsync(Guid id, News news);
        Task DeleteNewsAsync(Guid id);
    }

    public class NewsService : INewsService
    {
        private readonly INewsDal _dal;
        public NewsService(INewsDal dal) => _dal = dal;

        public async Task<object> CreateNewsAsync(News news)
        {
            var id = await _dal.CreateAsync(news);
            return await _dal.GetByIdAsync(id);
        }

        public async Task<object> GetNewsByIdAsync(Guid id) => await _dal.GetByIdAsync(id);

        public async Task<object> GetAllNewsAsync(int page, int limit)
        {
            var (items, total) = await _dal.GetPaginatedAsync(page, limit);
            return new { data = items, pagination = new { total, page, limit, totalPages = (int)Math.Ceiling((double)total / limit) } };
        }

        public async Task<object> UpdateNewsAsync(Guid id, News news)
        {
            await _dal.UpdateAsync(id, news);
            return await _dal.GetByIdAsync(id);
        }

        public async Task DeleteNewsAsync(Guid id) => await _dal.DeleteAsync(id);
    }
}
