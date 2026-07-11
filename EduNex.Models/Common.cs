using System.Threading.Tasks;

namespace EduNex.Common
{
    public interface IPasswordHasher
    {
        string Hash(string plainTextPassword);
    }

    public class NotImplementedPasswordHasher : IPasswordHasher
    {
        public string Hash(string plainTextPassword) =>
            throw new System.NotImplementedException(
                "Wire IPasswordHasher up to your real password hashing implementation (matching utils/hash.ts) before using UserService.");
    }

    public interface IMailService
    {
        Task SendAccountVerifiedAsync(string toEmail, string fullName, AccountVerifiedMailData data);
        Task SendPasswordResetAsync(string toEmail, string fullName, string newPassword);
    }

    public class AccountVerifiedMailData
    {
        public string Plan { get; set; } = string.Empty;
        public string? CourseTitle { get; set; }
        public string? PlanFeatures { get; set; }
        public string PortalUrl { get; set; } = string.Empty;
    }
}