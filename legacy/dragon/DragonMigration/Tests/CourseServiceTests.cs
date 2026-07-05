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
    public class CourseServiceTests
    {
        private readonly Mock<ICourseDal> _mockDal;
        private readonly CourseService _service;

        public CourseServiceTests()
        {
            _mockDal = new Mock<ICourseDal>();
            _service = new CourseService(_mockDal.Object);
        }

        [Fact]
        public async Task CreateCourseAsync_CalculatesPrice_ForHybridMode()
        {
            // Arrange
            var course = new Course {
                DeliveryMode = "hybrid",
                OnlinePrice = 500,
                OfflinePrice = 400
            };
            _mockDal.Setup(d => d.CreateAsync(It.IsAny<Course>())).ReturnsAsync(Guid.NewGuid());
            _mockDal.Setup(d => d.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(course);

            // Act
            await _service.CreateCourseAsync(course);

            // Assert
            Assert.Equal(400, course.Price); // Should be min of 500 and 400
        }

        [Fact]
        public async Task GetCoursesSummaryAsync_ReturnsCorrectWrapper()
        {
            // Arrange
            var courses = new List<Course> { new Course { Title = "Test" } };
            _mockDal.Setup(d => d.GetSummaryPaginatedAsync(1, 10))
                    .ReturnsAsync((courses, 1));

            // Act
            var result = await _service.GetCoursesSummaryAsync(1, 10);
            dynamic dynamicResult = result;

            // Assert
            Assert.NotNull(dynamicResult.courses);
            Assert.Equal(1, dynamicResult.pagination.totalItems);
        }
    }
}
