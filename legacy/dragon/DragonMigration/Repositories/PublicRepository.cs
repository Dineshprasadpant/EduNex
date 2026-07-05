using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Dragon.DTOs;
using Dragon.Models;
using Microsoft.Data.SqlClient;

namespace Dragon.Repositories
{
    public class PublicRepository : IPublicRepository
    {
        private readonly string _connectionString;
        public PublicRepository(string connectionString) => _connectionString = connectionString;
        private IDbConnection Connection => new SqlConnection(_connectionString);

        public async Task<(IEnumerable<AnnouncementDto> Items, int Total)> GetAnnouncementsAsync(int page, int limit)
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT COUNT(*) FROM Announcements;
                    SELECT Id, Title, Image, AnnouncedDate 
                    FROM Announcements 
                    ORDER BY AnnouncedDate DESC 
                    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
                    
                    SELECT ac.AnnouncementId, ac.Paragraph as Content
                    FROM AnnouncementContents ac
                    INNER JOIN (
                        SELECT Id FROM Announcements 
                        ORDER BY AnnouncedDate DESC 
                        OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
                    ) a ON ac.AnnouncementId = a.Id
                    ORDER BY ac.SortOrder;";

                using (var multi = await db.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
                {
                    int total = await multi.ReadFirstAsync<int>();
                    var announcements = (await multi.ReadAsync<AnnouncementDto>()).ToList();
                    var contents = await multi.ReadAsync<dynamic>();

                    foreach (var ann in announcements)
                    {
                        ann.Content = contents
                            .Where(c => c.AnnouncementId == ann.Id)
                            .Select(c => (string)c.Content)
                            .ToList();
                    }

                    return (announcements, total);
                }
            }
        }

        public async Task<(IEnumerable<CourseDto> Items, int Total)> GetCourseSummaryAsync(int page, int limit)
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT COUNT(*) FROM Courses;
                    SELECT Id, Title, ImageUrl as Image, StudentsEnrolled, Price, Category, DeliveryMode,
                           ModuleLeader, OverallHours, TeachersCount, Priority, OnlinePrice, OfflinePrice
                    FROM Courses
                    ORDER BY 
                        CASE Priority 
                            WHEN 'high' THEN 1 
                            WHEN 'medium' THEN 2 
                            WHEN 'low' THEN 3 
                            ELSE 4 END,
                        CreatedAt DESC
                    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

                using (var multi = await db.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
                {
                    int total = await multi.ReadFirstAsync<int>();
                    var items = await multi.ReadAsync<CourseDto>();
                    return (items, total);
                }
            }
        }

        public async Task<(IEnumerable<AdvertisementDto> Items, int Total)> GetAdvertisementsAsync(int page, int limit)
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT COUNT(*) FROM Advertisements;
                    SELECT Id, Title, ImageUrl, LinkUrl 
                    FROM Advertisements 
                    ORDER BY CreatedAt DESC 
                    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

                using (var multi = await db.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
                {
                    int total = await multi.ReadFirstAsync<int>();
                    var items = await multi.ReadAsync<AdvertisementDto>();
                    return (items, total);
                }
            }
        }

        public async Task RecordVisitAsync(int month, int year, bool isNewVisitor, string source)
        {
            using (var db = Connection)
            {
                // Upsert logic for SiteAnalytics
                const string analyticsSql = @"
                    IF EXISTS (SELECT 1 FROM SiteAnalytics WHERE AnalyticMonth = @Month AND AnalyticYear = @Year)
                    BEGIN
                        UPDATE SiteAnalytics 
                        SET TotalVisits = TotalVisits + 1,
                            TotalVisitors = TotalVisitors + @VisitorInc
                        WHERE AnalyticMonth = @Month AND AnalyticYear = @Year
                    END
                    ELSE
                    BEGIN
                        INSERT INTO SiteAnalytics (Id, AnalyticMonth, AnalyticYear, TotalVisits, TotalVisitors)
                        VALUES (NEWID(), @Month, @Year, 1, @VisitorInc)
                    END";

                await db.ExecuteAsync(analyticsSql, new { Month = month, Year = year, VisitorInc = isNewVisitor ? 1 : 0 });

                if (!string.IsNullOrEmpty(source) && isNewVisitor)
                {
                    const string utmSql = @"
                        DECLARE @AnalyticId UNIQUEIDENTIFIER = (SELECT Id FROM SiteAnalytics WHERE AnalyticMonth = @Month AND AnalyticYear = @Year);
                        IF EXISTS (SELECT 1 FROM UtmSources WHERE AnalyticId = @AnalyticId AND Source = @Source)
                        BEGIN
                            UPDATE UtmSources SET UserCount = UserCount + 1 WHERE AnalyticId = @AnalyticId AND Source = @Source
                        END
                        ELSE
                        BEGIN
                            INSERT INTO UtmSources (AnalyticId, Source, UserCount) VALUES (@AnalyticId, @Source, 1)
                        END";
                    await db.ExecuteAsync(utmSql, new { Month = month, Year = year, Source = source });
                }
            }
        }
    }
}
