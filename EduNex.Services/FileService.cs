using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using EduNex.Models;
using EduNex.DataAccess;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace EduNex.Services
{
    public interface IFileService
    {
        Task<FileUploadResultDto> UploadFileAsync(IFormFile file, string folder = "uploads/general", string[]? allowedExtensions = null, long? maxFileSizeBytes = null, string[]? allowedMimeTypes = null, Guid uploadedBy = default);
        Task<bool> DeleteFileAsync(string key);
        bool IsValidImage(IFormFile file);
        Task DeleteFileSafe(string url);
        Task<ObjectStreamResult> GetObjectStreamAsync(string key);
        Task<string> GetPresignedDownloadUrlAsync(string key, int expiresInSeconds, string? downloadFilename = null);
        Task<string> GetPresignedViewUrlAsync(string key, int expiresInSeconds, string? mimeType = null);
        bool ValidateSignedLink(string key, long expiresAtUnixSeconds, string mode, string signature);
        string ResolveKeyFromUrlOrKey(string urlOrKey);
    }

    public class FileService : IFileService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly IMediaDal _mediaDal;

        public FileService(IWebHostEnvironment environment, IConfiguration configuration, IMediaDal mediaDal)
        {
            _environment = environment;
            _configuration = configuration;
            _mediaDal = mediaDal;
        }

        private readonly string _signingKey = "dev-insecure-signing-key-change-me";
        private readonly string[] defaultAllowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".mp3", ".mp4", ".pdf" };
        private const long DefaultMaxFileSize = 5 * 1024 * 1024;

        private bool IsValidFile(IFormFile file, string[] allowedExtensions, string[]? allowedMimeTypes, long maxFileSizeBytes)
        {
            if (file == null || file.Length == 0)
                return false;

            if (file.Length > maxFileSizeBytes)
                throw new Exception($"File size exceeds {maxFileSizeBytes / (1024 * 1024)}MB limit.");

            if (allowedMimeTypes != null)
                return allowedMimeTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase);

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            return allowedExtensions.Contains(extension);
        }

        private static string SanitizeBaseName(string originalFileName)
        {
            var baseName = Path.GetFileNameWithoutExtension(originalFileName).ToLowerInvariant();
            baseName = Regex.Replace(baseName, "[^a-z0-9-_]", "-");
            baseName = Regex.Replace(baseName, "-+", "-");
            baseName = baseName.Trim('-');
            return string.IsNullOrEmpty(baseName) ? "file" : baseName;
        }

        public async Task<FileUploadResultDto> UploadFileAsync(IFormFile file, string folder = "uploads/general", string[]? allowedExtensions = null, long? maxFileSizeBytes = null, string[]? allowedMimeTypes = null, Guid uploadedBy = default)
        {
            var extensions = allowedExtensions ?? defaultAllowedExtensions;
            var maxSize = maxFileSizeBytes ?? DefaultMaxFileSize;

            if (!IsValidFile(file, extensions, allowedMimeTypes, maxSize))
            {
                var allowedDesc = allowedMimeTypes != null
                    ? string.Join(", ", allowedMimeTypes)
                    : string.Join(", ", extensions);
                throw new Exception($"Invalid file. Only {allowedDesc} allowed.");
            }

            var normalizedFolder = folder.Trim('/').Replace("\\", "/");
            string uploadsFolder = Path.Combine(_environment.WebRootPath, normalizedFolder);

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            string fileExtension = Path.GetExtension(file.FileName);
            string baseName = SanitizeBaseName(file.FileName);
            string uniqueFileName = $"{baseName}-{Guid.NewGuid()}{fileExtension}";

            string filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            string key = $"{normalizedFolder}/{uniqueFileName}";

            string configuredBase = (_configuration["Static:url"] ?? string.Empty).TrimEnd('/');
            string relativeUrl = string.IsNullOrEmpty(configuredBase)
                ? $"/{key}"
                : $"{configuredBase}/{key}";
            var uploadResult = new FileUploadResultDto
            {
                Success = true,
                Message = "File uploaded successfully",
                Url = relativeUrl,
                public_id = Guid.NewGuid(),
                Key = key,
                Format = fileExtension,
                Size = file.Length,
                OriginalFileName = file.FileName
            };
            var storedFilename = Path.GetFileName(uploadResult.Key);

             await _mediaDal.CreateAsync(
                    storedFilename,
                    uploadResult.public_id,
                    uploadResult.OriginalFileName,
                    file.ContentType,
                    uploadResult.Size,
                    uploadResult.Url,
                    uploadResult.Key,
                    uploadedBy);
            return uploadResult;
            
        }

        public Task<bool> DeleteFileAsync(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
                return Task.FromResult(false);

            string filePath = ResolvePath(key);

            if (!File.Exists(filePath))
                return Task.FromResult(false);

            File.Delete(filePath);
            return Task.FromResult(true);
        }

        public string ResolveKeyFromUrlOrKey(string urlOrKey)
        {
            if (string.IsNullOrWhiteSpace(urlOrKey))
                return string.Empty;

            if (Uri.TryCreate(urlOrKey, UriKind.Absolute, out var absoluteUri))
                return absoluteUri.AbsolutePath.TrimStart('/');
            return urlOrKey.TrimStart('/');
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
                var key = ResolveKeyFromUrlOrKey(url);
                var path = ResolvePath(key);

                if (File.Exists(path))
                    File.Delete(path);
            }
            catch
            {
            }

            await Task.CompletedTask;
        }

        public Task<ObjectStreamResult> GetObjectStreamAsync(string key)
        {
            var path = ResolvePath(key);
            if (!File.Exists(path))
                throw new FileNotFoundException("File not found", path);

            var info = new FileInfo(path);
            var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);

            return Task.FromResult(new ObjectStreamResult
            {
                Body = stream,
                ContentType = null,
                ContentLength = info.Length
            });
        }

        public Task<string> GetPresignedDownloadUrlAsync(string key, int expiresInSeconds, string? downloadFilename = null)
            => Task.FromResult(BuildSignedUrl(key, expiresInSeconds, "download", filename: downloadFilename));

        public Task<string> GetPresignedViewUrlAsync(string key, int expiresInSeconds, string? mimeType = null)
            => Task.FromResult(BuildSignedUrl(key, expiresInSeconds, "view", mimeType: mimeType));

        public bool ValidateSignedLink(string key, long expiresAtUnixSeconds, string mode, string signature)
        {
            if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() > expiresAtUnixSeconds)
                return false;

            var expected = Sign($"{key}|{expiresAtUnixSeconds}|{mode}");
            var a = Encoding.UTF8.GetBytes(signature);
            var b = Encoding.UTF8.GetBytes(expected);
            return a.Length == b.Length && CryptographicOperations.FixedTimeEquals(a, b);
        }

        private string BuildSignedUrl(string key, int expiresInSeconds, string mode, string? filename = null, string? mimeType = null)
        {
            var exp = DateTimeOffset.UtcNow.AddSeconds(expiresInSeconds).ToUnixTimeSeconds();
            var sig = Sign($"{key}|{exp}|{mode}");
            var baseUrl = (_configuration["Static:url"] ?? string.Empty).TrimEnd('/');

            var qs = $"key={Uri.EscapeDataString(key)}&exp={exp}&sig={Uri.EscapeDataString(sig)}";
            if (mode == "download" && !string.IsNullOrEmpty(filename))
                qs += $"&filename={Uri.EscapeDataString(filename)}";
            if (mode == "view" && !string.IsNullOrEmpty(mimeType))
                qs += $"&mimeType={Uri.EscapeDataString(mimeType)}";

            return $"{baseUrl}/api/files/{mode}?{qs}";
        }

        private string Sign(string data)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_signingKey));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return Convert.ToBase64String(hash).Replace('+', '-').Replace('/', '_').TrimEnd('=');
        }

        private string ResolvePath(string key)
        {
            var root = Path.GetFullPath(_environment.WebRootPath);
            var combined = Path.GetFullPath(
                Path.Combine(root, key.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString())));

            if (!combined.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException("Invalid file path.");

            return combined;
        }
    }

    public class ObjectStreamResult
    {
        public Stream Body { get; set; }
        public string ContentType { get; set; }
        public long? ContentLength { get; set; }
    }
}