using EduNex.Common;
using EduNex.Models;
using Microsoft.Extensions.Logging;

namespace EduNex.Services
{
    public interface IMailService
    {
        Task<object> SendSingleEmailAsync(string to, string subject, string body, bool isHtml = false);
        Task<object> SendBulkEmailAsync(string target, Guid? batchId, string subject, string body, bool isHtml = false);
        Task SendPasswordResetAsync(string email, string name, string newPassword);
        Task SendAccountVerifiedAsync(string email, string name, AccountVerifiedMailData data);
        Task SendAnnouncementAsync(List<string> email, AnnouncementEmailPayload data);
        Task SendNewUserAdminNotificationAsync(NewUserAdminNotificationPayload payload);
    }

    public class MailService : IMailService
    {
        private readonly ILogger _logger;
        public MailService(ILogger<MailService> logger)
        {
            _logger = logger;
        }   
        public async Task<object> SendSingleEmailAsync(string to, string subject, string body, bool isHtml = false)
        {
            return new { success = true, message = "Email sent successfully" };
        }

        public async Task<object> SendBulkEmailAsync(string target, Guid? batchId, string subject, string body, bool isHtml = false)
        {
            return new { success = true, message = "Bulk emails sent successfully" };
        }
        public async Task SendPasswordResetAsync(string email, string name, string newPassword)
        {

        }
        public async Task SendAccountVerifiedAsync(string email, string name, AccountVerifiedMailData data)
        {

        }
        public async Task SendAnnouncementAsync(List<string> email, AnnouncementEmailPayload data)
        {

        }
        public Task SendNewUserAdminNotificationAsync(NewUserAdminNotificationPayload payload)
        {
               _logger.LogInformation(
                "New registration pending verification: {FirstName} {LastName} <{Email}> ({Role}, plan={Plan}, course={Course})",
                payload.FirstName, payload.LastName, payload.Email, payload.Role, payload.Plan, payload.CourseTitle);

            return Task.CompletedTask;
        }
    }
    public class NewUserAdminNotificationPayload
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Plan { get; set; }
        public string? CourseTitle { get; set; }
    }

}