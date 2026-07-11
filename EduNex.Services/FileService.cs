using EduNex.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

// NOTE: This is your existing EduNex.Services.FileService, extended (not
// replaced) to support the citizenship/payment document upload case from
// the Node registration flow, which needs PDF/WebP at a smaller (3MB) size
// limit than the general 5MB/jpg-png-only default. Existing callers of
// UploadFileAsync(file, folder) are unaffected -- the new parameters are
// optional and fall back to the original allowedExtensions/MaxFileSize
// when omitted.
namespace EduNex.Services
{
    public interface IFileService
    {
        Task<FileUploadResultDto> UploadFileAsync(
            IFormFile file,
            string folder = "uploads/general",
            string[]? allowedExtensions = null,
            long? maxFileSizeBytes = null);

        Task<bool> DeleteFileAsync(string fileUrl);
        bool IsValidImage(IFormFile file);
        Task DeleteFileSafe(string url);
    }

    public class FileService : IFileService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;

        private readonly string[] defaultAllowedExtensions = new[]
        {
            ".jpg", ".jpeg", ".png"
        };

        private const long DefaultMaxFileSize = 5 * 1024 * 1024; // 5 MB

        public FileService(IWebHostEnvironment environment, IConfiguration configuration)
        {
            _environment = environment;
            _configuration = configuration;
        }

        private bool IsValidFile(IFormFile file, string[] allowedExtensions, long maxFileSizeBytes)
        {
            if (file == null || file.Length == 0)
                return false;

            if (file.Length > maxFileSizeBytes)
                throw new Exception($"File size exceeds {maxFileSizeBytes / (1024 * 1024)}MB limit.");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            return allowedExtensions.Contains(extension);
        }

        public async Task<FileUploadResultDto> UploadFileAsync(
            IFormFile file,
            string folder = "uploads/general",
            string[]? allowedExtensions = null,
            long? maxFileSizeBytes = null)
        {
            var extensions = allowedExtensions ?? defaultAllowedExtensions;
            var maxSize = maxFileSizeBytes ?? DefaultMaxFileSize;

            if (!IsValidFile(file, extensions, maxSize))
                throw new Exception($"Invalid file. Only {string.Join(", ", extensions)} allowed.");

            string uploadsFolder = Path.Combine(_environment.WebRootPath, folder);

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            string fileExtension = Path.GetExtension(file.FileName);
            Guid publicId = Guid.NewGuid();
            string uniqueFileName = $"{publicId}{fileExtension}";

            string filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            string baseUrl = _configuration["Static:url"];
            // FIX: safe URL (always forward slash)
            string relativeUrl = $"{baseUrl}/{folder.Trim('/').Replace("\\", "/")}/{uniqueFileName}";

            return new FileUploadResultDto
            {
                Success = true,
                Message = "File uploaded successfully",
                Url = relativeUrl,
                public_id = publicId,
                Key = $"/{folder.Trim('/').Replace("\\", "/")}/{uniqueFileName}",
                Format = fileExtension,
                Size = file.Length,
                OriginalFileName = file.FileName
            };
        }

        public Task<bool> DeleteFileAsync(string fileUrl)
        {
            if (string.IsNullOrWhiteSpace(fileUrl))
                return Task.FromResult(false);

            string filePath = Path.Combine(
                _environment.WebRootPath,
                fileUrl.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString())
            );

            if (!File.Exists(filePath))
                return Task.FromResult(false);

            File.Delete(filePath);
            return Task.FromResult(true);
        }

        public bool IsValidImage(IFormFile file)
        {
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

            return allowedExtensions.Contains(ext);
        }

        public async Task DeleteFileSafe(string url)
        {
            try
            {
                var path = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    url.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString())
                );

                if (System.IO.File.Exists(path))
                    System.IO.File.Delete(path);
            }
            catch
            {
                // ignore cleanup errors
            }

            await Task.CompletedTask;
        }
    }
}