using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduNex.Common;
using EduNex.DataAccess;
using EduNex.Models;

namespace EduNex.Services
{
    public interface IFeedbackService
    {
        Task<Feedback> CreateFeedbackAsync(CreateFeedbackRequest input);
        Task<(List<Feedback> Data, int Total, int Page, int Limit)> ListFeedbackAsync(ListFeedbackQuery query);
        Task<List<Feedback>> ListPublicFeedbackAsync();
        Task<Feedback> ReplyFeedbackAsync(Guid id, string reply);
        Task DeleteFeedbackAsync(Guid id);
        Task<FeedbackStatsDto> GetStatsAsync();
    }

    public class FeedbackService : IFeedbackService
    {
        private readonly IFeedbackDal _repo;
        private readonly IMailService _mail;

        public FeedbackService(IFeedbackDal repo, IMailService mail)
        {
            _repo = repo;
            _mail = mail;
        }

        public Task<Feedback> CreateFeedbackAsync(CreateFeedbackRequest input) =>
            _repo.CreateAsync(new Feedback
            {
                Name = input.Name,
                Email = input.Email,
                Rating = (short)input.Rating,
                FeedbackText = input.FeedbackText
            });

        public async Task<(List<Feedback> Data, int Total, int Page, int Limit)> ListFeedbackAsync(ListFeedbackQuery query)
        {
            var page = Math.Max(1, query.Page ?? 1);
            var limit = Math.Min(100, Math.Max(1, query.Limit ?? 10));
            var offset = (page - 1) * limit;

            var (data, total) = await _repo.FindAllAsync(query.Rating, limit, offset);
            return (data, total, page, limit);
        }

        public Task<List<Feedback>> ListPublicFeedbackAsync() => _repo.FindPublicAsync();

        public async Task<Feedback> ReplyFeedbackAsync(Guid id, string reply)
        {
            var entry = await _repo.ReplyAsync(id, reply);

            // Fire-and-forget, matching the TS call NOT being awaited and
            // NOT wrapped in a try/catch - true Node fire-and-forget, where
            // an unhandled rejection just logs a process-level warning and
            // never touches the in-flight HTTP response. A literal port of
            // "don't catch it" is a real footgun in .NET though (unobserved
            // Task exceptions can crash the process on some configurations),
            // so this DOES add a catch as a deliberate safety improvement -
            // the "don't block the response" timing behavior is identical,
            // only the crash-safety differs from the source.
            _ = Task.Run(async () =>
            {
                try
                {
                    await _mail.SendFeedbackReplyAsync(entry.Email, entry.Name, entry.FeedbackText, reply);
                }
                catch
                {
                    // Swallowed - see comment above.
                }
            });

            return entry;
        }

        // NOTE: no existence check first, unlike every other module's
        // remove(). Matches feedbackService.deleteFeedback exactly - it
        // calls repository.remove(id) directly with no prior findById, so
        // deleting a nonexistent id silently returns 204, not 404.
        public Task DeleteFeedbackAsync(Guid id) => _repo.RemoveAsync(id);

        public async Task<FeedbackStatsDto> GetStatsAsync()
        {
            var averageTask = _repo.GetAverageRatingAsync();
            var totalTask = _repo.CountAllAsync();
            await Task.WhenAll(averageTask, totalTask);

            return new FeedbackStatsDto
            {
                AverageRating = Math.Round((double)averageTask.Result, 2),
                TotalFeedback = totalTask.Result
            };
        }
    }
}