using EduNex.Models;
using EduNex.Models.Dtos;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/question-sheets")]
    [Authorize(Roles = "admin,teacher")]
    public class QuestionSheetController : ControllerBase
    {
        private readonly IQuestionSheetService _service;
        public QuestionSheetController(IQuestionSheetService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> ListSheets([FromQuery] int page = 1, [FromQuery] int limit = 10, [FromQuery] string? search = null)
        {
            var (data, meta) = await _service.ListSheetsAsync(page, limit, search);
            return Ok(new ApiListResponse<QuestionSheetDto> { Data = data, Meta = (PaginationMeta?)meta });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetSheetById(Guid id)
        {
            var sheet = await _service.GetSheetByIdAsync(id);
            return Ok(new ApiDataResponse<QuestionSheetDto> { Data = sheet });
        }

        [HttpPost]
        public async Task<IActionResult> CreateSheet([FromBody] CreateSheetDto input)
        {
            var userId = Guid.TryParse(User.FindFirst("userId")?.Value, out var uid) ? uid : (Guid?)null;
            var sheet = await _service.CreateSheetAsync(input, userId);
            return StatusCode(201, new ApiDataResponse<QuestionSheetDto> { Data = sheet });
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateSheet(Guid id, [FromBody] UpdateSheetDto input)
        {
            var sheet = await _service.UpdateSheetAsync(id, input);
            return Ok(new ApiDataResponse<QuestionSheetDto> { Data = sheet });
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteSheet(Guid id)
        {
            await _service.DeleteSheetAsync(id);
            return NoContent();
        }

        [HttpPost("{id:guid}/questions")]
        public async Task<IActionResult> AddQuestion(Guid id, [FromBody] CreateQuestionDto input)
        {
            var question = await _service.AddQuestionAsync(id, input);
            return StatusCode(201, new ApiDataResponse<QuestionDto> { Data = question });
        }

        [HttpPut("{id:guid}/questions/{qId:guid}")]
        public async Task<IActionResult> UpdateQuestion(Guid id, Guid qId, [FromBody] UpdateQuestionDto input)
        {
            var question = await _service.UpdateQuestionAsync(id, qId, input);
            return Ok(new ApiDataResponse<QuestionDto> { Data = question });
        }

        [HttpDelete("{id:guid}/questions/{qId:guid}")]
        public async Task<IActionResult> DeleteQuestion(Guid id, Guid qId)
        {
            await _service.DeleteQuestionAsync(id, qId);
            return NoContent();
        }

        [HttpPost("{id:guid}/import")]
        public async Task<IActionResult> ImportQuestions(Guid id, [FromBody] ImportQuestionsDto input)
        {
            var questions = await _service.ImportQuestionsAsync(id, input);
            return StatusCode(201, new ApiDataResponse<List<QuestionDto>> { Data = questions });
        }

        [HttpPatch("{id:guid}/questions/reorder")]
        public async Task<IActionResult> ReorderQuestions(Guid id, [FromBody] ReorderQuestionsDto input)
        {
            await _service.ReorderQuestionsAsync(id, input);
            return Ok(new { success = true });
        }
    }
}
