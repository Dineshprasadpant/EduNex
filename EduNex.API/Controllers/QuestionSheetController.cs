using System;
using System.Security.Claims;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    // Question sheets are answer-key material. Only admin/teacher can
    // browse them directly — students never hit these endpoints; the
    // exam-attempt flow (separate controller) strips answers.
    [ApiController]
    [Route("api/question-sheets")]
    [Authorize(Roles = "admin,teacher")]
    public class QuestionsController : ControllerBase
    {
        private readonly IQuestionsService _service;
        public QuestionsController(IQuestionsService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> ListSheets(
            [FromQuery] int page = 1, [FromQuery] int limit = 10, [FromQuery] string? search = null)
        {
            var (data, meta) = await _service.ListSheetsAsync(page, limit, search);
            return Ok(new { data, meta = new { meta.Total, meta.Page, meta.Limit, meta.TotalPages } });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetSheetById(Guid id)
        {
            var sheet = await _service.GetSheetByIdAsync(id);
            if (sheet == null) return NotFound(new { message = "Question sheet not found" });
            return Ok(new { success = true, data = sheet });
        }

        [HttpPost]
        public async Task<IActionResult> CreateSheet([FromBody] CreateSheetRequest request)
        {
            var sheet = await _service.CreateSheetAsync(request, GetCurrentUserId());
            return Created(string.Empty, sheet);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateSheet(Guid id, [FromBody] UpdateSheetRequest request)
        {
            var sheet = await _service.UpdateSheetAsync(id, request);
            if (sheet == null) return NotFound(new { message = "Question sheet not found" });
            return Ok(sheet);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteSheet(Guid id)
        {
            var deleted = await _service.DeleteSheetAsync(id);
            if (!deleted) return NotFound(new { message = "Question sheet not found" });
            return NoContent();
        }

        [HttpPost("{id:guid}/questions")]
        public async Task<IActionResult> AddQuestion(Guid id, [FromBody] CreateQuestionRequest request)
        {
            var result = await _service.AddQuestionAsync(id, request);
            if (result.Status == QuestionOpStatus.SheetNotFound)
                return NotFound(new { message = "Question sheet not found" });
            return Created(string.Empty, result.Value);
        }

        [HttpPut("{id:guid}/questions/{qId:guid}")]
        public async Task<IActionResult> UpdateQuestion(Guid id, Guid qId, [FromBody] UpdateQuestionRequest request)
        {
            var result = await _service.UpdateQuestionAsync(id, qId, request);
            return result.Status switch
            {
                QuestionOpStatus.SheetNotFound => NotFound(new { message = "Question sheet not found" }),
                QuestionOpStatus.QuestionNotFound => NotFound(new { message = "Question not found in this sheet" }),
                _ => Ok(result.Value)
            };
        }

        [HttpDelete("{id:guid}/questions/{qId:guid}")]
        public async Task<IActionResult> DeleteQuestion(Guid id, Guid qId)
        {
            var status = await _service.DeleteQuestionAsync(id, qId);
            return status switch
            {
                QuestionOpStatus.SheetNotFound => NotFound(new { message = "Question sheet not found" }),
                QuestionOpStatus.QuestionNotFound => NotFound(new { message = "Question not found in this sheet" }),
                _ => NoContent()
            };
        }

        [HttpPost("{id:guid}/import")]
        public async Task<IActionResult> ImportQuestions(Guid id, [FromBody] ImportQuestionsRequest request)
        {
            var result = await _service.ImportQuestionsAsync(id, request);
            if (result.Status == QuestionOpStatus.SheetNotFound)
                return NotFound(new { message = "Question sheet not found" });
            return Created(string.Empty, result.Value);
        }

        [HttpPatch("{id:guid}/questions/reorder")]
        public async Task<IActionResult> ReorderQuestions(Guid id, [FromBody] ReorderQuestionsRequest request)
        {
            var ok = await _service.ReorderQuestionsAsync(id, request);
            if (!ok) return NotFound(new { message = "Question sheet not found" });
            return Ok(new { ok = true });
        }

        private Guid? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : null;
        }
    }
}