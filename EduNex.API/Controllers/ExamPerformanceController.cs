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
    [Route("api/performance")]
    public class ExamPerformanceController : ControllerBase
    {
        private readonly IExamPerformanceService _service;
        public ExamPerformanceController(IExamPerformanceService service) => _service = service;

        [HttpPost("initialize")]
        public async Task<IActionResult> Initialize([FromBody] dynamic data) 
        {
            try { await _service.InitializePerformanceRecordAsync((Guid)data.batchId, (string)data.academicYear, (Guid)data.examId); return Ok(new { success = true }); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet("year/{academicYear}/{batchId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetByYear(string academicYear, Guid batchId) => Ok(await _service.GetPerformanceByYearAsync(academicYear, batchId));

        [HttpGet("summary/{academicYear}/{batchId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetSummary(string academicYear, Guid batchId) => Ok(await _service.GetYearlySummaryAsync(academicYear, batchId));
    }
}
