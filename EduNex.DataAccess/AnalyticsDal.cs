using EduNex.Models;
using Dapper;
using Microsoft.Data.SqlClient;

namespace EduNex.DataAccess
{
    public interface IAnalyticsDal
    {
        Task RecordVisitAsync(int month, int year, bool isNewVisitor, string source);
        Task IncrementSubscribersAsync(int month, int year);
        Task IncrementEnrollmentAsync(int month, int year, string planType);
        Task<UserAnalytics> GetByMonthYearAsync(int month, int year);
        Task<IEnumerable<UserAnalytics>> GetByYearAsync(int year);
        Task<IEnumerable<UserAnalytics>> GetAllAsync();
    }

    public class AnalyticsDal : IAnalyticsDal
    {
        private readonly string _connectionString;
        public AnalyticsDal(string connectionString) => _connectionString = connectionString;

        public async Task RecordVisitAsync(int month, int year, bool isNewVisitor, string source)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    IF EXISTS (SELECT 1 FROM SiteAnalytics WHERE AnalyticMonth = @Month AND AnalyticYear = @Year)
                    BEGIN
                        UPDATE SiteAnalytics SET TotalVisits = TotalVisits + 1, TotalVisitors = TotalVisitors + @VisitorInc WHERE AnalyticMonth = @Month AND AnalyticYear = @Year
                    END
                    ELSE
                    BEGIN
                        INSERT INTO SiteAnalytics (Id, AnalyticMonth, AnalyticYear, TotalVisits, TotalVisitors) VALUES (NEWID(), @Month, @Year, 1, @VisitorInc)
                    END";
                await conn.ExecuteAsync(sql, new { Month = month, Year = year, VisitorInc = isNewVisitor ? 1 : 0 });

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
                    await conn.ExecuteAsync(utmSql, new { Month = month, Year = year, Source = source });
                }
            }
        }

        public async Task IncrementSubscribersAsync(int month, int year)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    IF EXISTS (SELECT 1 FROM SiteAnalytics WHERE AnalyticMonth = @Month AND AnalyticYear = @Year)
                        UPDATE SiteAnalytics SET SubscribersGain = SubscribersGain + 1 WHERE AnalyticMonth = @Month AND AnalyticYear = @Year
                    ELSE
                        INSERT INTO SiteAnalytics (Id, AnalyticMonth, AnalyticYear, SubscribersGain) VALUES (NEWID(), @Month, @Year, 1)";
                await conn.ExecuteAsync(sql, new { Month = month, Year = year });
            }
        }

        public async Task IncrementEnrollmentAsync(int month, int year, string planType)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string column = planType.ToLower() switch { "free" => "EnrolledFree", "half" => "EnrolledHalf", "full" => "EnrolledFull", _ => throw new Exception("Invalid plan") };
                string sql = $@"
                    IF EXISTS (SELECT 1 FROM SiteAnalytics WHERE AnalyticMonth = @Month AND AnalyticYear = @Year)
                        UPDATE SiteAnalytics SET {column} = {column} + 1 WHERE AnalyticMonth = @Month AND AnalyticYear = @Year
                    ELSE
                        INSERT INTO SiteAnalytics (Id, AnalyticMonth, AnalyticYear, {column}) VALUES (NEWID(), @Month, @Year, 1)";
                await conn.ExecuteAsync(sql, new { Month = month, Year = year });
            }
        }

        public async Task<UserAnalytics> GetByMonthYearAsync(int month, int year)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = "SELECT * FROM SiteAnalytics WHERE AnalyticMonth = @Month AND AnalyticYear = @Year; SELECT Source, UserCount FROM UtmSources WHERE AnalyticId = (SELECT Id FROM SiteAnalytics WHERE AnalyticMonth = @Month AND AnalyticYear = @Year);";
                using (var multi = await conn.QueryMultipleAsync(sql, new { Month = month, Year = year }))
                {
                    var ana = await multi.ReadFirstOrDefaultAsync<UserAnalytics>();
                    if (ana != null)
                        ana.UtmSources = (await multi.ReadAsync<UtmSource>()).ToList();
                    return ana;
                }
            }
        }

        public async Task<IEnumerable<UserAnalytics>> GetByYearAsync(int year)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
               return await conn.QueryAsync<UserAnalytics>("SELECT * FROM SiteAnalytics WHERE AnalyticYear = @Year ORDER BY AnalyticMonth", new { Year = year });
            }
        }

        public async Task<IEnumerable<UserAnalytics>> GetAllAsync()
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
              return  await conn.QueryAsync<UserAnalytics>("SELECT * FROM SiteAnalytics ORDER BY AnalyticYear, AnalyticMonth");
            }
        }
    }
}
