using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;

namespace EduNex.Services
{
    public interface IFileService
    {
        Task<object> UploadFileAsync(IFormFile file, string folder = "user-uploads");
        Task<bool> DeleteFileAsync(string fileUrl);
    }

    public class FileService : IFileService
    {
        private readonly IWebHostEnvironment _environment;
        public FileService(IWebHostEnvironment environment) => _environment = environment;

        public async Task<object> UploadFileAsync(IFormFile file, string folder = "user-uploads")
        {
            if (file == null || file.Length == 0) throw new Exception("No file uploaded");

            string uploadsFolder = Path.Combine(_environment.WebRootPath, folder);
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            string uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
            string filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            string relativeUrl = $"/{folder}/{uniqueFileName}";

            return new {
                success = true,
                message = "File uploaded successfully to local storage",
                data = new {
                    url = relativeUrl,
                    key = uniqueFileName,
                    size = file.Length,
                    original_filename = file.FileName
                }
            };
        }

        public async Task<bool> DeleteFileAsync(string fileUrl)
        {
            if (string.IsNullOrEmpty(fileUrl)) return false;
            
            string filePath = Path.Combine(_environment.WebRootPath, fileUrl.TrimStart('/'));
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                return true;
            }
            return false;
        }
    }
}
