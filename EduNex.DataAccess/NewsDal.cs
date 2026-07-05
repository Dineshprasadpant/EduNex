using Dapper;
using EduNex.Models;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

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

        public async Task<Guid> CreateAsync(News news)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                using (var trans = conn.BeginTransaction())
                {
                    try
                    {
                        news.Id = Guid.NewGuid();
                        const string sql = "INSERT INTO News (Id, Title, Image, PublishedDate, Publisher, CreatedAt) VALUES (@Id, @Title, @Image, @PublishedDate, @Publisher, SYSUTCDATETIME())";
                        await conn.ExecuteAsync(sql, news, trans);

                        if (news.Content?.Any() == true)
                            await conn.ExecuteAsync("INSERT INTO NewsContents (NewsId, Paragraph, SortOrder) VALUES (@Id, @Content, @SortOrder)", 
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
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT * FROM News WHERE Id = @Id;
                    SELECT Paragraph FROM NewsContents WHERE NewsId = @Id ORDER BY SortOrder;
                    SELECT MaterialName, FileType, FileSize, Url FROM ResourceMaterials WHERE OwnerId = @Id AND OwnerType = 'News';";
                using (var multi = await conn.QueryMultipleAsync(sql, new { Id = id }))
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
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                const string sql = @"
                    SELECT COUNT(*) FROM News;
                    SELECT * FROM News ORDER BY PublishedDate DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
                    SELECT nc.NewsId, nc.Paragraph FROM NewsContents nc INNER JOIN (SELECT Id FROM News ORDER BY PublishedDate DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY) n ON nc.NewsId = n.Id;";
                using (var multi = await conn.QueryMultipleAsync(sql, new { Offset = (page - 1) * limit, Limit = limit }))
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
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    const string sql = @"
                UPDATE News
                SET
                    Title = @Title,
                    Image = @Image,
                    PublishedDate = @PublishedDate,
                    Publisher = @Publisher,
                    Content = @Content,
                    Cta = @Cta,
                    SubInformation = @SubInformation
                WHERE Id = @Id";

                    return await conn.ExecuteAsync(sql, new
                    {
                        Id = id,
                        news.Title,
                        news.Image,
                        news.PublishedDate,
                        news.Publisher,
                        Content = JsonSerializer.Serialize(news.Content),
                        news.UpdatedAt,
                        Cta = news.Cta == null ? null : JsonSerializer.Serialize(news.Cta),
                        ResourceMaterials = JsonSerializer.Serialize(news.ResourceMaterials),
                        SubInformation = JsonSerializer.Serialize(news.SubInformation)
                    }) > 0;
                }
            }

    public async Task<bool> DeleteAsync(Guid id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                return await conn.ExecuteAsync("DELETE FROM News WHERE Id = @Id", new { Id = id }) > 0;
            }
        }
    }
}
