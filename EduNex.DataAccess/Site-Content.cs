namespace EduNex.Models
{
    public class StatItem { public string Value { get; set; } = ""; public string Label { get; set; } = ""; }
    public class StatCounter { public int End { get; set; } public string Suffix { get; set; } = ""; public string Label { get; set; } = ""; }
    public class FaqItem { public string Question { get; set; } = ""; public string Answer { get; set; } = ""; }

    public class HomeHeroContent
    {
        public string Badge { get; set; } = "";
        public string HeadingPrefix { get; set; } = "";
        public string HeadingHighlight { get; set; } = "";
        public string HeadingSuffix { get; set; } = "";
        public string Paragraph { get; set; } = "";
        public List<StatItem> Stats { get; set; } = new(); // 1-3 
    }

    public class HomeStatsContent
    {
        public List<StatCounter> Stats { get; set; } = new(); // 1-4 
    }

    public class HomeAdvisorContent
    {
        public string Eyebrow { get; set; } = "";
        public string Heading { get; set; } = "";
        public string ImageUrl { get; set; } = "";
        public string ImageAlt { get; set; } = "";
        public string Name { get; set; } = "";
        public string Title { get; set; } = "";
        public List<string> Quotes { get; set; } = new(); 
    }

    public class HomeLiveClassContent
    {
        public bool IsLive { get; set; }
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string Instructor { get; set; } = "";
        public string JoinUrl { get; set; } = "";
        public string EmbedUrl { get; set; } = "";
    }

    public class AboutHeroContent
    {
        public string Eyebrow { get; set; } = "";
        public string Heading { get; set; } = "";
        public string Paragraph { get; set; } = "";
    }

    public class AboutMissionContent
    {
        public string Eyebrow { get; set; } = "";
        public string Heading { get; set; } = "";
        public List<string> BodyParagraphs { get; set; } = new(); // 1+ items
        public string MissionLabel { get; set; } = "";
        public string MissionText { get; set; } = "";
        public string VisionLabel { get; set; } = "";
        public string VisionText { get; set; } = "";
    }

    public class AboutStatsContent
    {
        public List<StatItem> Stats { get; set; } = new(); // 1-4 items
    }

    public class AboutFaqContent
    {
        public string Eyebrow { get; set; } = "";
        public string Heading { get; set; } = "";
        public List<FaqItem> Faqs { get; set; } = new(); // 1+ items
    }

    // ---- DB row + response DTO ----
    public class SiteContentRow
    {
        public string Key { get; set; } = "";
        public string Data { get; set; } = ""; // JSON text (was jsonb in Postgres)
        public DateTimeOffset UpdatedAt { get; set; }
    }

    public class SiteContentResultDto
    {
        public string Key { get; set; } = "";
        public object Data { get; set; } = default!;
        public DateTimeOffset UpdatedAt { get; set; }
    }

    // ---- key registry + default content, matching SITE_CONTENT_KEYS / DEFAULT_CONTENT exactly ----
    public static class SiteContentKeys
    {
        public const string HomeHero = "home.hero";
        public const string HomeStats = "home.stats";
        public const string HomeAdvisor = "home.advisor";
        public const string HomeLiveClass = "home.liveClass";
        public const string AboutHero = "about.hero";
        public const string AboutMission = "about.mission";
        public const string AboutStats = "about.stats";
        public const string AboutFaq = "about.faq";

        public static readonly string[] All =
        {
            HomeHero, HomeStats, HomeAdvisor, HomeLiveClass,
            AboutHero, AboutMission, AboutStats, AboutFaq,
        };

        public static readonly Dictionary<string, Type> SectionTypes = new()
        {
            [HomeHero] = typeof(HomeHeroContent),
            [HomeStats] = typeof(HomeStatsContent),
            [HomeAdvisor] = typeof(HomeAdvisorContent),
            [HomeLiveClass] = typeof(HomeLiveClassContent),
            [AboutHero] = typeof(AboutHeroContent),
            [AboutMission] = typeof(AboutMissionContent),
            [AboutStats] = typeof(AboutStatsContent),
            [AboutFaq] = typeof(AboutFaqContent),
        };


        public static bool IsValid(string key) => SectionTypes.ContainsKey(key);

        // Mirrors the original hardcoded markup exactly, ported verbatim.
        public static readonly Dictionary<string, object> DefaultContent = new()
        {
            [HomeHero] = new HomeHeroContent
            {
                Badge = "#1 Engineering Education Platform",
                HeadingPrefix = "Master Skills with",
                HeadingHighlight = "Pulchowk\u2019s",
                HeadingSuffix = "Finest Educators",
                Paragraph = "Transform your engineering journey with expert-led courses from Pulchowk Engineering College. Join thousands of successful students.",
                Stats = new List<StatItem>
                {
                    new() { Value = "12K+", Label = "Students" },
                    new() { Value = "20+", Label = "Courses" },
                    new() { Value = "95%", Label = "Success Rate" },
                },
            },
            [HomeStats] = new HomeStatsContent
            {
                Stats = new List<StatCounter>
                {
                    new() { End = 1000, Suffix = "+", Label = "Students Enrolled" },
                    new() { End = 50, Suffix = "+", Label = "Expert Teachers" },
                    new() { End = 98, Suffix = "%", Label = "Pass Rate" },
                    new() { End = 10, Suffix = "+", Label = "Active Courses" },
                },
            },
            [HomeAdvisor] = new HomeAdvisorContent
            {
                Eyebrow = "Advisory",
                Heading = "Message From\nOur Advisor",
                ImageUrl = "/images/advisor.png",
                ImageAlt = "Campus Chief, Patan Multiple Campus",
                Name = "Campus Chief",
                Title = "Patan Multiple Campus",
                Quotes = new List<string>
                {
                    "I am pleased to extend my best wishes to Dragon Academy, which has been instrumental in preparing students for B.E., B.Arch., and B.Sc. CSIT entrance exams. As the Campus Chief of Patan Multiple Campus, I commend the academy\u2019s dedication to academic excellence and skill development.",
                    "With a team of highly experienced educators and mentors, Dragon Academy ensures that students receive the best guidance and support. With the right effort and determination, students can achieve their goals and make meaningful contributions to society. I encourage all learners to stay committed and get benefited from the opportunities provided.",
                },
            },
            [HomeLiveClass] = new HomeLiveClassContent
            {
                IsLive = false,
                Title = "Live Class in Session",
                Description = "Join our ongoing live class and see how our instructors teach \u2014 open to everyone.",
                Instructor = "",
                JoinUrl = "",
                EmbedUrl = "",
            },
            [AboutHero] = new AboutHeroContent
            {
                Eyebrow = "00 \u2014 Our Story",
                Heading = "About Dragon\nEducation",
                Paragraph = "Nepal's premier education institute dedicated to preparing students for IOE entrance exams and equipping them with language skills that open doors worldwide.",
            },
            [AboutMission] = new AboutMissionContent
            {
                Eyebrow = "01 \u2014 Mission",
                Heading = "Empowering Nepal's\nNext Generation",
                BodyParagraphs = new List<string>
                {
                    "Dragon Education Foundation was established to bridge the gap between ambition and achievement for Nepal's students. We believe that with the right guidance, structured preparation, and modern learning tools, every student can reach their goal \u2014 whether that is clearing the IOE entrance, pursuing engineering, or building global language skills.",
                    "Since 2015, we have been refining our approach through student feedback, exam analysis, and a relentless commitment to quality instruction. Today, we serve students from across the Kathmandu Valley and increasingly across Nepal through our hybrid and online programs.",
                },
                MissionLabel = "Our Mission",
                MissionText = "To provide accessible, high-quality education that empowers every Nepali student to excel in competitive exams and build skills for a global career \u2014 through expert instruction, technology, and personalized support.",
                VisionLabel = "Our Vision",
                VisionText = "To become South Asia's most trusted education foundation \u2014 where academic excellence meets opportunity, and every student leaves prepared not just for an exam, but for a lifetime of growth.",
            },
            [AboutStats] = new AboutStatsContent
            {
                Stats = new List<StatItem>
                {
                    new() { Value = "1000+", Label = "Students Enrolled" },
                    new() { Value = "50+", Label = "Expert Teachers" },
                    new() { Value = "98%", Label = "Pass Rate" },
                    new() { Value = "2015", Label = "Founded" },
                },
            },
            [AboutFaq] = new AboutFaqContent
            {
                Eyebrow = "03 \u2014 FAQ",
                Heading = "Questions",
                Faqs = new List<FaqItem>
                {
                    new() { Question = "What courses does Dragon Education Foundation offer?", Answer = "We offer IOE entrance preparation programs, bridge courses for engineering and science, and language training in Japanese, Korean, and English. Each program is available online, offline, or hybrid." },
                    new() { Question = "How are classes delivered?", Answer = "We offer three delivery modes \u2014 online (via Zoom), offline (in-person at our Baneshwor centre), and hybrid (mix of both). You can choose based on your location and schedule." },
                    new() { Question = "What is the batch size?", Answer = "We keep batches intentionally small to ensure every student gets personal attention from instructors. Batch sizes are typically 20\u201330 students." },
                    new() { Question = "Are mock exams included in all plans?", Answer = "Free users get access to a limited number of mock exams. Standard and Premium users receive more frequent mock sessions with detailed analytics and feedback." },
                    new() { Question = "How do I enroll?", Answer = "Register on our platform, verify your account, then browse and enroll in your chosen course. Our team will contact you to assign you to the appropriate batch." },
                },
            },
        };

        // Exact validation, ported from each zod schema's constraints
        // (array .min()/.max() bounds; plain strings just need to be
        // non-null, since zod allows empty strings and only requires the
        // key to be present). Returns an empty list when valid.
        public static List<string> Validate(string key, object content)
        {
            var errors = new List<string>();
            void Req(string name, string? value) { if (value is null) errors.Add($"{name} is required"); }
            void Count(string name, int count, int min, int max = int.MaxValue)
            {
                if (count < min || count > max)
                    errors.Add(max == int.MaxValue
                        ? $"{name} must contain at least {min} item(s)"
                        : $"{name} must contain between {min} and {max} items");
            }

            switch (key)
            {
                case HomeHero:
                    var hh = (HomeHeroContent)content;
                    Req(nameof(hh.Badge), hh.Badge); Req(nameof(hh.HeadingPrefix), hh.HeadingPrefix);
                    Req(nameof(hh.HeadingHighlight), hh.HeadingHighlight); Req(nameof(hh.HeadingSuffix), hh.HeadingSuffix);
                    Req(nameof(hh.Paragraph), hh.Paragraph);
                    Count(nameof(hh.Stats), hh.Stats?.Count ?? 0, 1, 3);
                    break;
                case HomeStats:
                    var hs = (HomeStatsContent)content;
                    Count(nameof(hs.Stats), hs.Stats?.Count ?? 0, 1, 4);
                    break;
                case HomeAdvisor:
                    var ha = (HomeAdvisorContent)content;
                    Req(nameof(ha.Eyebrow), ha.Eyebrow); Req(nameof(ha.Heading), ha.Heading);
                    Req(nameof(ha.ImageUrl), ha.ImageUrl); Req(nameof(ha.ImageAlt), ha.ImageAlt);
                    Req(nameof(ha.Name), ha.Name); Req(nameof(ha.Title), ha.Title);
                    Count(nameof(ha.Quotes), ha.Quotes?.Count ?? 0, 1);
                    break;
                case HomeLiveClass:
                    var hl = (HomeLiveClassContent)content;
                    Req(nameof(hl.Title), hl.Title); Req(nameof(hl.Description), hl.Description);
                    Req(nameof(hl.Instructor), hl.Instructor); Req(nameof(hl.JoinUrl), hl.JoinUrl); Req(nameof(hl.EmbedUrl), hl.EmbedUrl);
                    break;
                case AboutHero:
                    var ah = (AboutHeroContent)content;
                    Req(nameof(ah.Eyebrow), ah.Eyebrow); Req(nameof(ah.Heading), ah.Heading); Req(nameof(ah.Paragraph), ah.Paragraph);
                    break;
                case AboutMission:
                    var am = (AboutMissionContent)content;
                    Req(nameof(am.Eyebrow), am.Eyebrow); Req(nameof(am.Heading), am.Heading);
                    Count(nameof(am.BodyParagraphs), am.BodyParagraphs?.Count ?? 0, 1);
                    Req(nameof(am.MissionLabel), am.MissionLabel); Req(nameof(am.MissionText), am.MissionText);
                    Req(nameof(am.VisionLabel), am.VisionLabel); Req(nameof(am.VisionText), am.VisionText);
                    break;
                case AboutStats:
                    var asd = (AboutStatsContent)content;
                    Count(nameof(asd.Stats), asd.Stats?.Count ?? 0, 1, 4);
                    break;
                case AboutFaq:
                    var af = (AboutFaqContent)content;
                    Req(nameof(af.Eyebrow), af.Eyebrow); Req(nameof(af.Heading), af.Heading);
                    Count(nameof(af.Faqs), af.Faqs?.Count ?? 0, 1);
                    break;
            }
            return errors;
        }
    }
}