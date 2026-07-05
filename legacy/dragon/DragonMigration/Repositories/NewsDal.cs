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
    public interface INewsDal
    {
        Task<Guid> CreateAsync(News news);
        Task<News> GetByIdAsync(Guid id);
        Task<(IEnumerable<News> Items, int Total)> GetPaginatedAsync(int page, int limit);
        Task<bool> UpdateAsync(Guid id, News news);
        Task<bool> DeleteAsync(Guid id);
    }

    public class NewsDal : INewsDal
    {
        private readonly string _connectionString;
        public NewsDal(string connectionString) => _connectionString = connectionString;
        private IDbConnection Connection => new SqlConnection(_connectionString);

        public async Task<Guid> CreateAsync(News news)
        {
            using (var db = Connection)
            {
                db.Open();
                using (var trans = db.BeginTransaction())
                {
                    try
                    {
                        news.Id = Guid.NewGuid();
                        const string sql = "INSERT INTO News (Id, Title, ImageUrl, PublishedDate, Publisher, CreatedAt, UpdatedAt) VALUES (@Id, @Title, @Image, @PublishedDate, @Publisher, SYSUTCDATETIME(), SYSUTCDATETIME())";
                        await db.ExecuteAsync(sql, news, trans);

                        if (news.Content?.Any() == true)
                            await db.ExecuteAsync("INSERT INTO NewsContents (NewsId, Paragraph, SortOrder) VALUES (@Id, @Content, @SortOrder)", 
                                news.Content.Select((c, i) => new { Id = news.Id, Content = c, SortOrder = i }), trans);

                        trans.Commit();
                        return news.Id;
                    }
                    catch { trans.Rollback(); throw; }
                }
            }
        }

        public async Task<News> GetByIdAsync(Guid id)
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT * FROM News WHERE Id = @Id;
                    SELECT Paragraph FROM NewsContents WHERE NewsId = @Id ORDER BY SortOrder;
                    SELECT MaterialName, FileType, FileSize, Url FROM ResourceMaterials WHERE OwnerId = @Id AND OwnerType = 'News';";
                using (var multi = await db.QueryMultipleAsync(sql, new { Id = id }))
                {
                    var news = await multi.ReadFirstOrDefaultAsync<News>();
                    if (news != null)
                    {
                        news.Content = (await multi.ReadAsync<string>()).ToList();
                        news.ResourceMaterials = (await multi.ReadAsync<ResourceMaterial>()).ToList();
                    }
                    return news;
                }
            }
        }

        public async Task<(IEnumerable<News> Items, int Total)> GetPaginatedAsync(int page, int limit)
        {
            using (var db = Connection)
            {
                const string sql = @"
                    SELECT COUNT(*) FROM News;
                    SELECT * FROM News ORDER BY PublishedDate DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
                    SELECT nc.NewsId, nc.Paragraph FROM NewsContents nc INNER JOIN (SELECT Id FROM News ORDER BY PublishedDate DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY) n ON nc.NewsId = n.Id;";
                using (var multi = await db.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
                {
                    int total = await multi.ReadFirstAsync<int>();
                    var items = (await multi.ReadAsync<News>()).ToList();
                    var contents = await multi.ReadAsync<dynamic>();

                    foreach (var item in items)
                    {
                        item.Content = contents.Where(c => c.NewsId == item.Id).Select(c => (string)c.Paragraph).ToList();
                    }
                    return (items, total);
                }
            }
        }

        public async Task<bool> UpdateAsync(Guid id, News news)
        {
            using (var db = Connection) => await db.ExecuteAsync("UPDATE News SET Title = @Title, Publisher = @Publisher, UpdatedAt = SYSUTCDATETIME() WHERE Id = @Id", new { news.Title, news.Publisher, Id = id }) > 0;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            using (var db = Connection) return await db.ExecuteAsync("DELETE FROM News WHERE Id = @Id", new { Id = id }) > 0;
        }
    }
}
