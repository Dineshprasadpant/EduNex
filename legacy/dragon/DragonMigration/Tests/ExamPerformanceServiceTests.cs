using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.DataAccess;
using EduNex.Services;
using Moq;
using Xunit;

namespace EduNex.Tests
{
    public class ExamPerformanceServiceTests
    {
        private readonly Mock<IExamPerformanceDal> _mockDal;
        private readonly ExamPerformanceService _service;

        public ExamPerformanceServiceTests()
        {
            _mockDal = new Mock<IExamPerformanceDal>();
            _service = new ExamPerformanceService(_mockDal.Object);
        }

        [Fact]
        public async Task UpdateStudentPerformanceAsync_CalculatesCorrectAverage()
        {
            // Arrange
            var examId = Guid.NewGuid();
            var perf = new ExamPerformance {
                Id = Guid.NewGuid(),
                OverallPercentage = 50, // 50% average
                NumberOfExaminees = 1,  // 1 student
                HighestScorers = new List<HighestScorer> { new HighestScorer { StudentId = Guid.NewGuid(), Percentage = 50 } }
            };
            _mockDal.Setup(d => d.GetByExamIdAsync(examId)).ReturnsAsync(perf);

            // Act: Add a second student with 100%
            await _service.UpdateStudentPerformanceAsync(examId, Guid.NewGuid(), 100);

            // Assert: (50 + 100) / 2 = 75
            Assert.Equal(75, perf.OverallPercentage);
            Assert.Equal(2, perf.NumberOfExaminees);
        }

        [Fact]
        public async Task UpdateStudentPerformanceAsync_KeepsOnlyTop10Scorers()
        {
            // Arrange
            var examId = Guid.NewGuid();
            var scorers = new List<HighestScorer>();
            for (int i = 0; i < 10; i++) scorers.Add(new HighestScorer { StudentId = Guid.NewGuid(), Percentage = 60 + i });
            
            var perf = new ExamPerformance {
                Id = Guid.NewGuid(),
                HighestScorers = scorers
            };
            _mockDal.Setup(d => d.GetByExamIdAsync(examId)).ReturnsAsync(perf);

            // Act: Add an 11th student with 100%
            await _service.UpdateStudentPerformanceAsync(examId, Guid.NewGuid(), 100);

            // Assert
            Assert.Equal(10, perf.HighestScorers.Count);
            Assert.Contains(perf.HighestScorers, s => s.Percentage == 100);
            Assert.DoesNotContain(perf.HighestScorers, s => s.Percentage == 60); // Lowest should be dropped
        }
    }
}
