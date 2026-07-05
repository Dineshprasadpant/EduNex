using System;
using System.Threading.Tasks;
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/news")]
    public class NewsController : ControllerBase
    {
        private readonly INewsService _service;
        public NewsController(INewsService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int limit = 10) => Ok(await _service.GetAllNewsAsync(page, limit));

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id) => Ok(await _service.GetNewsByIdAsync(id));

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] News news) => Ok(await _service.CreateNewsAsync(news));

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(Guid id) 
        {
            await _service.DeleteNewsAsync(id);
            return Ok(new { message = "News deleted successfully" });
        }
    }
}
