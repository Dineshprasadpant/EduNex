using System;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BatchesController : ControllerBase
    {
        private readonly IBatchService _batchService;
        public BatchesController(IBatchService batchService) => _batchService = batchService;

        [HttpPost]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Create([FromBody] createBatchDto batch) => Ok(await _batchService.CreateBatchAsync(batch));

        [HttpGet]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> GetAll(int? page, int? limit)
        {
            int p= page ?? 1;
            int li= limit ?? 10;
            return Ok(await _batchService.GetAllBatchesAsync(p, li));
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> Get(Guid id)
        {
            var batch = await _batchService.GetBatchAsync(id);
            if (batch == null) return NotFound(new { message = "Batch not found" });
            return Ok(batch);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Update(Guid id, [FromBody] createBatchDto batch) => Ok(await _batchService.UpdateBatchAsync(id, batch));

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _batchService.DeleteBatchAsync(id);
            return Ok(new { message = "Batches Deleted Sucessfully" });
        }

        // Meeting Management
        [HttpPost("{batchId}/meetings")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> AddMeeting(Guid batchId, [FromBody] ScheduledMeeting meeting) => Ok(await _batchService.AddMeetingAsync(batchId, meeting));

        [HttpPut("{batchId}/meetings/{meetingId}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> UpdateMeeting(Guid batchId, Guid meetingId, [FromBody] ScheduledMeeting meeting) => Ok(await _batchService.UpdateMeetingAsync(batchId, meetingId, meeting));

        [HttpDelete("{batchId}/meetings/{meetingId}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> RemoveMeeting(Guid batchId, Guid meetingId) => Ok(await _batchService.RemoveMeetingAsync(batchId, meetingId));

        [HttpPost("cleanExpiredMeetings")]
        public async Task<IActionResult> CleanMeetings() => Ok(await _batchService.CleanupMeetingsAsync());
    }
}
