using System;
using System.Threading.Tasks;
using EduNex.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/files")]
    public class FileController : ControllerBase
    {
        private readonly IFileService _fileService;
        public FileController(IFileService fileService) => _fileService = fileService;

        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            try { return Ok(await _fileService.UploadFileAsync(file)); }
            catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
        }

        [HttpPost("delete")]
        public async Task<IActionResult> Delete([FromBody] dynamic data)
        {
            await _fileService.DeleteFileAsync((string)data.s3Url);
            return Ok(new { success = true });
        }
    }
}
