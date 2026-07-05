using EduNex.Services;
using Microsoft.AspNetCore.Mvc;
using EduNex.Services;
namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/files")]
    public class FileController : ControllerBase
    {
        private readonly IFileService _fileService;
        public FileController(IFileService fileService) => _fileService = fileService;

        // POST /api/files/upload?folder=uploads/citizenship
        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file, [FromQuery] string folder = "uploads/general")
        {
            try
            {
                var res = await _fileService.UploadFileAsync(file, folder);
                return Ok(new
                {
                    success = true,
                    message = "File uploaded successfully to public bucket",
                    data = new
                    {
                        res.Url,
                        res.public_id,
                        res.Key,
                        res.Format,
                        res.Size,
                        res.OriginalFileName,
                        bucket = "public"
                    }

                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST /api/files/delete
        [HttpPost("delete")]
        public async Task<IActionResult> Delete([FromBody] DeleteFileRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.s3Url))
                return BadRequest(new { success = false, message = "Invalid file url." });

            Uri uri = new Uri(request.s3Url);

            // convert to: uploads/general/file.jpg
            string relativePath = uri.AbsolutePath.TrimStart('/');

            var deleted = await _fileService.DeleteFileAsync(relativePath);

            if (!deleted)
                return NotFound(new { success = false, message = "File not found." });

            return Ok(new { success = true, message = "File deleted successfully." });
        }

        public class DeleteFileRequest
        {
            public string s3Url { get; set; } = string.Empty;
        }
    }
}