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
        public async Task<IActionResult> Add([FromBody] SubscribeRequest request)
        {
            try
            {
                var result = await _service.AddSubscriberAsync(request.Email);
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAll(int page = 1, int limit = 10)
        {
            var result = await _service.GetSubscribersAsync(page, limit);
            return Ok(new {data=result.Data, meta=new {result.Pagination.Total,result.Pagination.Page,result.Pagination.Limit,result.Pagination.TotalPages}});
        }

        [HttpGet("getUser/{email}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetByEmail(string email)
        {
            var dal = HttpContext.RequestServices.GetRequiredService<EduNex.DataAccess.ISubscriberDal>();
            var subscriber = await dal.GetByEmailAsync(email);
            if (subscriber == null)
                return NotFound(new { message = "Subscriber not found" });
            return Ok(subscriber);
        }

        [HttpDelete("{email}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(string email)
        {
            var removed = await _service.RemoveSubscriberAsync(email);
            if (!removed)
                return BadRequest(new { message = "Failed to delete subscriber" });
            return Ok(new { message = "Subscriber deleted successfully" });
        }
    }

    public class SubscribeRequest
    {
        public string Email { get; set; }
    }
}