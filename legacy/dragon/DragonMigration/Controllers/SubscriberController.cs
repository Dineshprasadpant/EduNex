using System;
using System.Threading.Tasks;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/subscribers")]
    public class SubscriberController : ControllerBase
    {
        private readonly ISubscriberService _service;
        public SubscriberController(ISubscriberService service) => _service = service;

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] dynamic data)
        {
            try { return Ok(await _service.AddSubscriberAsync((string)data.email)); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAll(int page = 1, int limit = 10) => Ok(await _service.GetSubscribersAsync(page, limit));

        [HttpDelete("{email}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(string email)
        {
            await _service.RemoveSubscriberAsync(email);
            return Ok(new { message = "Subscriber deleted successfully" });
        }
    }
}
