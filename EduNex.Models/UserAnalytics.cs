using System;
using System.Collections.Generic;

namespace EduNex.Models
{
    public class UserAnalytics
    {
        public Guid Id { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public int TotalVisitors { get; set; }
        public int TotalVisits { get; set; }
        public int SubscribersGain { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<UtmSource> UtmSources { get; set; } = new List<UtmSource>();
        public EnrolledPlan EnrolledPlan { get; set; } = new EnrolledPlan();
    }

    public class UtmSource
    {
        public string Source { get; set; }
        public int Users { get; set; }
    }

    public class EnrolledPlan
    {
        public int Free { get; set; }
        public int Half { get; set; }
        public int Full { get; set; }
    }
}
