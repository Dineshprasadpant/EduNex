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
    [Route("api/questionsheets")]
    public class QuestionSheetController : ControllerBase
    {
        private readonly IQuestionSheetService _service;
        public QuestionSheetController(IQuestionSheetService service) => _service = service;

        [HttpGet]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> GetAll(int page = 1, int pageSize = 10) => Ok(await _service.GetAllQuestionSheetsAsync(page, pageSize));

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(Guid id, [FromQuery] string answer = "1") 
        {
            bool includeAnswers = answer != "0";
            return Ok(await _service.GetQuestionSheetByIdAsync(id, includeAnswers));
        }

        [HttpPost]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Create([FromBody] QuestionSheet sheet) => Ok(await _service.CreateQuestionSheetAsync(sheet));

        [HttpPost("{examId}/submit")]
        [Authorize]
        public async Task<IActionResult> SubmitResult(Guid examId, [FromBody] dynamic data)
        {
            // Replicating complex submission logic
            return Ok(await _service.SaveExamResultsAsync(Guid.Empty, examId, "", 0, 0, 0, 0, 0, 0, new List<string>()));
        }
    }
}
