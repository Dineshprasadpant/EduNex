/*
    Dragon Institute - MSSQL Migration Schema
    Target: Microsoft SQL Server (SSMS)
    Strategy: Normalized Relational Mapping from MongoDB
*/

USE [master];
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'DragonDB')
BEGIN
    CREATE DATABASE [DragonDB];
END
GO

USE [DragonDB];
GO

-- =============================================
-- 1. CORE DOMAIN: COURSES & BATCHES
-- =============================================

CREATE TABLE Courses (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Title NVARCHAR(120) NOT NULL UNIQUE,
    ImageUrl NVARCHAR(MAX) NOT NULL,
    StudentsEnrolled INT DEFAULT 0,
    TeachersCount INT DEFAULT 1,
    OverallHours INT NOT NULL,
    ModuleLeader NVARCHAR(255) NOT NULL,
    Category NVARCHAR(100) NOT NULL,
    Price DECIMAL(18, 2) NOT NULL,
    OnlinePrice DECIMAL(18, 2) DEFAULT 0,
    OfflinePrice DECIMAL(18, 2) DEFAULT 0,
    Priority NVARCHAR(20) CHECK (Priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    DeliveryMode NVARCHAR(20) CHECK (DeliveryMode IN ('online', 'offline', 'hybrid')) DEFAULT 'online',
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE CourseDescriptions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CourseId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Courses(Id) ON DELETE CASCADE,
    Content NVARCHAR(MAX) NOT NULL,
    SortOrder INT DEFAULT 0
);

CREATE TABLE CourseHighlights (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CourseId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Courses(Id) ON DELETE CASCADE,
    Highlight NVARCHAR(500) NOT NULL
);

CREATE TABLE CourseLearningFormats (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CourseId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Courses(Id) ON DELETE CASCADE,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL
);

CREATE TABLE CourseCurriculums (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CourseId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Courses(Id) ON DELETE CASCADE,
    Title NVARCHAR(255) NOT NULL,
    Duration INT NOT NULL,
    Description NVARCHAR(MAX) NOT NULL
);

CREATE TABLE CourseSchedules (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CourseId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Courses(Id) ON DELETE CASCADE,
    DayOfWeek NVARCHAR(20) NOT NULL, -- Monday, Tuesday, etc.
    Medium NVARCHAR(20) NOT NULL, -- online, offline, both
    StartTime NVARCHAR(5) NOT NULL, -- HH:MM
    EndTime NVARCHAR(5) NOT NULL
);

CREATE TABLE Batches (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    BatchName NVARCHAR(255) NOT NULL,
    CourseId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Courses(Id),
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE BatchMeetings (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    BatchId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Batches(Id) ON DELETE CASCADE,
    Title NVARCHAR(255) NOT NULL,
    MeetingLink NVARCHAR(MAX) NOT NULL,
    MeetingDate NVARCHAR(50) NOT NULL,
    MeetingTime NVARCHAR(50) NOT NULL,
    ExpiryTime DATETIME2 NOT NULL,
    DurationMinutes INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- =============================================
-- 2. IDENTITY: USERS
-- =============================================

CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Fullname NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    Phone NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Role NVARCHAR(20) CHECK (Role IN ('admin', 'teacher', 'user')) NOT NULL,
    Status NVARCHAR(20) CHECK (Status IN ('verified', 'unverified')) DEFAULT 'unverified',
    PlatformPreference NVARCHAR(20) CHECK (PlatformPreference IN ('online', 'offline', 'asPerCourse')),
    BatchId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Batches(Id),
    CourseEnrolledId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Courses(Id),
    CitizenshipImageUrl NVARCHAR(MAX) NOT NULL,
    PlanType NVARCHAR(20) CHECK (PlanType IN ('full', 'half', 'free')) NOT NULL,
    PlanUpgradedFrom NVARCHAR(20),
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE UserPaymentImages (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
    ImageUrl NVARCHAR(MAX) NOT NULL,
    BatchIndex INT DEFAULT 0 -- For the [[String]] 2D array logic if needed
);

-- =============================================
-- 3. ACADEMIC: EXAMS & PERFORMANCE
-- =============================================

CREATE TABLE QuestionSheets (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SheetName NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Questions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SheetId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES QuestionSheets(Id) ON DELETE CASCADE,
    QuestionText NVARCHAR(MAX) NOT NULL,
    Marks INT NOT NULL,
    CorrectAnswer NVARCHAR(MAX) NOT NULL
);

CREATE TABLE QuestionOptions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    QuestionId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Questions(Id) ON DELETE CASCADE,
    OptionText NVARCHAR(MAX) NOT NULL
);

CREATE TABLE Exams (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ExternalExamId NVARCHAR(100) UNIQUE, -- From original exam_id
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    ExamName NVARCHAR(255) NOT NULL,
    StartDateTime DATETIME2 NOT NULL,
    EndDateTime DATETIME2 NOT NULL,
    TotalMarks INT NOT NULL,
    PassMarks INT NOT NULL,
    Duration INT NOT NULL,
    NegativeMarking BIT NOT NULL DEFAULT 0,
    NegativeMarkingNumber DECIMAL(5, 2),
    QuestionSheetId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES QuestionSheets(Id),
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE ExamBatches (
    ExamId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Exams(Id) ON DELETE CASCADE,
    BatchId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Batches(Id) ON DELETE CASCADE,
    PRIMARY KEY (ExamId, BatchId)
);

CREATE TABLE UserExamAttempts (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
    ExamId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Exams(Id),
    ExamName NVARCHAR(255),
    TotalQuestions INT,
    CorrectAnswers INT,
    UnansweredQuestions INT,
    MarksObtained DECIMAL(18, 2),
    TotalMarks DECIMAL(18, 2),
    AttemptDate DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE ExamPerformances (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    BatchId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Batches(Id),
    ExamId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Exams(Id) UNIQUE,
    AcademicYear NVARCHAR(20) NOT NULL,
    OverallPercentage DECIMAL(5, 2),
    NumberOfExaminees INT,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE ExamHighestScorers (
    PerformanceId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES ExamPerformances(Id) ON DELETE CASCADE,
    UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    Percentage DECIMAL(5, 2),
    PRIMARY KEY (PerformanceId, UserId)
);

-- =============================================
-- 4. COMMUNICATIONS: ANNOUNCEMENTS, NEWS, EVENTS
-- =============================================

CREATE TABLE Announcements (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Title NVARCHAR(MAX) NOT NULL,
    ImageUrl NVARCHAR(MAX) NOT NULL,
    AnnouncedDate DATETIME2 DEFAULT SYSUTCDATETIME(),
    CtaTitle NVARCHAR(255),
    CtaDescription NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE AnnouncementContents (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AnnouncementId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Announcements(Id) ON DELETE CASCADE,
    Paragraph NVARCHAR(MAX) NOT NULL,
    SortOrder INT DEFAULT 0
);

CREATE TABLE AnnouncementCtaButtons (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AnnouncementId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Announcements(Id) ON DELETE CASCADE,
    ButtonName NVARCHAR(255),
    Href NVARCHAR(MAX)
);

CREATE TABLE News (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Title NVARCHAR(MAX) NOT NULL,
    ImageUrl NVARCHAR(MAX) NOT NULL,
    PublishedDate DATETIME2 DEFAULT SYSUTCDATETIME(),
    Publisher NVARCHAR(255) NOT NULL,
    CtaTitle NVARCHAR(255),
    CtaImageUrl NVARCHAR(MAX),
    CtaDescription NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE NewsContents (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NewsId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES News(Id) ON DELETE CASCADE,
    Paragraph NVARCHAR(MAX) NOT NULL,
    SortOrder INT DEFAULT 0
);

CREATE TABLE NewsCtaButtons (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NewsId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES News(Id) ON DELETE CASCADE,
    ButtonName NVARCHAR(255),
    Href NVARCHAR(MAX)
);

CREATE TABLE Events (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Title NVARCHAR(MAX) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    EventType NVARCHAR(100) DEFAULT 'Other',
    EventMonth NVARCHAR(20),
    EventYear NVARCHAR(10),
    StartDate DATETIME2 NOT NULL,
    EndDate DATETIME2 NOT NULL,
    IsActive BIT DEFAULT 1,
    OrganizerName NVARCHAR(255),
    OrganizerEmail NVARCHAR(255),
    OrganizerPhone NVARCHAR(50),
    VenueName NVARCHAR(255),
    VenueAddress NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Shared Resources for Announcements, News, Events
CREATE TABLE ResourceMaterials (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OwnerId UNIQUEIDENTIFIER NOT NULL, -- Guid of Announcement, News, or Event
    OwnerType NVARCHAR(50) NOT NULL, -- 'Announcement', 'News', 'Event'
    MaterialName NVARCHAR(255),
    FileType NVARCHAR(50),
    FileSize BIGINT,
    Url NVARCHAR(MAX)
);

CREATE TABLE SubInformation (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OwnerId UNIQUEIDENTIFIER NOT NULL,
    OwnerType NVARCHAR(50) NOT NULL,
    Title NVARCHAR(255),
    Description NVARCHAR(MAX),
    SortOrder INT DEFAULT 0
);

CREATE TABLE SubInfoBulletPoints (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SubInfoId INT FOREIGN KEY REFERENCES SubInformation(Id) ON DELETE CASCADE,
    BulletPoint NVARCHAR(MAX) NOT NULL
);

-- =============================================
-- 5. MISC: MATERIALS, FEEDBACK, SUBS, ADS
-- =============================================

CREATE TABLE ClassMaterials (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ExternalMaterialId NVARCHAR(100) UNIQUE,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    FileUrl NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE ClassMaterialBatches (
    MaterialId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES ClassMaterials(Id) ON DELETE CASCADE,
    BatchId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Batches(Id) ON DELETE CASCADE,
    PRIMARY KEY (MaterialId, BatchId)
);

CREATE TABLE Advertisements (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    ImageUrl NVARCHAR(MAX) NOT NULL,
    LinkUrl NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Feedback (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    Content NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Subscribers (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- =============================================
-- 6. ANALYTICS
-- =============================================

CREATE TABLE SiteAnalytics (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    AnalyticMonth INT NOT NULL CHECK (AnalyticMonth BETWEEN 1 AND 12),
    AnalyticYear INT NOT NULL,
    TotalVisitors INT DEFAULT 0,
    TotalVisits INT DEFAULT 0,
    SubscribersGain INT DEFAULT 0,
    EnrolledFree INT DEFAULT 0,
    EnrolledHalf INT DEFAULT 0,
    EnrolledFull INT DEFAULT 0,
    UNIQUE (AnalyticMonth, AnalyticYear)
);

CREATE TABLE UtmSources (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AnalyticId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES SiteAnalytics(Id) ON DELETE CASCADE,
    Source NVARCHAR(255) NOT NULL,
    UserCount INT DEFAULT 0
);

-- =============================================
-- 7. INDEXES FOR PERFORMANCE
-- =============================================

CREATE FULLTEXT CATALOG DragonCatalog AS DEFAULT;
CREATE FULLTEXT INDEX ON Users(Fullname) KEY INDEX PK__Users__3214EC07...; -- Note: Need actual PK name from execution
-- (Alternative for standard search)
CREATE INDEX IX_Users_Fullname ON Users(Fullname);
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Batches_CourseId ON Batches(CourseId);
CREATE INDEX IX_Exams_Dates ON Exams(StartDateTime, EndDateTime);
CREATE INDEX IX_UserAttempts_User ON UserExamAttempts(UserId);
CREATE INDEX IX_Analytics_Date ON SiteAnalytics(AnalyticYear, AnalyticMonth);

GO
