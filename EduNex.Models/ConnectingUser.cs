using System;
using System.Collections.Generic;
using System.Text;

namespace EduNex.Models
{
    public class SessionUser
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Plan { get; set; } = string.Empty;
        public string? ConnectionString { get; set; }
        public Guid? BatchId { get; set; }
        public Guid? CourseEnrolledId { get; set; }
        public DateTime ConnectedAt { get; set; } = DateTime.UtcNow;
        // Add more fields as needed (subscription, tenant, etc.)
    }

    public class ConnectingUser
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Plan { get; set; } = string.Empty;
        public string? UserConnectionString { get; set; }
        public Guid? BatchId { get; set; }
        public Guid? CourseEnrolledId { get; set; }
        public DateTime ConnectedAt { get; set; }
    }
}
