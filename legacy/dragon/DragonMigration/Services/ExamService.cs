using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.DataAccess;

namespace EduNex.Services
{
    public interface IExamService
    {
        Task<object> CreateExamAsync(Exam exam);
        Task<object> GetExamsByIdsAsync(IEnumerable<string> ids);
        Task<object> GetExamsByBatchAsync(Guid batchId, Guid? userId, string status, int page, int limit);
        Task<object> GetPaginatedExamsAsync(int page, int limit);
        Task<object> UpdateExamAsync(string examId, Exam exam);
        Task<object> DeleteExamAsync(Guid id);
    }

    public class ExamService : IExamService
    {
        private readonly IExamDal _dal;
        public ExamService(IExamDal dal) => _dal = dal;

        public async Task<object> CreateExamAsync(Exam exam)
        {
            var id = await _dal.CreateAsync(exam);
            // Hook: initializePerformanceRecord would be called here
            return await _dal.GetByIdAsync(id);
        }

        public async Task<object> GetExamsByIdsAsync(IEnumerable<string> ids) => await _dal.FindByIdsAsync(ids);

        public async Task<object> GetExamsByBatchAsync(Guid batchId, Guid? userId, string status, int page, int limit)
        {
            var (exams, total) = await _dal.GetByBatchAndStatusAsync(batchId, status, page, limit);
            var attendedIds = userId.HasValue ? await _dal.GetUserAttendedExamIdsAsync(userId.Value) : new List<Guid>();

            var processedExams = exams.Select(e => {
                e.Status = status == "current" ? "active" : "upcoming";
                
                // Logic: Hide QuestionSheetId if user has already attended or for active exams without userId
                if (e.Status == "active" && (!userId.HasValue || attendedIds.Contains(e.Id)))
                {
                    e.QuestionSheetId = Guid.Empty; // Equivalent to undefined
                }
                return e;
            });

            return new { 
                success = true, 
                data = processedExams,
                pagination = new { total, page, limit, totalPages = (int)Math.Ceiling((double)total / limit), hasNext = (page * limit) < total, hasPrevious = page > 1 }
            };
        }

        public async Task<object> GetPaginatedExamsAsync(int page, int limit)
        {
            var (items, total) = await _dal.GetPaginatedAsync(page, limit);
            return new { 
                success = true, 
                data = items,
                pagination = new { totalObjects = total, totalPages = (int)Math.Ceiling((double)total / limit), currentPage = page, hasNext = (page * limit) < total, hasPrevious = page > 1 }
            };
        }

        public async Task<object> UpdateExamAsync(string examId, Exam exam)
        {
            await _dal.UpdateAsync(examId, exam);
            return await _dal.FindByIdsAsync(new[] { examId });
        }

        public async Task<object> DeleteExamAsync(Guid id) => await _dal.DeleteAsync(id);
    }
}
