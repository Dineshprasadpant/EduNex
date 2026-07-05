using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.DataAccess;

namespace EduNex.Services
{
    public interface IExamPerformanceService
    {
        Task InitializePerformanceRecordAsync(Guid batchId, string academicYear, Guid examId);
        Task UpdateStudentPerformanceAsync(Guid examId, Guid studentId, decimal percentage);
        Task<object> GetPerformanceByYearAsync(string year, Guid batchId);
        Task<object> GetYearlySummaryAsync(string year, Guid batchId);
    }

    public class ExamPerformanceService : IExamPerformanceService
    {
        private readonly IExamPerformanceDal _dal;
        public ExamPerformanceService(IExamPerformanceDal dal) => _dal = dal;

        public async Task InitializePerformanceRecordAsync(Guid batchId, string academicYear, Guid examId)
        {
            var existing = await _dal.GetByExamIdAsync(examId);
            if (existing != null) throw new Exception("Performance record already exists");
            await _dal.CreateAsync(new ExamPerformance { BatchId = batchId, AcademicYear = academicYear, ExamId = examId });
        }

        public async Task UpdateStudentPerformanceAsync(Guid examId, Guid studentId, decimal percentage)
        {
            var perf = await _dal.GetByExamIdAsync(examId);
            if (perf == null) throw new Exception("Performance record not found");

            // Calculate new overall percentage
            decimal totalPercentage = perf.OverallPercentage * perf.NumberOfExaminees;
            perf.NumberOfExaminees += 1;
            perf.OverallPercentage = (totalPercentage + percentage) / perf.NumberOfExaminees;

            // Update highest scorers (Keep top 10)
            var scorers = perf.HighestScorers.ToList();
            var existing = scorers.FirstOrDefault(s => s.StudentId == studentId);
            if (existing != null)
            {
                if (percentage > existing.Percentage) existing.Percentage = percentage;
            }
            else
            {
                scorers.Add(new HighestScorer { StudentId = studentId, Percentage = percentage });
            }

            perf.HighestScorers = scorers.OrderByDescending(s => s.Percentage).Take(10).ToList();
            await _dal.UpdateAsync(perf.Id, perf);
        }

        public async Task<object> GetPerformanceByYearAsync(string year, Guid batchId) => await _dal.GetByYearAsync(year, batchId);

        public async Task<object> GetYearlySummaryAsync(string year, Guid batchId)
        {
            var records = await _dal.GetByYearAsync(year, batchId);
            return records.Select(r => new { r.Id, r.ExamId, r.OverallPercentage, r.NumberOfExaminees });
        }
    }
}
