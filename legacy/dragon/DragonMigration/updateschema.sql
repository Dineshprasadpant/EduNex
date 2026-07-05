/*
    Dragon Institute - Schema Update Script
    Goal: Align SQL Column names exactly with Node.js/Mongoose property names
    to ensure Dapper auto-mapping works without extra configuration.
*/

USE [DragonDB];
GO

-- 1. Align Course Column Names
EXEC sp_rename 'Courses.ImageUrl', 'Image', 'COLUMN';

-- 2. Align Announcement Column Names
EXEC sp_rename 'Announcements.ImageUrl', 'Image', 'COLUMN';

-- 3. Align News Column Names (if any)
-- News already matches mostly, but ensure consistency
IF EXISTS (SELECT 1 FROM sys.columns WHERE name = 'ImageUrl' AND object_id = OBJECT_ID('News'))
BEGIN
    EXEC sp_rename 'News.ImageUrl', 'Image', 'COLUMN';
END

-- 4. Align Exam IDs (Mongoose uses 'exam_id')
EXEC sp_rename 'Exams.ExternalExamId', 'exam_id', 'COLUMN';

-- 5. Align Class Material IDs (Mongoose uses 'material_id')
EXEC sp_rename 'ClassMaterials.ExternalMaterialId', 'material_id', 'COLUMN';

-- 6. Correct Feedback Content Column (Mongoose uses 'feedback')
EXEC sp_rename 'Feedback.Content', 'feedback', 'COLUMN';

-- 7. Add missing indexes for common frontend lookups
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Exams_ExternalId')
    CREATE INDEX IX_Exams_ExternalId ON Exams(exam_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Materials_ExternalId')
    CREATE INDEX IX_Materials_ExternalId ON ClassMaterials(material_id);

-- 8. Ensure BatchMeetings matches 'duration_minutes'
EXEC sp_rename 'BatchMeetings.DurationMinutes', 'duration_minutes', 'COLUMN';

GO
