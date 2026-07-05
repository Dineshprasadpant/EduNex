
using EduNex.Models;
using EduNex.DataAccess;

namespace EduNex.Services
{
    public interface IQuestionSheetService
    {
        Task<object> GetAllQuestionSheetsAsync(int page, int pageSize);
        Task<object> GetQuestionSheetByIdAsync(Guid id, bool includeAnswers);
        Task<object> CreateQuestionSheetAsync(QuestionSheet sheet);
        Task<object> UpdateQuestionSheetAsync(Guid id, QuestionSheet sheet);
        Task<object> DeleteQuestionSheetAsync(Guid id);
        Task<object> SaveExamResultsAsync(Guid userId, Guid examId, string examName, int totalQuestions, int correctAnswers, decimal marksObtained, decimal totalMarks, decimal percentage, int unAnswered, List<string> answers);
    }

    public class QuestionSheetService : IQuestionSheetService
    {
        private readonly IQuestionSheetDal _dal;
        private readonly IExamPerformanceService _perfService;
        private readonly IUserDal _userRepo; // Reusing existing User repository

        public QuestionSheetService(IQuestionSheetDal dal, IExamPerformanceService perfService, IUserDal userRepo)
        {
            _dal = dal;
            _perfService = perfService;
            _userRepo = userRepo;
        }

        public async Task<object> GetAllQuestionSheetsAsync(int page, int limit)
        {
            var (items, total) = await _dal.GetAllPaginatedAsync(page, limit);

            var totalPages = (int)Math.Ceiling((double)total / limit);

            return new
            {
                success = true,
                data = items,
                pagination = new
                {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNext = page < totalPages,
                    hasPrevious = page > 1
                }
            };
        }
        public async Task<object> GetQuestionSheetByIdAsync(Guid id, bool includeAnswers)
        {
            var sheet = await _dal.GetByIdAsync(id);
            if (!includeAnswers && sheet != null)
            {
                foreach (var q in sheet.Questions) q.CorrectAnswer = null;
            }
            return new { success = true, data = sheet };
        }

        public async Task<object> CreateQuestionSheetAsync(QuestionSheet sheet)
        {
            var id = await _dal.CreateAsync(sheet);
            return new { success = true, data = await _dal.GetByIdAsync(id) };
        }

        public async Task<object> UpdateQuestionSheetAsync(Guid id, QuestionSheet sheet)
        {
            await _dal.UpdateAsync(id, sheet);
            return new { success = true, data = await _dal.GetByIdAsync(id) };
        }

        public async Task<object> DeleteQuestionSheetAsync(Guid id)
        {
            await _dal.DeleteAsync(id);
            return new { success = true, message = "Question sheet deleted successfully" };
        }

        public async Task<object> SaveExamResultsAsync(Guid userId, Guid examId, string examName, int totalQuestions, int correctAnswers, decimal marksObtained, decimal totalMarks, decimal percentage, int unAnswered, List<string> answers)
        {
            // 1. Record attempt in User record (Simplified DTO used here)
            // await _userRepo.AddExamResultAsync(userId, ...); 

            // 2. Update overall performance
            await _perfService.UpdateStudentPerformanceAsync(examId, userId, percentage);

            return new { message = "Result ucessfully recorded" };
        }
    }
}
