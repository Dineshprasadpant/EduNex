using System.Threading.Tasks;
namespace EduNex.Common
{
    public class AccountVerifiedMailData
    {
        public string Plan { get; set; } = string.Empty;
        public string? CourseTitle { get; set; }
        public string? PlanFeatures { get; set; }
        public string PortalUrl { get; set; } = string.Empty;
    }
}