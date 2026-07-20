
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/exams")]
    [Authorize]
    public class ExamController : ControllerBase
    {
        private readonly IExamService _examService;

        public ExamController(IExamService examService)
        {
            _examService = examService;
        }

        private Guid GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (claim is null || !Guid.TryParse(claim, out var userId))
                throw new UnauthorizedException("Invalid or expired token");
            return userId;
        }

        private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

        [HttpGet]
        [ProducesResponseType(typeof(ApiListResponse<ExamListItemDto>), 200)]
        public async Task<IActionResult> List([FromQuery] ListExamsQueryDto query)
        {
            var (data, meta) = await _examService.ListExamsAsync(query, GetUserId(), GetUserRole());
            return Ok(new ApiListResponse<ExamListItemDto> { Data = data, Meta = meta });
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(ApiDataResponse<ExamDetailDto>), 200)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var exam = await _examService.GetExamByIdAsync(id);
            return Ok(new ApiDataResponse<ExamDetailDto> { Data = exam });
        }

        [HttpPost]
        [Authorize(Roles = "admin,teacher")]
        [ProducesResponseType(typeof(ApiDataResponse<Exam>), 201)]
        public async Task<IActionResult> Create([FromBody] CreateExamRequestDto request)
        {
            var exam = await _examService.CreateExamAsync(request, GetUserId());
            return StatusCode(201, new ApiDataResponse<Exam> { Data = exam });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "admin,teacher")]
        [ProducesResponseType(typeof(ApiDataResponse<Exam>), 200)]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateExamRequestDto request)
        {
            var exam = await _examService.UpdateExamAsync(id, request);
            return Ok(new ApiDataResponse<Exam> { Data = exam });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "admin")]
        [ProducesResponseType(204)]
        public async Task<IActionResult> Remove(Guid id)
        {
            await _examService.DeleteExamAsync(id);
            return NoContent();
        }

        // ===================================================================
        // exam-attempts.routes.ts
        // ===================================================================

        [HttpPost("~/api/exam-attempts/exams/{examId:guid}/start")]
        [ProducesResponseType(typeof(ApiDataResponse<StartAttemptResultDto>), 201)]
        public async Task<IActionResult> StartAttempt(Guid examId)
        {
            var result = await _examService.StartAttemptAsync(GetUserId(), examId);
            return StatusCode(201, new ApiDataResponse<StartAttemptResultDto> { Data = result });
        }

        [HttpGet("~/api/exam-attempts/all")]
        [Authorize(Roles = "admin,teacher")]
        [ProducesResponseType(typeof(ApiListResponse<AllAttemptsRowDto>), 200)]
        public async Task<IActionResult> ListAllAttempts([FromQuery] AttemptsPaginationQueryDto query)
        {
            var (data, meta) = await _examService.ListAllAttemptsAsync(query);
            return Ok(new ApiListResponse<AllAttemptsRowDto> { Data = data, Meta = meta });
        }

        [HttpGet("~/api/exam-attempts/history")]
        [ProducesResponseType(typeof(ApiListResponse<AttemptHistoryRowDto>), 200)]
        public async Task<IActionResult> GetHistory([FromQuery] ListHistoryQueryDto query)
        {
            var (data, meta) = await _examService.GetHistoryAsync(GetUserId(), query);
            return Ok(new ApiListResponse<AttemptHistoryRowDto> { Data = data, Meta = meta });
        }

        [HttpGet("~/api/exam-attempts/exam/{examId:guid}")]
        [Authorize(Roles = "admin,teacher")]
        [ProducesResponseType(typeof(ApiListResponse<ExamAttemptRowDto>), 200)]
        public async Task<IActionResult> GetExamAttempts(Guid examId, [FromQuery] AttemptsPaginationQueryDto query)
        {
            var (data, meta) = await _examService.GetExamAttemptsAsync(examId, query);
            return Ok(new ApiListResponse<ExamAttemptRowDto> { Data = data, Meta = meta });
        }

        [HttpPost("~/api/exam-attempts/{attemptId:guid}/answer")]
        [ProducesResponseType(typeof(ApiDataResponse<SaveAnswerResultDto>), 200)]
        public async Task<IActionResult> SaveAnswer(Guid attemptId, [FromBody] SaveAnswerRequestDto request)
        {
            var result = await _examService.SaveAnswerAsync(GetUserId(), attemptId, request.QuestionId, request.SelectedOptionId);
            return Ok(new ApiDataResponse<SaveAnswerResultDto> { Data = result });
        }

        [HttpPost("~/api/exam-attempts/{attemptId:guid}/flag")]
        [ProducesResponseType(typeof(ApiDataResponse<FlagQuestionResultDto>), 200)]
        public async Task<IActionResult> FlagQuestion(Guid attemptId, [FromBody] FlagQuestionRequestDto request)
        {
            var result = await _examService.FlagQuestionAsync(GetUserId(), attemptId, request.QuestionId, request.IsFlagged);
            return Ok(new ApiDataResponse<FlagQuestionResultDto> { Data = result });
        }

        [HttpPost("~/api/exam-attempts/{attemptId:guid}/submit")]
        [ProducesResponseType(typeof(ApiDataResponse<SubmitAttemptResultDto>), 200)]
        public async Task<IActionResult> SubmitAttempt(Guid attemptId)
        {
            var result = await _examService.SubmitAttemptAsync(GetUserId(), attemptId);
            return Ok(new ApiDataResponse<SubmitAttemptResultDto> { Data = result });
        }

        [HttpGet("~/api/exam-attempts/{attemptId:guid}")]
        [ProducesResponseType(typeof(ApiDataResponse<AttemptDetailDto>), 200)]
        public async Task<IActionResult> GetAttemptDetail(Guid attemptId)
        {
            var result = await _examService.GetAttemptDetailAsync(GetUserId(), attemptId, GetUserRole());
            return Ok(new ApiDataResponse<AttemptDetailDto> { Data = result });
        }
    }
}