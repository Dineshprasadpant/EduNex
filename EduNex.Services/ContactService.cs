using EduNex.Models;
using EduNex.DataAccess;
namespace EduNex.Services;

public interface IContactService
{
    Task<ContactMessage> CreateMessageAsync(CreateContactDto input);
    Task<ApiListResponse<ContactMessage>> ListMessagesAsync(ContactQueryDto query);
    Task<ContactMessage> GetMessageAsync(Guid id);
    Task<ContactMessage> ReplyMessageAsync(Guid id, string reply);
    Task DeleteMessageAsync(Guid id);
    Task<ContactStatsDto> GetStatsAsync();
}

public class ContactService : IContactService
{
    private readonly IContactDal _repository;
    private readonly IMailService _mailService;

    public ContactService(IContactDal repository, IMailService mailService)
    {
        _repository = repository;
        _mailService = mailService;
    }

    public async Task<ContactMessage> CreateMessageAsync(CreateContactDto input)
    {
        var entry = await _repository.CreateAsync(input);

        // Fire-and-forget notification — see note above re: scope handling.
        // Not awaited on purpose, matching original Node behavior.
        //_ = _mailService.SendNewContactNotificationAsync(
        //    entry.Name, entry.Email, entry.Phone, entry.Subject, entry.Message);

        return entry;
    }

    public async Task<ApiListResponse<ContactMessage>> ListMessagesAsync(ContactQueryDto query)
    {
        var pagination = Paginator.Paginate(query.Page.ToString(), query.Limit.ToString());

        var (data, total) = await _repository.FindAllAsync(query, pagination.Offset, pagination.Limit);

        // Create the meta object
        var meta = PaginationMeta.Create(total, pagination.Page, pagination.Limit);

        return ApiListResponse<ContactMessage>.Ok(data, meta);
    }

    public async Task<ContactMessage> GetMessageAsync(Guid id)
    {
        var entry = await _repository.FindByIdAsync(id);
        if (entry is null) throw new NotFoundException("Contact message not found");
        return entry;
    }

    public async Task<ContactMessage> ReplyMessageAsync(Guid id, string reply)
    {
        var entry = await _repository.ReplyAsync(id, reply);
        if (entry is null) throw new NotFoundException("Contact message not found");

        //_ = _mailService.SendContactReplyAsync(entry.Email, entry.Name, entry.Subject, entry.Message, reply);

        return entry;
    }

    public async Task DeleteMessageAsync(Guid id)
    {
        await _repository.RemoveAsync(id);
    }

    public Task<ContactStatsDto> GetStatsAsync() => _repository.GetStatsAsync();
}