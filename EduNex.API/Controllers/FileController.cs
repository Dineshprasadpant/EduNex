using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using System.Security.Claims;
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
        [Authorize]
        public async Task<IActionResult> Upload(IFormFile file, [FromQuery] string folder = "uploads/general")
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (claim is null || !Guid.TryParse(claim, out Guid userId))
                throw new UnauthorizedAccessException("Invalid or expired token");
            try
            {
                var res = await _fileService.UploadFileAsync(file, folder, uploadedBy :userId);
                return Ok(new
                {
                    success = true,
                    message = "File uploaded successfully to public bucket",
                    data = new
                    {
                        id = res.public_id,
                        filename = res.Key,
                        originalName =res.OriginalFileName,
                        mimeType = res.Format,
                        size = res.Size,
                        url = res.Url,
                        s3Key = res.Key,
                        uploadedBy = userId,
                        createdAt = DateTime.Now
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
        [HttpGet("download")]
        [AllowAnonymous] // signature itself is the auth, not the bearer token
        public async Task<IActionResult> Download(
            [FromQuery] string key,
            [FromQuery] long exp,
            [FromQuery] string sig,
            [FromQuery] string? filename)
        {
            if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(sig))
                return BadRequest(new { success = false, message = "Invalid download link." });

            if (!_fileService.ValidateSignedLink(key, exp, "download", sig))
                return Unauthorized(new { success = false, message = "Download link expired or invalid." });

            try
            {
                var obj = await _fileService.GetObjectStreamAsync(key);

                var contentType = obj.ContentType;
                if (string.IsNullOrEmpty(contentType))
                {
                    var provider = new FileExtensionContentTypeProvider();
                    if (!provider.TryGetContentType(key, out contentType))
                        contentType = "application/octet-stream";
                }

                var downloadName = string.IsNullOrWhiteSpace(filename)
                    ? Path.GetFileName(key)
                    : filename;

                // Content-Disposition: attachment — forces download instead of inline render
                return File(obj.Body, contentType, downloadName);
            }
            catch (FileNotFoundException)
            {
                return NotFound(new { success = false, message = "File not found." });
            }
            catch (UnauthorizedAccessException)
            {
                return BadRequest(new { success = false, message = "Invalid file path." });
            }
        }
        public class DeleteFileRequest
        {
            public string s3Url { get; set; } = string.Empty;
        }
    }
}