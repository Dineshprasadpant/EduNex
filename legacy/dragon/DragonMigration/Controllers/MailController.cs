using System;
using System.Threading.Tasks;
using EduNex.Services;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/mail")]
    public class MailController : ControllerBase
    {
        private readonly IMailService _mailService;
        public MailController(IMailService mailService) => _mailService = mailService;

        [HttpPost("sendmail")]
        public async Task<IActionResult> SendMail([FromBody] dynamic data)
        {
            // Note: Cloudflare verification would happen here in middleware
            return Ok(await _mailService.SendSingleEmailAsync("", "", ""));
        }
    }
}
