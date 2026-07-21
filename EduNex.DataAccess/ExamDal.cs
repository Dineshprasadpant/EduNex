using System.Data;
using System.Text.Json;
using Dapper;
using EduNex.Models;
using Microsoft.Data.SqlClient;
namespace EduNex.DataAccess
{
    public class ExamHistoryFilters
    {
        public Guid? ExamId { get; set; }
        public string? Search { get; set; }
        public string? From { get; set; }
        public string? To { get; set; }
    }

    public class AllAttemptsFilters
    {
        public string? Search { get; set; }
        public string? From { get; set; }
        public string? To { get; set; }
    }

    public class DalPagination
    {
        public int Offset { get; set; }
        public int Limit { get; set; }
    }
    public interface IExamDal
    {
        // -- exams --
        string GenerateExamCode();
        Task<(List<ExamListItemDto> Data, int Total)> FindAllAsync(ExamFilters filters, DalPagination pagination);
        Task<ExamAttemptCountsDto> GetAttemptCountsAsync(Guid examId);
        Task<ExamListItemDto?> FindByIdAsync(Guid id);
        Task<Exam> CreateAsync(Exam exam);
        Task<Exam?> UpdateAsync(Guid id, UpdateExamRequestDto data, decimal? totalMarksOverride = null);
        Task RemoveAsync(Guid id);
        Task<decimal> SumSheetMarksAsync(Guid sheetId);
        Task<string?> FindStudentPlanAsync(Guid userId);
        Task<Guid?> FindStudentCourseIdAsync(Guid userId);
        Task<bool> FindOptionCorrectnessAsync(Guid optionId);
        Task<(QuestionSheet Sheet, List<Question> Questions, List<QuestionOption> Options)?> FindSheetByIdAsync(Guid sheetId);
        Task<ExamAttempt?> FindOpenAttemptAsync(Guid userId, Guid examId);
        Task<ExamAttempt?> FindSubmittedAttemptAsync(Guid userId, Guid examId);
        Task<(ExamAttempt Attempt, List<ExamAttemptAnswer> Answers)?> FindAttemptByIdAsync(Guid id);
        Task<ExamAttempt> CreateAttemptAsync(Guid userId, Guid examId);
        Task<ExamAttemptAnswer> SaveAnswerAsync(Guid attemptId, Guid questionId, Guid? selectedOptionId, bool isCorrect);
        Task<ExamAttemptAnswer> FlagQuestionAsync(Guid attemptId, Guid questionId, bool isFlagged);
        Task<ExamAttempt> SubmitAttemptAsync(Guid attemptId, SubmitAttemptResults results);
        Task<(List<AttemptHistoryRowDto> Data, int Total)> FindHistoryAsync(Guid userId, ExamHistoryFilters filters, DalPagination pagination);
        Task<(List<ExamAttemptRowDto> Data, int Total)> FindAttemptsByExamAsync(Guid examId, DalPagination pagination, string? search);
        Task<AttemptDetailDto?> FindDetailedAttemptAsync(Guid attemptId);
        Task<List<ExamAttemptAnswer>> FindAnswersByAttemptAsync(Guid attemptId);
        Task<(List<AllAttemptsRowDto> Data, int Total)> FindAllAttemptsAsync(DalPagination pagination, AllAttemptsFilters filters);
    }

    public class SubmitAttemptResults
    {
        public decimal MarksObtained { get; set; }
        public decimal TotalMarks { get; set; }
        public int CorrectAnswers { get; set; }
        public int IncorrectAnswers { get; set; }
        public int Unanswered { get; set; }
        public decimal Percentage { get; set; }
        public int TimeTakenSeconds { get; set; }
        public DateTimeOffset SubmittedAt { get; set; }
    }
    public class ExamDal : IExamDal
    {
        private readonly string _connectionString;

        public ExamDal(string connectionString)
        {
            _connectionString = connectionString;
        }

        private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

        private static List<string> ParseAccessPlans(string json)
        {
            try
            {
                return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
            }
            catch (JsonException)
            {
                return new List<string>();
            }
        }

        private static string SerializeAccessPlans(List<string> plans) => JsonSerializer.Serialize(plans);

        private static DateTime? TryParseDate(string? raw) =>
            !string.IsNullOrWhiteSpace(raw) && DateTime.TryParse(raw, out var d) ? d : null;

        // Flat row for the exams-list query (Exam columns + the joined sheet title).
        private class ExamListFlatRow : Exam
        {
            public string? QuestionSheetTitle { get; set; }
        }

        private static ExamListItemDto MapExamListItem(ExamListFlatRow r) => new()
        {
            Id = r.Id,
            ExamCode = r.ExamCode,
            Title = r.Title,
            Description = r.Description,
            StartDateTime = r.StartDateTime,
            EndDateTime = r.EndDateTime,
            TotalMarks = r.TotalMarks,
            PassMarks = r.PassMarks,
            DurationMinutes = r.DurationMinutes,
            NegativeMarking = r.NegativeMarking,
            NegativeMarkingValue = r.NegativeMarkingValue,
            QuestionSheetId = r.QuestionSheetId,
            CourseId = r.CourseId,
            AccessPlans = ParseAccessPlans(r.AccessPlans),
            CreatedBy = r.CreatedBy,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
            QuestionSheet = r.QuestionSheetTitle is not null
                ? new QuestionSheetSummaryDto { Id = r.QuestionSheetId, Title = r.QuestionSheetTitle }
                : null,
        };

        public string GenerateExamCode()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = Random.Shared;
            var code = new char[8];
            for (var i = 0; i < 8; i++)
                code[i] = chars[random.Next(chars.Length)];
            return "EX-" + new string(code);
        }

        public async Task<(List<ExamListItemDto> Data, int Total)> FindAllAsync(ExamFilters filters, DalPagination pagination)
        {
            var conditions = new List<string>();
            var p = new DynamicParameters();

            if (!string.IsNullOrWhiteSpace(filters.Search))
            {
                conditions.Add("e.title LIKE @Search");
                p.Add("Search", $"%{filters.Search}%");
            }
            if (!string.IsNullOrWhiteSpace(filters.Plan))
            {
                // access_plans is a JSON array string (see Exam.AccessPlans);
                // OPENJSON mirrors Postgres's `plan = ANY(access_plans)`.
                conditions.Add("EXISTS (SELECT 1 FROM OPENJSON(e.access_plans) WHERE value = @Plan)");
                p.Add("Plan", filters.Plan);
            }
            if (!string.IsNullOrWhiteSpace(filters.Status))
            {
                var now = DateTimeOffset.UtcNow;
                p.Add("Now", now);
                switch (filters.Status)
                {
                    case ExamLifecycleStatus.Upcoming:
                        conditions.Add("e.start_date_time > @Now");
                        break;
                    case ExamLifecycleStatus.Active:
                        conditions.Add("e.start_date_time <= @Now AND e.end_date_time >= @Now");
                        break;
                    case ExamLifecycleStatus.Ended:
                        conditions.Add("e.end_date_time < @Now");
                        break;
                }
            }
            if (filters.EnrolledCourseId.HasValue)
            {
                conditions.Add("(e.course_id IS NULL OR e.course_id = @EnrolledCourseId)");
                p.Add("EnrolledCourseId", filters.EnrolledCourseId.Value);
            }
            if (filters.ActiveAt.HasValue)
            {
                conditions.Add("e.start_date_time <= @ActiveAt AND e.end_date_time >= @ActiveAt");
                p.Add("ActiveAt", filters.ActiveAt.Value);
            }
            if (filters.ExcludeSubmittedByUserId.HasValue)
            {
                conditions.Add(@"NOT EXISTS (
                    SELECT 1 FROM dbo.exam_attempts ea
                    WHERE ea.exam_id = e.id AND ea.user_id = @ExcludeUserId AND ea.status = 'submitted')");
                p.Add("ExcludeUserId", filters.ExcludeSubmittedByUserId.Value);
            }

            var whereSql = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";
            p.Add("Offset", pagination.Offset);
            p.Add("Limit", pagination.Limit);

            using var connection = CreateConnection();

            var dataSql = $@"
                SELECT e.*, qs.sheet_name AS QuestionSheetTitle
                FROM dbo.exams e
                LEFT JOIN dbo.question_sheets qs ON qs.id = e.question_sheet_id
                {whereSql}
                ORDER BY e.created_at DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY";
            var rows = (await connection.QueryAsync<ExamListFlatRow>(dataSql, p)).ToList();

            var countSql = $"SELECT COUNT(*) FROM dbo.exams e {whereSql}";
            var total = await connection.QueryFirstOrDefaultAsync<int>(countSql, p);

            return (rows.Select(MapExamListItem).ToList(), total);
        }

        public async Task<ExamAttemptCountsDto> GetAttemptCountsAsync(Guid examId)
        {
            using var connection = CreateConnection();
            const string sql = @"
                SELECT status AS Status, COUNT(*) AS Cnt
                FROM dbo.exam_attempts
                WHERE exam_id = @ExamId
                GROUP BY status";
            var rows = await connection.QueryAsync<(string Status, int Cnt)>(sql, new { ExamId = examId });

            var result = new ExamAttemptCountsDto();
            foreach (var (status, cnt) in rows)
            {
                result.Attempts += cnt;
                if (status == ExamAttemptStatus.Submitted) result.SubmittedAttempts += cnt;
                else if (status == ExamAttemptStatus.InProgress) result.InProgressAttempts += cnt;
            }
            return result;
        }

        public async Task<ExamListItemDto?> FindByIdAsync(Guid id)
        {
            using var connection = CreateConnection();
            var exam = await connection.QueryFirstOrDefaultAsync<Exam>(
                "SELECT * FROM dbo.exams WHERE id = @Id", new { Id = id });
            if (exam is null) return null;

            const string sheetSql = @"
                SELECT qs.id AS Id, qs.sheet_name AS Title, COUNT(q.id) AS TotalQuestions
                FROM dbo.question_sheets qs
                LEFT JOIN dbo.questions q ON q.sheet_id = qs.id
                WHERE qs.id = @SheetId
                GROUP BY qs.id, qs.sheet_name";
            var sheet = await connection.QueryFirstOrDefaultAsync<QuestionSheetSummaryDto>(
                sheetSql, new { SheetId = exam.QuestionSheetId });

            return new ExamListItemDto
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
                AccessPlans = ParseAccessPlans(exam.AccessPlans),
                CreatedBy = exam.CreatedBy,
                CreatedAt = exam.CreatedAt,
                UpdatedAt = exam.UpdatedAt,
                QuestionSheet = sheet,
            };
        }

        public async Task<Exam> CreateAsync(Exam exam)
        {
            using var connection = CreateConnection();
            const string sql = @"
                INSERT INTO dbo.exams
                    (id, exam_code, title, description, start_date_time, end_date_time, total_marks,
                     pass_marks, duration_minutes, negative_marking, negative_marking_value,
                     question_sheet_id, course_id, access_plans, created_by)
                OUTPUT INSERTED.*
                VALUES
                    (NEWID(), @ExamCode, @Title, @Description, @StartDateTime, @EndDateTime, @TotalMarks,
                     @PassMarks, @DurationMinutes, @NegativeMarking, @NegativeMarkingValue,
                     @QuestionSheetId, @CourseId, @AccessPlans, @CreatedBy)";
            return await connection.QuerySingleAsync<Exam>(sql, exam);
        }

        // Partial update -- see the UpdateExamRequestDto comment about the
        // omitted-vs-explicitly-null limitation for CourseId. Every other
        // field only updates when provided (non-null).
        public async Task<Exam?> UpdateAsync(Guid id, UpdateExamRequestDto data, decimal? totalMarksOverride = null)
        {
            var sets = new List<string> { "updated_at = SYSDATETIMEOFFSET()" };
            var p = new DynamicParameters();
            p.Add("Id", id);

            if (data.Title is not null) { sets.Add("title = @Title"); p.Add("Title", data.Title); }
            if (data.Description is not null) { sets.Add("description = @Description"); p.Add("Description", data.Description); }
            if (data.StartDateTime.HasValue) { sets.Add("start_date_time = @StartDateTime"); p.Add("StartDateTime", data.StartDateTime.Value); }
            if (data.EndDateTime.HasValue) { sets.Add("end_date_time = @EndDateTime"); p.Add("EndDateTime", data.EndDateTime.Value); }
            if (data.PassMarks.HasValue) { sets.Add("pass_marks = @PassMarks"); p.Add("PassMarks", data.PassMarks.Value); }
            if (data.DurationMinutes.HasValue) { sets.Add("duration_minutes = @DurationMinutes"); p.Add("DurationMinutes", data.DurationMinutes.Value); }
            if (data.NegativeMarking.HasValue) { sets.Add("negative_marking = @NegativeMarking"); p.Add("NegativeMarking", data.NegativeMarking.Value); }
            if (data.NegativeMarkingValue.HasValue) { sets.Add("negative_marking_value = @NegativeMarkingValue"); p.Add("NegativeMarkingValue", data.NegativeMarkingValue.Value); }
            if (data.QuestionSheetId.HasValue) { sets.Add("question_sheet_id = @QuestionSheetId"); p.Add("QuestionSheetId", data.QuestionSheetId.Value); }
            if (data.CourseId.HasValue) { sets.Add("course_id = @CourseId"); p.Add("CourseId", data.CourseId.Value); }
            if (data.AccessPlans is not null) { sets.Add("access_plans = @AccessPlans"); p.Add("AccessPlans", SerializeAccessPlans(data.AccessPlans)); }
            if (totalMarksOverride.HasValue) { sets.Add("total_marks = @TotalMarks"); p.Add("TotalMarks", totalMarksOverride.Value); }

            var sql = $"UPDATE dbo.exams SET {string.Join(", ", sets)} OUTPUT INSERTED.* WHERE id = @Id";
            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<Exam>(sql, p);
        }

        public async Task<bool> FindOptionCorrectnessAsync(Guid optionId)
        {
            using var connection = CreateConnection();
            const string sql = "SELECT is_correct FROM dbo.question_options WHERE id = @Id";
            return await connection.QueryFirstOrDefaultAsync<bool?>(sql, new { Id = optionId }) ?? false;
        }

        public async Task RemoveAsync(Guid id)
        {
            using var connection = CreateConnection();
            await connection.ExecuteAsync("DELETE FROM dbo.exams WHERE id = @Id", new { Id = id });
        }

        public async Task<decimal> SumSheetMarksAsync(Guid sheetId)
        {
            using var connection = CreateConnection();
            const string sql = "SELECT COALESCE(SUM(marks), 0) FROM dbo.questions WHERE sheet_id = @SheetId";
            return await connection.QueryFirstOrDefaultAsync<decimal>(sql, new { SheetId = sheetId });
        }

        public async Task<string?> FindStudentPlanAsync(Guid userId)
        {
            using var connection = CreateConnection();
            const string sql = "SELECT TOP 1 plan FROM dbo.student_profiles WHERE user_id = @UserId";
            return await connection.QueryFirstOrDefaultAsync<string?>(sql, new { UserId = userId });
        }

        public async Task<Guid?> FindStudentCourseIdAsync(Guid userId)
        {
            using var connection = CreateConnection();
            const string sql = "SELECT TOP 1 course_id FROM dbo.student_profiles WHERE user_id = @UserId";
            return await connection.QueryFirstOrDefaultAsync<Guid?>(sql, new { UserId = userId });
        }


        public async Task<(QuestionSheet Sheet, List<Question> Questions, List<QuestionOption> Options)?> FindSheetByIdAsync(Guid sheetId)
        {
            using var connection = CreateConnection();
            var sheet = await connection.QueryFirstOrDefaultAsync<QuestionSheet>(
                "SELECT * FROM dbo.question_sheets WHERE id = @Id", new { Id = sheetId });
            if (sheet is null) return null;

            var questions = (await connection.QueryAsync<Question>(
                "SELECT * FROM dbo.questions WHERE sheet_id = @SheetId ORDER BY sort_order", new { SheetId = sheetId })).ToList();

            var questionIds = questions.Select(q => q.Id).ToList();
            var options = questionIds.Count > 0
                ? (await connection.QueryAsync<QuestionOption>(
                    "SELECT * FROM dbo.question_options WHERE question_id IN @Ids ORDER BY sort_order", new { Ids = questionIds })).ToList()
                : new List<QuestionOption>();

            return (sheet, questions, options);
        }

        public async Task<ExamAttempt?> FindOpenAttemptAsync(Guid userId, Guid examId)
        {
            using var connection = CreateConnection();
            const string sql = @"
                SELECT TOP 1 * FROM dbo.exam_attempts
                WHERE user_id = @UserId AND exam_id = @ExamId AND status = 'in_progress'";
            return await connection.QueryFirstOrDefaultAsync<ExamAttempt>(sql, new { UserId = userId, ExamId = examId });
        }

        public async Task<ExamAttempt?> FindSubmittedAttemptAsync(Guid userId, Guid examId)
        {
            using var connection = CreateConnection();
            const string sql = @"
                SELECT TOP 1 * FROM dbo.exam_attempts
                WHERE user_id = @UserId AND exam_id = @ExamId AND status = 'submitted'";
            return await connection.QueryFirstOrDefaultAsync<ExamAttempt>(sql, new { UserId = userId, ExamId = examId });
        }

        public async Task<(ExamAttempt Attempt, List<ExamAttemptAnswer> Answers)?> FindAttemptByIdAsync(Guid id)
        {
            using var connection = CreateConnection();
            var attempt = await connection.QueryFirstOrDefaultAsync<ExamAttempt>(
                "SELECT * FROM dbo.exam_attempts WHERE id = @Id", new { Id = id });
            if (attempt is null) return null;

            var answers = (await connection.QueryAsync<ExamAttemptAnswer>(
                "SELECT * FROM dbo.exam_attempt_answers WHERE attempt_id = @Id", new { Id = id })).ToList();

            return (attempt, answers);
        }

        public async Task<ExamAttempt> CreateAttemptAsync(Guid userId, Guid examId)
        {
            using var connection = CreateConnection();
            const string sql = @"
                INSERT INTO dbo.exam_attempts (id, user_id, exam_id, status, started_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @UserId, @ExamId, 'in_progress', SYSDATETIMEOFFSET())";
            return await connection.QuerySingleAsync<ExamAttempt>(sql, new { UserId = userId, ExamId = examId });
        }

        public async Task<ExamAttemptAnswer> SaveAnswerAsync(Guid attemptId, Guid questionId, Guid? selectedOptionId, bool isCorrect)
        {
            using var connection = CreateConnection();
            var existing = await connection.QueryFirstOrDefaultAsync<ExamAttemptAnswer>(
                "SELECT * FROM dbo.exam_attempt_answers WHERE attempt_id = @AttemptId AND question_id = @QuestionId",
                new { AttemptId = attemptId, QuestionId = questionId });

            if (existing is not null)
            {
                const string updateSql = @"
                    UPDATE dbo.exam_attempt_answers
                    SET selected_option_id = @SelectedOptionId, is_correct = @IsCorrect, answered_at = SYSDATETIMEOFFSET()
                    OUTPUT INSERTED.*
                    WHERE attempt_id = @AttemptId AND question_id = @QuestionId";
                return await connection.QuerySingleAsync<ExamAttemptAnswer>(updateSql,
                    new { AttemptId = attemptId, QuestionId = questionId, SelectedOptionId = selectedOptionId, IsCorrect = isCorrect });
            }

            const string insertSql = @"
                INSERT INTO dbo.exam_attempt_answers (id, attempt_id, question_id, selected_option_id, is_correct, answered_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @AttemptId, @QuestionId, @SelectedOptionId, @IsCorrect, SYSDATETIMEOFFSET())";
            return await connection.QuerySingleAsync<ExamAttemptAnswer>(insertSql,
                new { AttemptId = attemptId, QuestionId = questionId, SelectedOptionId = selectedOptionId, IsCorrect = isCorrect });
        }

        public async Task<ExamAttemptAnswer> FlagQuestionAsync(Guid attemptId, Guid questionId, bool isFlagged)
        {
            using var connection = CreateConnection();
            var existing = await connection.QueryFirstOrDefaultAsync<ExamAttemptAnswer>(
                "SELECT * FROM dbo.exam_attempt_answers WHERE attempt_id = @AttemptId AND question_id = @QuestionId",
                new { AttemptId = attemptId, QuestionId = questionId });

            if (existing is not null)
            {
                const string updateSql = @"
                    UPDATE dbo.exam_attempt_answers
                    SET is_flagged = @IsFlagged
                    OUTPUT INSERTED.*
                    WHERE attempt_id = @AttemptId AND question_id = @QuestionId";
                return await connection.QuerySingleAsync<ExamAttemptAnswer>(updateSql,
                    new { AttemptId = attemptId, QuestionId = questionId, IsFlagged = isFlagged });
            }

            const string insertSql = @"
                INSERT INTO dbo.exam_attempt_answers (id, attempt_id, question_id, selected_option_id, is_correct, is_flagged)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @AttemptId, @QuestionId, NULL, 0, @IsFlagged)";
            return await connection.QuerySingleAsync<ExamAttemptAnswer>(insertSql,
                new { AttemptId = attemptId, QuestionId = questionId, IsFlagged = isFlagged });
        }

        public async Task<ExamAttempt> SubmitAttemptAsync(Guid attemptId, SubmitAttemptResults results)
        {
            using var connection = CreateConnection();
            const string sql = @"
                UPDATE dbo.exam_attempts
                SET status = 'submitted',
                    marks_obtained = @MarksObtained,
                    total_marks = @TotalMarks,
                    correct_answers = @CorrectAnswers,
                    incorrect_answers = @IncorrectAnswers,
                    unanswered = @Unanswered,
                    percentage = @Percentage,
                    time_taken_seconds = @TimeTakenSeconds,
                    submitted_at = @SubmittedAt
                OUTPUT INSERTED.*
                WHERE id = @AttemptId";
            return await connection.QuerySingleAsync<ExamAttempt>(sql, new
            {
                AttemptId = attemptId,
                results.MarksObtained,
                results.TotalMarks,
                results.CorrectAnswers,
                results.IncorrectAnswers,
                results.Unanswered,
                results.Percentage,
                results.TimeTakenSeconds,
                results.SubmittedAt,
            });
        }

        public async Task<(List<AttemptHistoryRowDto> Data, int Total)> FindHistoryAsync(
            Guid userId, ExamHistoryFilters filters, DalPagination pagination)
        {
            var conditions = new List<string> { "ea.user_id = @UserId" };
            var p = new DynamicParameters();
            p.Add("UserId", userId);

            if (filters.ExamId.HasValue)
            {
                conditions.Add("ea.exam_id = @ExamId");
                p.Add("ExamId", filters.ExamId.Value);
            }
            if (!string.IsNullOrWhiteSpace(filters.Search))
            {
                conditions.Add("e.title LIKE @Search");
                p.Add("Search", $"%{filters.Search}%");
            }
            const string dateCol = "COALESCE(ea.submitted_at, ea.started_at)";
            var from = TryParseDate(filters.From);
            if (from.HasValue)
            {
                conditions.Add($"{dateCol} >= @From");
                p.Add("From", from.Value);
            }
            var to = TryParseDate(filters.To);
            if (to.HasValue)
            {
                // Inclusive of the whole "to" day.
                conditions.Add($"{dateCol} < @ToExclusive");
                p.Add("ToExclusive", to.Value.AddDays(1));
            }

            var whereSql = "WHERE " + string.Join(" AND ", conditions);
            p.Add("Offset", pagination.Offset);
            p.Add("Limit", pagination.Limit);

            using var connection = CreateConnection();

            var dataSql = $@"
                SELECT
                    ea.id AS Id, ea.exam_id AS ExamId, e.title AS ExamTitle, e.pass_marks AS ExamPassMarks,
                    ea.status AS Status, ea.marks_obtained AS MarksObtained, ea.total_marks AS TotalMarks,
                    ea.percentage AS Percentage, ea.correct_answers AS CorrectAnswers,
                    ea.incorrect_answers AS IncorrectAnswers, ea.unanswered AS Unanswered,
                    ea.time_taken_seconds AS TimeTakenSeconds, ea.started_at AS StartedAt, ea.submitted_at AS SubmittedAt
                FROM dbo.exam_attempts ea
                LEFT JOIN dbo.exams e ON e.id = ea.exam_id
                {whereSql}
                ORDER BY ea.started_at DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY";
            var rows = (await connection.QueryAsync<AttemptHistoryRowDto>(dataSql, p)).ToList();

            var countSql = $@"
                SELECT COUNT(*) FROM dbo.exam_attempts ea
                LEFT JOIN dbo.exams e ON e.id = ea.exam_id
                {whereSql}";
            var total = await connection.QueryFirstOrDefaultAsync<int>(countSql, p);

            return (rows, total);
        }

        public async Task<(List<ExamAttemptRowDto> Data, int Total)> FindAttemptsByExamAsync(
            Guid examId, DalPagination pagination, string? search)
        {
            var conditions = new List<string> { "ea.exam_id = @ExamId" };
            var p = new DynamicParameters();
            p.Add("ExamId", examId);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = $"%{search}%";
                conditions.Add(@"(u.first_name LIKE @Term OR u.last_name LIKE @Term OR u.email LIKE @Term
                                  OR (u.first_name + ' ' + u.last_name) LIKE @Term)");
                p.Add("Term", term);
            }

            var whereSql = "WHERE " + string.Join(" AND ", conditions);
            p.Add("Offset", pagination.Offset);
            p.Add("Limit", pagination.Limit);

            using var connection = CreateConnection();

            var dataSql = $@"
                SELECT
                    ea.id AS Id, ea.user_id AS UserId, u.first_name AS FirstName, u.last_name AS LastName, u.email AS Email,
                    ea.status AS Status, ea.marks_obtained AS MarksObtained, ea.total_marks AS TotalMarks,
                    ea.percentage AS Percentage, ea.correct_answers AS CorrectAnswers,
                    ea.incorrect_answers AS IncorrectAnswers, ea.unanswered AS Unanswered,
                    ea.time_taken_seconds AS TimeTakenSeconds, ea.started_at AS StartedAt, ea.submitted_at AS SubmittedAt
                FROM dbo.exam_attempts ea
                LEFT JOIN dbo.users u ON u.id = ea.user_id
                {whereSql}
                ORDER BY ea.submitted_at DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY";
            var rows = (await connection.QueryAsync<ExamAttemptRowDto>(dataSql, p)).ToList();

            var countSql = $@"
                SELECT COUNT(*) FROM dbo.exam_attempts ea
                LEFT JOIN dbo.users u ON u.id = ea.user_id
                {whereSql}";
            var total = await connection.QueryFirstOrDefaultAsync<int>(countSql, p);

            return (rows, total);
        }

        public async Task<AttemptDetailDto?> FindDetailedAttemptAsync(Guid attemptId)
        {
            using var connection = CreateConnection();

            Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;
            const string sql = @"
        SELECT * FROM dbo.exam_attempts WHERE id = @Id;

        SELECT * FROM dbo.exam_attempt_answers WHERE attempt_id = @Id;

        SELECT e.* 
        FROM dbo.exams e
        INNER JOIN dbo.exam_attempts ea ON ea.exam_id = e.id
        WHERE ea.id = @Id;

        SELECT q.* 
        FROM dbo.questions q
        INNER JOIN dbo.exams e ON e.question_sheet_id = q.sheet_id
        INNER JOIN dbo.exam_attempts ea ON ea.exam_id = e.id
        WHERE ea.id = @Id
        ORDER BY q.sort_order;

        SELECT o.* 
        FROM dbo.question_options o
        INNER JOIN dbo.questions q ON q.id = o.question_id
        INNER JOIN dbo.exams e ON e.question_sheet_id = q.sheet_id
        INNER JOIN dbo.exam_attempts ea ON ea.exam_id = e.id
        WHERE ea.id = @Id
        ORDER BY o.sort_order;
    ";

            using var multi = await connection.QueryMultipleAsync(sql, new { Id = attemptId });

            var attempt = await multi.ReadFirstOrDefaultAsync<ExamAttempt>();
            if (attempt is null) return null;

            var answers = (await multi.ReadAsync<ExamAttemptAnswer>()).ToList();
            var exam = await multi.ReadFirstOrDefaultAsync<Exam>();
            var questions = (await multi.ReadAsync<Question>()).ToList();
            var options = (await multi.ReadAsync<QuestionOption>()).ToList();

            // Grouping & Mapping in memory
            var optionsByQuestion = options
                .GroupBy(o => o.QuestionId)
                .ToDictionary(g => g.Key, g => g.ToList());

            var answerMap = answers
                .GroupBy(a => a.QuestionId)
                .ToDictionary(g => g.Key, g => g.First());

            var questionDtos = questions.Select(q => new AttemptDetailQuestionDto
            {
                Id = q.Id,
                QuestionText = q.QuestionText,
                Marks = q.Marks,
                SortOrder = q.SortOrder,
                Options = (optionsByQuestion.TryGetValue(q.Id, out var opts) ? opts : new List<QuestionOption>())
                    .Select(o => new AttemptDetailOptionDto
                    {
                        Id = o.Id,
                        QuestionId = o.QuestionId,
                        OptionText = o.OptionText,
                        SortOrder = o.SortOrder,
                        IsCorrect = o.IsCorrect,
                    }).ToList(),
                UserAnswer = answerMap.TryGetValue(q.Id, out var ans)
                    ? new AttemptDetailUserAnswerDto
                    {
                        SelectedOptionId = ans.SelectedOptionId,
                        IsFlagged = ans.IsFlagged,
                        IsCorrect = ans.IsCorrect,
                    }
                    : null,
            }).ToList();

            return new AttemptDetailDto
            {
                Id = attempt.Id,
                UserId = attempt.UserId,
                ExamId = attempt.ExamId,
                Status = attempt.Status,
                TotalMarks = attempt.TotalMarks,
                MarksObtained = attempt.MarksObtained,
                CorrectAnswers = attempt.CorrectAnswers,
                IncorrectAnswers = attempt.IncorrectAnswers,
                Unanswered = attempt.Unanswered,
                Percentage = attempt.Percentage,
                TimeTakenSeconds = attempt.TimeTakenSeconds,
                StartedAt = attempt.StartedAt,
                SubmittedAt = attempt.SubmittedAt,
                Exam = exam,
                Questions = questionDtos,
            };
        }

        public async Task<List<ExamAttemptAnswer>> FindAnswersByAttemptAsync(Guid attemptId)
        {
            using var connection = CreateConnection();
            return (await connection.QueryAsync<ExamAttemptAnswer>(
                "SELECT * FROM dbo.exam_attempt_answers WHERE attempt_id = @Id", new { Id = attemptId })).ToList();
        }

        public async Task<(List<AllAttemptsRowDto> Data, int Total)> FindAllAttemptsAsync(
            DalPagination pagination, AllAttemptsFilters filters)
        {
            var conditions = new List<string>();
            var p = new DynamicParameters();

            if (!string.IsNullOrWhiteSpace(filters.Search))
            {
                var term = $"%{filters.Search}%";
                conditions.Add(@"(e.title LIKE @Term OR u.first_name LIKE @Term OR u.last_name LIKE @Term
                                  OR u.email LIKE @Term OR (u.first_name + ' ' + u.last_name) LIKE @Term)");
                p.Add("Term", term);
            }
            const string dateCol = "COALESCE(ea.submitted_at, ea.started_at)";
            var from = TryParseDate(filters.From);
            if (from.HasValue)
            {
                conditions.Add($"{dateCol} >= @From");
                p.Add("From", from.Value);
            }
            var to = TryParseDate(filters.To);
            if (to.HasValue)
            {
                conditions.Add($"{dateCol} < @ToExclusive");
                p.Add("ToExclusive", to.Value.AddDays(1));
            }

            var whereSql = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";
            p.Add("Offset", pagination.Offset);
            p.Add("Limit", pagination.Limit);

            using var connection = CreateConnection();

            var dataSql = $@"
                SELECT
                    ea.id AS Id, ea.user_id AS UserId, u.first_name AS FirstName, u.last_name AS LastName, u.email AS Email,
                    ea.exam_id AS ExamId, e.title AS ExamTitle, e.pass_marks AS ExamPassMarks,
                    ea.status AS Status, ea.marks_obtained AS MarksObtained, ea.total_marks AS TotalMarks,
                    ea.percentage AS Percentage, ea.time_taken_seconds AS TimeTakenSeconds,
                    ea.started_at AS StartedAt, ea.submitted_at AS SubmittedAt
                FROM dbo.exam_attempts ea
                LEFT JOIN dbo.users u ON u.id = ea.user_id
                LEFT JOIN dbo.exams e ON e.id = ea.exam_id
                {whereSql}
                ORDER BY ea.started_at DESC
                OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY";
            var rows = (await connection.QueryAsync<AllAttemptsRowDto>(dataSql, p)).ToList();

            var countSql = $@"
                SELECT COUNT(*) FROM dbo.exam_attempts ea
                LEFT JOIN dbo.users u ON u.id = ea.user_id
                LEFT JOIN dbo.exams e ON e.id = ea.exam_id
                {whereSql}";
            var total = await connection.QueryFirstOrDefaultAsync<int>(countSql, p);

            return (rows, total);
        }
    }
}