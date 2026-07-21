using EduNex.Common;
using EduNex.Services;
using EduNex.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
    private readonly IContactService _contactService;

    public ContactController(IContactService contactService)
    {
        _contactService = contactService;
    }

    // Public — Turnstile-protected, no auth
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContactDto input)
    {
        var entry = await _contactService.CreateMessageAsync(input);
        return StatusCode(201, new { success = true, data = entry });
    }

    [HttpGet("stats")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _contactService.GetStatsAsync();
        return Ok(new { success = true, data = stats });
    }

    [HttpGet]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> List([FromQuery] ContactQueryDto query)
    {
        var result = await _contactService.ListMessagesAsync(query);
        return Ok(new { success = true, data = result.Data, meta = result.Meta });
    }

    [HttpPost("{id:guid}/reply")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Reply(Guid id, [FromBody] ReplyContactDto input)
    {
        var entry = await _contactService.ReplyMessageAsync(id, input.Reply);
        return Ok(new { success = true, data = entry });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles ="admin")]
    public async Task<IActionResult> Remove(Guid id)
    {
        await _contactService.DeleteMessageAsync(id);
        return NoContent();
    }
}