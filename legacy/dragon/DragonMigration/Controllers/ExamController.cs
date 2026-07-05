using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/exams")]
    public class ExamController : ControllerBase
    {
        private readonly IExamService _service;
        public ExamController(IExamService service) => _service = service;

        [HttpPost]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Create([FromBody] Exam exam) => Ok(new { success = true, data = await _service.CreateExamAsync(exam) });

        [HttpPost("by-ids")]
        [Authorize]
        public async Task<IActionResult> GetByIds([FromBody] ExamIdsRequest request) => Ok(new { success = true, data = await _service.GetExamsByIdsAsync(request.ExamIds) });

        [HttpGet("batch/{batchId}")]
        [Authorize]
        public async Task<IActionResult> GetByBatch(Guid batchId, [FromQuery] Guid? userId, [FromQuery] string status, int page = 1, int limit = 10) 
            => Ok(await _service.GetExamsByBatchAsync(batchId, userId, status, page, limit));

        [HttpGet]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> GetAll(int page = 1, int limit = 10) => Ok(await _service.GetPaginatedExamsAsync(page, limit));

        [HttpPut("{examId}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Update(string examId, [FromBody] Exam exam) => Ok(new { success = true, data = await _service.UpdateExamAsync(examId, exam) });

        [HttpDelete("{examId}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Delete(Guid examId) => Ok(new { success = true, data = await _service.DeleteExamAsync(examId) });
    }

    public class ExamIdsRequest { public IEnumerable<string> ExamIds { get; set; } }
}
