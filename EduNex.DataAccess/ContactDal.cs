using System.Data;
using Dapper;
using EduNex.Models;

namespace EduNex.DataAccess;

public interface IContactDal
{
    Task<(IEnumerable<ContactMessage> Data, int Total)> FindAllAsync(ContactQueryDto query, int offset, int limit);
    Task<ContactMessage?> FindByIdAsync(Guid id);
    Task<ContactMessage> CreateAsync(CreateContactDto input);
    Task<ContactMessage?> ReplyAsync(Guid id, string reply);
    Task RemoveAsync(Guid id);
    Task<ContactStatsDto> GetStatsAsync();
}
public class ContactDal : IContactDal
{
    private readonly IDbConnection _db;

    public ContactDal(IDbConnection db)
    {
        _db = db;
    }

    public async Task<(IEnumerable<ContactMessage> Data, int Total)> FindAllAsync(
        ContactQueryDto query, int offset, int limit)
    {
        var conditions = new List<string>();
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            conditions.Add("status = @Status");
            parameters.Add("Status", query.Status);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            conditions.Add("(name ILIKE @Search OR email ILIKE @Search OR subject ILIKE @Search)");
            parameters.Add("Search", $"%{query.Search}%");
        }

        var whereClause = conditions.Count > 0 ? $"WHERE {string.Join(" AND ", conditions)}" : "";

        parameters.Add("Offset", offset);
        parameters.Add("Limit", limit);

       
        var sql = $@"
            SELECT * FROM contact_messages
            {whereClause}
            ORDER BY created_at DESC
            OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

            SELECT COUNT(*) FROM contact_messages
            {whereClause};";

        using var multi = await _db.QueryMultipleAsync(sql, parameters);
        var data = await multi.ReadAsync<ContactMessage>();
        var total = await multi.ReadSingleAsync<int>();

        return (data, total);
    }

    public async Task<ContactMessage?> FindByIdAsync(Guid id)
    {
        const string sql = "SELECT * FROM contact_messages WHERE id = @Id";
        return await _db.QueryFirstOrDefaultAsync<ContactMessage>(sql, new { Id = id });
    }

    public async Task<ContactMessage> CreateAsync(CreateContactDto input)
    {
        const string sql = @"
            INSERT INTO contact_messages (name, email, phone, subject, message, status, created_at)
            OUTPUT INSERTED.*
            VALUES (@Name, @Email, @Phone, @Subject, @Message, 'pending', GETUTCDATE());";

        return await _db.QuerySingleAsync<ContactMessage>(sql, new
        {
            input.Name,
            input.Email,
            Phone = string.IsNullOrEmpty(input.Phone) ? null : input.Phone,
            input.Subject,
            input.Message,
        });
    }

    public async Task<ContactMessage?> ReplyAsync(Guid id, string reply)
    {
        const string sql = @"
            UPDATE contact_messages
            SET admin_reply = @Reply, replied_at = GETUTCDATE(), status = 'replied'
            OUTPUT INSERTED.*
            WHERE id = @Id;";

        return await _db.QueryFirstOrDefaultAsync<ContactMessage>(sql, new { Id = id, Reply = reply });
    }

    public async Task RemoveAsync(Guid id)
    {
        const string sql = "DELETE FROM contact_messages WHERE id = @Id";
        await _db.ExecuteAsync(sql, new { Id = id });
    }

    public async Task<ContactStatsDto> GetStatsAsync()
    {
        const string sql = @"
            SELECT
                COUNT(*) AS Total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS Pending,
                SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) AS Replied
            FROM contact_messages;";

        return await _db.QuerySingleAsync<ContactStatsDto>(sql);
    }
}