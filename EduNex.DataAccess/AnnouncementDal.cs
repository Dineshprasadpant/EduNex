using EduNex.Models;
using Microsoft.Data.SqlClient;
using Dapper;
using System.Data;

namespace EduNex.DataAccess
{
    public interface IAnnouncementDal
    {
        Task<Guid> CreateAsync(Announcement announcement);
        Task<Announcement?> GetByIdAsync(Guid id);
        Task<DbResponse<dynamic>> GetAllPaginatedAsync(int page, int limit);
        Task<bool> UpdateAsync(Guid id, Announcement announcement);
        Task<bool> DeleteAsync(Guid id);
    }

    public class AnnouncementDal : IAnnouncementDal
    {
        private readonly string _connectionString;
        public AnnouncementDal(string connectionString) => _connectionString = connectionString;

        public async Task<Guid> CreateAsync(Announcement ann)
        {
            SqlConnection conn = new SqlConnection(_connectionString);
            conn.Open();
            using (var trans = conn.BeginTransaction())
            {
                try
                {
                    ann.Id = Guid.NewGuid();
                    string sql = @"
                        INSERT INTO Announcements (Id, Title, Image, AnnouncedDate, CtaTitle, CtaDescription, CreatedAt)
                        VALUES (@Id, @Title, @Image, @AnnouncedDate, @CtaTitle, @CtaDescription, @CreatedAt)";

                    await conn.ExecuteAsync(sql, new
                    {
                        ann.Id,
                        ann.Title,
                        ann.Image,
                        ann.AnnouncedDate,
                        CtaTitle = ann.Cta?.Title,
                        CtaDescription = ann.Cta?.Description,
                        ann.CreatedAt
                    }, trans);

                    if (ann.Content?.Any() == true)
                        await conn.ExecuteAsync(
                            "INSERT INTO AnnouncementContents (AnnouncementId, Paragraph, SortOrder) VALUES (@AnnId, @Paragraph, @SortOrder)",
                            ann.Content.Select((p, i) => new { AnnId = ann.Id, Paragraph = p, SortOrder = i }), trans);

                    if (ann.Cta?.Buttons?.Any() == true)
                        await conn.ExecuteAsync(
                            "INSERT INTO AnnouncementCtaButtons (AnnouncementId, ButtonName, Href) VALUES (@AnnId, @ButtonName, @Href)",
                            ann.Cta.Buttons.Select(b => new { AnnId = ann.Id, b.ButtonName, b.Href }), trans);

                    if (ann.ResourceMaterials?.Any() == true)
                        await conn.ExecuteAsync(
                            "INSERT INTO ResourceMaterials (OwnerId, OwnerType, MaterialName, FileType, FileSize, Url) VALUES (@OwnerId, 'Announcement', @MaterialName, @FileType, @FileSize, @Url)",
                            ann.ResourceMaterials.Select(r => new { OwnerId = ann.Id, r.MaterialName, r.FileType, r.FileSize, r.Url }), trans);

                    trans.Commit();
                    return ann.Id;
                }
                catch { trans.Rollback(); throw; }
            }
        }

        public async Task<Announcement?> GetByIdAsync(Guid id)
        {
            using var conn = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT * FROM Announcements WHERE Id = @Id;
                SELECT Paragraph FROM AnnouncementContents WHERE AnnouncementId = @Id ORDER BY SortOrder;
                SELECT ButtonName, Href FROM AnnouncementCtaButtons WHERE AnnouncementId = @Id;
                SELECT MaterialName, FileType, FileSize, Url FROM ResourceMaterials WHERE OwnerId = @Id AND OwnerType = 'Announcement';";

            using var multi = await conn.QueryMultipleAsync(sql, new { Id = id });
            var ann = await multi.ReadFirstOrDefaultAsync<Announcement>();
            if (ann == null) return null;

            ann.Content = (await multi.ReadAsync<string>()).ToList();
            var buttons = (await multi.ReadAsync<CtaButton>()).ToList();
            ann.Cta = new Cta { Title = ann.Title, Buttons = buttons };
            ann.ResourceMaterials = (await multi.ReadAsync<ResourceMaterial>()).ToList();
            return ann;
        }

        public async Task<DbResponse<dynamic>> GetAllPaginatedAsync(int page, int limit)
        {
            using var conn = new SqlConnection(_connectionString);
            const string sql = @"
        SELECT COUNT(*) FROM Announcements;
        SELECT 
            Id as _id,
            Id as id,
            Title as title,
            image,
            AnnouncedDate as announcedDate
        FROM Announcements
        ORDER BY AnnouncedDate DESC
        OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

        SELECT ac.AnnouncementId, ac.Paragraph
        FROM AnnouncementContents ac
        INNER JOIN (
            SELECT Id FROM Announcements
            ORDER BY AnnouncedDate DESC
            OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
        ) a ON ac.AnnouncementId = a.Id;";

            using var multi = await conn.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit });

            int total = await multi.ReadFirstAsync<int>();
            var items = (await multi.ReadAsync<dynamic>()).ToList();
            var contents = (await multi.ReadAsync<dynamic>()).ToList();

            foreach (var item in items)
            {
                item.content = contents
                    .Where(c => c.AnnouncementId == item._id)
                    .Select(c => (string)c.Paragraph)
                    .ToList();
            }

            return new DbResponse<dynamic> { Total = total, Items = items };
        }
        public async Task<bool> UpdateAsync(Guid id, Announcement ann)
        {
            using var conn = new SqlConnection(_connectionString);
            return await conn.ExecuteAsync(
                "UPDATE Announcements SET Title = @Title, Image= @Image, UpdatedAt = SYSUTCDATETIME() WHERE Id = @Id",
                new { ann.Title, ann.Image, Id = id }) > 0;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using var conn = new SqlConnection(_connectionString);
            return await conn.ExecuteAsync("DELETE FROM Announcements WHERE Id = @Id", new { Id = id }) > 0;
        }
    }
}