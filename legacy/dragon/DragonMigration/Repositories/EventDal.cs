using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using EduNex.Models;
using Microsoft.Data.SqlClient;

namespace EduNex.DataAccess
{
    public interface IEventDal
    {
        Task<Event> GetByIdAsync(Guid id);
        Task<Guid> CreateAsync(Event @event);
        Task<bool> UpdateAsync(Guid id, Event @event);
        Task<bool> DeleteAsync(Guid id);
        Task<IEnumerable<Event>> GetByMonthAndYearAsync(string month, string year);
        Task<(IEnumerable<Event> Items, int Total)> GetAllPaginatedAsync(int page, int limit);
    }

    public class EventDal : IEventDal
    {
        private readonly string _connectionString;
        public EventDal(string connectionString) => _connectionString = connectionString;
        private IDbConnection Connection => new SqlConnection(_connectionString);

        public async Task<Event> GetByIdAsync(Guid id)
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT * FROM Events WHERE Id = @Id;
                    SELECT MaterialName, FileType, FileSize, Url FROM ResourceMaterials WHERE OwnerId = @Id AND OwnerType = 'Event';
                    SELECT Title, Description FROM SubInformation WHERE OwnerId = @Id AND OwnerType = 'Event' ORDER BY SortOrder;";

                using (var multi = await db.QueryMultipleAsync(sql, new { Id = id }))
                {
                    var @event = await multi.ReadFirstOrDefaultAsync<Event>();
                    if (@event == null) return null;

                    @event.ResourceMaterials = (await multi.ReadAsync<ResourceMaterial>()).ToList();
                    @event.ExtraInformation = (await multi.ReadAsync<ExtraInformation>()).ToList();
                    return @event;
                }
            }
        }

        public async Task<IEnumerable<Event>> GetByMonthAndYearAsync(string month, string year)
        {
            using (var db = Connection)
            {
                const string sql = "SELECT * FROM Events WHERE Month = @Month AND Year = @Year";
                return await db.QueryAsync<Event>(sql, new { Month = month, Year = year });
            }
        }

        public async Task<(IEnumerable<Event> Items, int Total)> GetAllPaginatedAsync(int page, int limit)
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT COUNT(*) FROM Events;
                    SELECT * FROM Events ORDER BY StartDate DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";
                using (var multi = await db.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
                {
                    return (await multi.ReadAsync<Event>(), await multi.ReadFirstAsync<int>());
                }
            }
        }

        public async Task<Guid> CreateAsync(Event ev)
        {
            using (var db = Connection)
            {
                db.Open();
                using (var trans = db.BeginTransaction())
                {
                    try
                    {
                        ev.Id = Guid.NewGuid();
                        const string sql = @"
                            INSERT INTO Events (Id, Title, Description, EventType, Month, Year, StartDate, EndDate, IsActive, 
                                              OrganizerName, OrganizerEmail, OrganizerPhone, VenueName, VenueAddress, CreatedAt, UpdatedAt)
                            VALUES (@Id, @Title, @Description, @EventType, @Month, @Year, @StartDate, @EndDate, @IsActive, 
                                    @OrgName, @OrgEmail, @OrgPhone, @VenName, @VenAddress, SYSUTCDATETIME(), SYSUTCDATETIME())";
                        
                        await db.ExecuteAsync(sql, new {
                            ev.Id, ev.Title, ev.Description, ev.EventType, ev.Month, ev.Year, ev.StartDate, ev.EndDate, ev.IsActive,
                            OrgName = ev.Organizer?.Name, OrgEmail = ev.Organizer?.Email, OrgPhone = ev.Organizer?.Phone,
                            VenName = ev.Venue?.Name, VenAddress = ev.Venue?.Address
                        }, trans);

                        if (ev.ResourceMaterials?.Any() == true)
                        {
                            await db.ExecuteAsync(@"INSERT INTO ResourceMaterials (OwnerId, OwnerType, MaterialName, FileType, FileSize, Url) 
                                                  VALUES (@Id, 'Event', @MaterialName, @FileType, @FileSize, @Url)",
                                ev.ResourceMaterials.Select(r => new { Id = ev.Id, r.MaterialName, r.FileType, r.FileSize, r.Url }), trans);
                        }

                        trans.Commit();
                        return ev.Id;
                    }
                    catch { trans.Rollback(); throw; }
                }
            }
        }

        public async Task<bool> UpdateAsync(Guid id, Event ev)
        {
            using (var db = Connection)
            {
                const string sql = @"UPDATE Events SET Title = @Title, Description = @Description, IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME() WHERE Id = @Id";
                return await db.ExecuteAsync(sql, new { ev.Title, ev.Description, ev.IsActive, Id = id }) > 0;
            }
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using (var db = Connection) => await db.ExecuteAsync("DELETE FROM Events WHERE Id = @Id", new { Id = id }) > 0;
        }
    }
}
