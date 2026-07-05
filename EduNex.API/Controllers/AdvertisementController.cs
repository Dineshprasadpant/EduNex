using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EduNex.Services;
using EduNex.Models;
namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdvertisementsController : ControllerBase
    {
        private readonly IAdvertisementService _service;
        public AdvertisementsController(IAdvertisementService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int limit = 10) => Ok(await _service.GetAdvertisementsAsync(page, limit));

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var ad = await _service.GetAdvertisementAsync(id);
            if (ad == null) return NotFound(new { message = "Advertisement not found" });
            return Ok(ad);
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] Advertisement ad) => Ok(await _service.CreateAdAsync(ad));

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Advertisement ad)
        {
            var result = await _service.UpdateAdAsync(id, ad);
            if (result == null) return NotFound(new { message = "Advertisement not found" });
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteAdAsync(id);
            return NoContent();
        }
    }
}
