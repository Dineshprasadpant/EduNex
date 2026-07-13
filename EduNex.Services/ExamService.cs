using System.Linq;
using System.Text.Json;
using EduNex.DataAccess;
using EduNex.Models;

namespace EduNex.Services
{
    public interface IExamService
    {
        Task<Exam> CreateExamAsync(CreateExamRequestDto input, Guid createdBy);
        Task<(List<ExamListItemDto> Data, PaginationMeta Meta)> ListExamsAsync(ListExamsQueryDto query, Guid? requesterUserId, string? requesterRole);
        Task<ExamDetailDto> GetExamByIdAsync(Guid id);
        Task<Exam> UpdateExamAsync(Guid id, UpdateExamRequestDto input);
        Task DeleteExamAsync(Guid id);

        Task<StartAttemptResultDto> StartAttemptAsync(Guid userId, Guid examId);
        Task<SaveAnswerResultDto> SaveAnswerAsync(Guid userId, Guid attemptId, Guid questionId, Guid? selectedOptionId);
        Task<FlagQuestionResultDto> FlagQuestionAsync(Guid userId, Guid attemptId, Guid questionId, bool isFlagged);
        Task<SubmitAttemptResultDto> SubmitAttemptAsync(Guid userId, Guid attemptId);
        Task<(List<AttemptHistoryRowDto> Data, PaginationMeta Meta)> GetHistoryAsync(Guid userId, ListHistoryQueryDto query);
        Task<AttemptDetailDto> GetAttemptDetailAsync(Guid userId, Guid attemptId, string userRole);
        Task<(List<ExamAttemptRowDto> Data, PaginationMeta Meta)> GetExamAttemptsAsync(Guid examId, AttemptsPaginationQueryDto query);
        Task<(List<AllAttemptsRowDto> Data, PaginationMeta Meta)> ListAllAttemptsAsync(AttemptsPaginationQueryDto query);
    }
    public class ExamService : IExamService
    {
        private readonly IExamDal _examDal;

        public ExamService(IExamDal examDal)
        {
            _examDal = examDal;
        }

        private static readonly Guid NoCourseSentinel = Guid.Parse("00000000-0000-0000-0000-000000000000");

        private async Task<decimal> ComputeTotalMarksAsync(Guid sheetId)
        {
            var total = await _examDal.SumSheetMarksAsync(sheetId);
            if (total <= 0)
            {
                throw new BadRequestException(
                    "Selected question sheet has no questions with marks -- add questions before creating the exam");
            }
            return total;
        }

        public async Task<Exam> CreateExamAsync(CreateExamRequestDto input, Guid createdBy)
        {
            var totalMarks = await ComputeTotalMarksAsync(input.QuestionSheetId);
            var examCode = _examDal.GenerateExamCode();

            var accessPlans = input.AccessPlans.Count > 0
                ? input.AccessPlans
                : new List<string> { PlanType.Free, PlanType.Half, PlanType.Full };

            var exam = new Exam
            {
                ExamCode = examCode,
                Title = input.Title,
                Description = input.Description,
                StartDateTime = input.StartDateTime,
                EndDateTime = input.EndDateTime,
                TotalMarks = totalMarks,
                PassMarks = input.PassMarks,
                DurationMinutes = input.DurationMinutes,
                NegativeMarking = input.NegativeMarking,
                NegativeMarkingValue = input.NegativeMarkingValue,
                QuestionSheetId = input.QuestionSheetId,
                CourseId = input.CourseId,
                AccessPlans = JsonSerializer.Serialize(accessPlans),
                CreatedBy = createdBy,
            };

            return await _examDal.CreateAsync(exam);
        }

        public async Task<(List<ExamListItemDto> Data, PaginationMeta Meta)> ListExamsAsync(
            ListExamsQueryDto query, Guid? requesterUserId, string? requesterRole)
        {
            var pagination = Paginator.Paginate(query.Page.ToString(), query.Limit.ToString());

            var filters = new ExamFilters { Search = query.Search, Status = query.Status };

            if (requesterRole == "User" && requesterUserId.HasValue)
            {
                var plan = await _examDal.FindStudentPlanAsync(requesterUserId.Value);
                var courseId = await _examDal.FindStudentCourseIdAsync(requesterUserId.Value);

                if (plan is not null) filters.Plan = plan;
                filters.ExcludeSubmittedByUserId = requesterUserId.Value;
                filters.EnrolledCourseId = courseId ?? NoCourseSentinel;
            }

            var (data, total) = await _examDal.FindAllAsync(
                filters, new DalPagination { Offset = pagination.Offset, Limit = pagination.Limit });

            return (data, PaginationMeta.Create(total, pagination.Page, pagination.Limit));
        }

        public async Task<ExamDetailDto> GetExamByIdAsync(Guid id)
        {
            var exam = await _examDal.FindByIdAsync(id);
            if (exam is null) throw new NotFoundException("Exam not found");

            var counts = await _examDal.GetAttemptCountsAsync(id);

            return new ExamDetailDto
            {
                Id = exam.Id,
                ExamCode = exam.ExamCode,
                Title = exam.Title,
                Description = exam.Description,
                StartDateTime = exam.StartDateTime,
                EndDateTime = exam.EndDateTime,
                TotalMarks = exam.TotalMarks,
                PassMarks = exam.PassMarks,
                DurationMinutes = exam.DurationMinutes,
                NegativeMarking = exam.NegativeMarking,
                NegativeMarkingValue = exam.NegativeMarkingValue,
                QuestionSheetId = exam.QuestionSheetId,
                CourseId = exam.CourseId,
                AccessPlans = exam.AccessPlans,
                CreatedBy = exam.CreatedBy,
                CreatedAt = exam.CreatedAt,
                UpdatedAt = exam.UpdatedAt,
                QuestionSheet = exam.QuestionSheet,
                Count = counts,
            };
        }

        public async Task<Exam> UpdateExamAsync(Guid id, UpdateExamRequestDto input)
        {
            var existing = await _examDal.FindByIdAsync(id);
            if (existing is null) throw new NotFoundException("Exam not found");

            decimal? totalMarks = input.QuestionSheetId.HasValue
                ? await ComputeTotalMarksAsync(input.QuestionSheetId.Value)
                : null;

            var updated = await _examDal.UpdateAsync(id, input, totalMarks);
            return updated ?? throw new NotFoundException("Exam not found");
        }

        public async Task DeleteExamAsync(Guid id)
        {
            var exam = await _examDal.FindByIdAsync(id);
            if (exam is null) throw new NotFoundException("Exam not found");
            await _examDal.RemoveAsync(id);
        }


        public async Task<StartAttemptResultDto> StartAttemptAsync(Guid userId, Guid examId)
        {
            var exam = await _examDal.FindByIdAsync(examId);
            if (exam is null) throw new NotFoundException("Exam not found");
            var submitted = await _examDal.FindSubmittedAttemptAsync(userId, examId);
            if (submitted is not null)
            {
                return AlreadySubmittedResult(submitted.Id, exam);
            }

            var now = DateTimeOffset.UtcNow;
            if (exam.StartDateTime > now) throw new BadRequestException("This exam has not started yet");
            if (exam.EndDateTime < now) throw new BadRequestException("This exam has already ended");

            if (exam.CourseId.HasValue)
            {
                var studentCourseId = await _examDal.FindStudentCourseIdAsync(userId);
                if (studentCourseId != exam.CourseId)
                    throw new ForbiddenException("This exam is restricted to students of a different course");
            }

            ExamAttempt attempt;
            var existingAnswers = new Dictionary<Guid, Guid>();
            var flaggedQuestions = new List<Guid>();

            var inProgress = await _examDal.FindOpenAttemptAsync(userId, examId);
            if (inProgress is not null)
            {
                attempt = inProgress;
                var saved = await _examDal.FindAnswersByAttemptAsync(inProgress.Id);
                foreach (var a in saved)
                {
                    if (a.SelectedOptionId.HasValue) existingAnswers[a.QuestionId] = a.SelectedOptionId.Value;
                    if (a.IsFlagged) flaggedQuestions.Add(a.QuestionId);
                }
            }
            else
            {
                var racedSubmit = await _examDal.FindSubmittedAttemptAsync(userId, examId);
                if (racedSubmit is not null)
                {
                    return AlreadySubmittedResult(racedSubmit.Id, exam);
                }
                attempt = await _examDal.CreateAttemptAsync(userId, examId);
            }

            var sheetData = await _examDal.FindSheetByIdAsync(exam.QuestionSheetId);
            var safeQuestions = new List<AttemptQuestionDto>();
            if (sheetData.HasValue)
            {
                var (_, questions, options) = sheetData.Value;
                var optsByQuestion = options.GroupBy(o => o.QuestionId).ToDictionary(g => g.Key, g => g.ToList());

                safeQuestions = questions.Select(q => new AttemptQuestionDto
                {
                    Id = q.Id,
                    QuestionText = q.QuestionText,
                    Marks = q.Marks,
                    Order = q.SortOrder,
                    SortOrder = q.SortOrder,
                    Options = (optsByQuestion.TryGetValue(q.Id, out var opts) ? opts : new List<QuestionOption>())
                        .Select(o => new AttemptQuestionOptionDto
                        {
                            Id = o.Id,
                            OptionText = o.OptionText,
                            Order = o.SortOrder,
                            SortOrder = o.SortOrder,
                        }).ToList(),
                }).ToList();
            }

            return new StartAttemptResultDto
            {
                AlreadySubmitted = false,
                AttemptId = attempt.Id,
                Attempt = attempt,
                Exam = new StartAttemptExamDto
                {
                    Id = exam.Id,
                    Title = exam.Title,
                    TotalMarks = exam.TotalMarks,
                    PassMarks = exam.PassMarks,
                    EndDateTime = exam.EndDateTime,
                    StartDateTime = exam.StartDateTime,
                    DurationMinutes = exam.DurationMinutes,
                    NegativeMarking = exam.NegativeMarking,
                    NegativeMarkingValue = exam.NegativeMarkingValue,
                },
                Questions = safeQuestions,
                ExistingAnswers = existingAnswers,
                FlaggedQuestions = flaggedQuestions,
            };
        }

        private static StartAttemptResultDto AlreadySubmittedResult(Guid attemptId, ExamListItemDto exam) => new()
        {
            AlreadySubmitted = true,
            AttemptId = attemptId,
            Exam = new ExamSummaryDto { Id = exam.Id, Title = exam.Title, TotalMarks = exam.TotalMarks, PassMarks = exam.PassMarks },
        };


        private async Task<ExamAttempt> AssertActiveAttemptAsync(Guid userId, Guid attemptId)
        {
            var result = await _examDal.FindAttemptByIdAsync(attemptId);
            if (result is null) throw new NotFoundException("Attempt not found");
            var (attempt, _) = result.Value;

            if (attempt.UserId != userId) throw new ForbiddenException("You do not own this attempt");
            if (attempt.Status != ExamAttemptStatus.InProgress)
                throw new BadRequestException("This attempt is no longer active");

            return attempt;
        }

        private async Task<ExamListItemDto> AssertExamInWindowAsync(Guid userId, Guid examId, Guid attemptId)
        {
            var exam = await _examDal.FindByIdAsync(examId);
            if (exam is null) throw new NotFoundException("Exam not found");

            var now = DateTimeOffset.UtcNow;
            if (exam.EndDateTime < now)
            {
                await SubmitAttemptAsync(userId, attemptId);
                throw new BadRequestException("Exam time has expired -- your attempt has been auto-submitted");
            }
            if (exam.StartDateTime > now) throw new BadRequestException("This exam has not started yet");

            return exam;
        }

        public async Task<SaveAnswerResultDto> SaveAnswerAsync(Guid userId, Guid attemptId, Guid questionId, Guid? selectedOptionId)
        {
            var attempt = await AssertActiveAttemptAsync(userId, attemptId);
            await AssertExamInWindowAsync(userId, attempt.ExamId, attemptId);

            var isCorrect = selectedOptionId.HasValue
                && await _examDal.FindOptionCorrectnessAsync(selectedOptionId.Value);

            var saved = await _examDal.SaveAnswerAsync(attemptId, questionId, selectedOptionId, isCorrect);

            return new SaveAnswerResultDto
            {
                AttemptId = saved.AttemptId,
                QuestionId = saved.QuestionId,
                SelectedOptionId = saved.SelectedOptionId,
                IsFlagged = saved.IsFlagged,
                AnsweredAt = saved.AnsweredAt,
            };
        }

        public async Task<FlagQuestionResultDto> FlagQuestionAsync(Guid userId, Guid attemptId, Guid questionId, bool isFlagged)
        {
            var attempt = await AssertActiveAttemptAsync(userId, attemptId);
            await AssertExamInWindowAsync(userId, attempt.ExamId, attemptId);

            var saved = await _examDal.FlagQuestionAsync(attemptId, questionId, isFlagged);
            return new FlagQuestionResultDto { AttemptId = saved.AttemptId, QuestionId = saved.QuestionId, IsFlagged = saved.IsFlagged };
        }

        private class Tallied
        {
            public int CorrectAnswers;
            public int IncorrectAnswers;
            public int Unanswered;
            public decimal PositiveMarks;
            public decimal IncorrectMarks;
        }

        private static Tallied Tally(List<Question> questions, List<ExamAttemptAnswer> answers)
        {
            var map = answers.ToDictionary(a => a.QuestionId);
            var result = new Tallied();

            foreach (var q in questions)
            {
                map.TryGetValue(q.Id, out var a);
                var qMarks = q.Marks == 0 ? 1 : q.Marks;
                if (a?.SelectedOptionId is not null)
                {
                    if (a.IsCorrect == true)
                    {
                        result.CorrectAnswers++;
                        result.PositiveMarks += qMarks;
                    }
                    else
                    {
                        result.IncorrectAnswers++;
                        result.IncorrectMarks += qMarks;
                    }
                }
            }

            var answered = answers.Count(a => a.SelectedOptionId is not null);
            result.Unanswered = questions.Count - answered;
            return result;
        }

        public async Task<SubmitAttemptResultDto> SubmitAttemptAsync(Guid userId, Guid attemptId)
        {
            var result = await _examDal.FindAttemptByIdAsync(attemptId);
            if (result is null) throw new NotFoundException("Attempt not found");
            var (attempt, _) = result.Value;

            if (attempt.UserId != userId) throw new ForbiddenException("You do not own this attempt");
            if (attempt.Status == ExamAttemptStatus.Submitted)
                throw new ConflictException("This attempt has already been submitted");

            var exam = await _examDal.FindByIdAsync(attempt.ExamId);
            if (exam is null) throw new NotFoundException("Exam not found");

            var savedAnswers = await _examDal.FindAnswersByAttemptAsync(attemptId);
            var sheetData = await _examDal.FindSheetByIdAsync(exam.QuestionSheetId);
            var allQuestions = sheetData.HasValue ? sheetData.Value.Questions : new List<Question>();

            var tallied = Tally(allQuestions, savedAnswers);

            var negMark = exam.NegativeMarking;

            var negPercent = exam.NegativeMarkingValue ?? 0;
            var negativeDeducted = negMark ? (negPercent / 100m) * tallied.IncorrectMarks : 0m;

            var totalMarks = exam.TotalMarks;
            var marksObtained = Math.Max(0, tallied.PositiveMarks - negativeDeducted);
            var percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;

            var submittedAt = DateTimeOffset.UtcNow;
            var timeTakenSeconds = (int)(submittedAt - attempt.StartedAt).TotalSeconds;

            var saved = await _examDal.SubmitAttemptAsync(attemptId, new SubmitAttemptResults
            {
                MarksObtained = marksObtained,
                TotalMarks = totalMarks,
                CorrectAnswers = tallied.CorrectAnswers,
                IncorrectAnswers = tallied.IncorrectAnswers,
                Unanswered = tallied.Unanswered,
                Percentage = percentage,
                TimeTakenSeconds = timeTakenSeconds,
                SubmittedAt = submittedAt,
            });

            var passMarks = exam.PassMarks;
            bool? passed = passMarks.HasValue ? marksObtained >= passMarks.Value : null;

            return new SubmitAttemptResultDto
            {
                Id = saved.Id,
                UserId = saved.UserId,
                ExamId = saved.ExamId,
                Status = saved.Status,
                Score = marksObtained,
                Percentage = percentage,
                TotalMarks = totalMarks,
                TimeTakenSeconds = timeTakenSeconds,
                WrongAnswers = tallied.IncorrectAnswers,
                SkippedAnswers = tallied.Unanswered,
                Result = passed == true ? "pass" : passed == false ? "fail" : null,
                Passed = passed,
                PassMarks = passMarks,
                CorrectAnswers = tallied.CorrectAnswers,
                IncorrectAnswers = tallied.IncorrectAnswers,
                Unanswered = tallied.Unanswered,
                TotalQuestions = allQuestions.Count,
                SubmittedAt = saved.SubmittedAt,
                StartedAt = saved.StartedAt,
            };
        }

        public async Task<(List<AttemptHistoryRowDto> Data, PaginationMeta Meta)> GetHistoryAsync(Guid userId, ListHistoryQueryDto query)
        {
            var pagination = Paginator.Paginate(query.Page.ToString(), query.Limit.ToString());

            var (data, total) = await _examDal.FindHistoryAsync(
                userId,
                new ExamHistoryFilters { ExamId = query.ExamId, Search = query.Search, From = query.From, To = query.To },
                new DalPagination { Offset = pagination.Offset, Limit = pagination.Limit });

            foreach (var row in data)
            {
                bool? passed = row.Status == ExamAttemptStatus.Submitted && row.ExamPassMarks.HasValue && row.MarksObtained.HasValue
                    ? row.MarksObtained.Value >= row.ExamPassMarks.Value
                    : null;
                row.Result = passed == true ? "pass" : passed == false ? "fail" : null;
            }

            return (data, PaginationMeta.Create(total, pagination.Page, pagination.Limit));
        }

        public async Task<AttemptDetailDto> GetAttemptDetailAsync(Guid userId, Guid attemptId, string userRole="")
        {
            var detail = await _examDal.FindDetailedAttemptAsync(attemptId);
            if (detail is null) throw new NotFoundException("Attempt not found");

            var isOwner = detail.UserId == userId;
            var isPrivileged = userRole == "Admin"|| userRole == "Teacher";
            if (!isPrivileged && !isOwner) throw new ForbiddenException("You do not have access to this attempt");

            var allowAnswerKey = isPrivileged || detail.Status == ExamAttemptStatus.Submitted;
            if (!allowAnswerKey)
            {
                foreach (var q in detail.Questions)
                {
                    foreach (var o in q.Options) o.IsCorrect = null;
                    if (q.UserAnswer is not null) q.UserAnswer.IsCorrect = null;
                }
            }

            return detail;
        }

        public async Task<(List<ExamAttemptRowDto> Data, PaginationMeta Meta)> GetExamAttemptsAsync(Guid examId, AttemptsPaginationQueryDto query)
        {
            var pagination = Paginator.Paginate(query.Page.ToString(), query.Limit.ToString());

            var (data, total) = await _examDal.FindAttemptsByExamAsync(
                examId, new DalPagination { Offset = pagination.Offset, Limit = pagination.Limit }, query.Search);

            return (data, PaginationMeta.Create(total, pagination.Page, pagination.Limit));
        }

        public async Task<(List<AllAttemptsRowDto> Data, PaginationMeta Meta)> ListAllAttemptsAsync(AttemptsPaginationQueryDto query)
        {
            var pagination = Paginator.Paginate(query.Page.ToString(), query.Limit.ToString());

            var (data, total) = await _examDal.FindAllAttemptsAsync(
                new DalPagination { Offset = pagination.Offset, Limit = pagination.Limit },
                new AllAttemptsFilters { Search = query.Search, From = query.From, To = query.To });

            return (data, PaginationMeta.Create(total, pagination.Page, pagination.Limit));
        }
    }
}