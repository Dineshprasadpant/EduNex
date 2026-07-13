using System;
using System.Data;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;

// Uses C# 11 raw string literals ("""..."""), which need .NET 7+ / a recent
// C# language version. If your project targets an older TFM, tell me and
// I'll switch these to verbatim (@"...") strings with escaped quotes instead.
namespace EduNex.DataAccess
{
    public static class DatabaseSchema
    {
        // ===================================================================
        // Setup() -- creates all 31 tables + indexes from a fresh database.
        //
        // IMPORTANT: this does NOT bail out after checking a single table.
        // Every batch is inspected: CREATE TABLE batches are skipped if the
        // target table already exists, and CREATE INDEX statements are
        // executed one at a time and skipped individually if the index
        // already exists. That means Setup() is safe to call on every
        // startup, and if it fails partway through (e.g. table #25), the
        // next call will skip tables 1-24 (already created) and resume
        // exactly where it left off, instead of returning immediately
        // because table #1 exists.
        // ===================================================================

        public static void Setup(string connectionString)
        {
            using var connection = new SqlConnection(connectionString);
            connection.Open();

            foreach (var batch in SplitGoBatches(SchemaScript))
            {
                ExecuteSchemaBatch(connection, batch);
            }
        }

        // ===================================================================
        // Update() -- add ALTER TABLE / other future scripts to the
        // Migrations list below, in order. Each one is tracked in
        // dbo.__schema_migrations and only ever runs once, so it's safe to
        // call Update() on every startup alongside Setup().
        //
        // Example of how to add one:
        //   ("2025_08_add_users_timezone", """
        //       ALTER TABLE dbo.users ADD timezone NVARCHAR(50) NULL;
        //   """),
        // ===================================================================

        private static readonly (string Name, string Sql)[] Migrations =
        {
            // Add future migrations here, oldest first.
        };

        public static void Update(string connectionString)
        {
            using var connection = new SqlConnection(connectionString);
            connection.Open();

            EnsureMigrationsTable(connection);

            foreach (var (name, sql) in Migrations)
            {
                if (IsMigrationApplied(connection, name)) continue;

                foreach (var batch in SplitGoBatches(sql))
                {
                    ExecuteBatch(connection, batch);
                }
                MarkMigrationApplied(connection, name);
            }
        }

        // ===================================================================
        // helpers
        // ===================================================================

        private static bool TableExists(SqlConnection connection, string tableName)
        {
            using var cmd = new SqlCommand("SELECT OBJECT_ID(@FullName, 'U')", connection);
            cmd.Parameters.AddWithValue("@FullName", $"dbo.{tableName}");
            var result = cmd.ExecuteScalar();
            return result is not null && result != DBNull.Value;
        }

        private static bool IndexExists(SqlConnection connection, string tableName, string indexName)
        {
            const string sql = """
                SELECT 1
                FROM sys.indexes
                WHERE name = @IndexName
                  AND object_id = OBJECT_ID(@FullTableName)
                """;
            using var cmd = new SqlCommand(sql, connection);
            cmd.Parameters.AddWithValue("@IndexName", indexName);
            cmd.Parameters.AddWithValue("@FullTableName", $"dbo.{tableName}");
            var result = cmd.ExecuteScalar();
            return result is not null && result != DBNull.Value;
        }

        private static void EnsureMigrationsTable(SqlConnection connection)
        {
            const string sql = """
                IF OBJECT_ID('dbo.__schema_migrations', 'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.__schema_migrations (
                        name        NVARCHAR(200)  NOT NULL,
                        applied_at  DATETIMEOFFSET NOT NULL CONSTRAINT DF___schema_migrations_applied_at DEFAULT SYSDATETIMEOFFSET(),
                        CONSTRAINT PK___schema_migrations PRIMARY KEY (name)
                    );
                END
                """;
            ExecuteBatch(connection, sql);
        }

        private static bool IsMigrationApplied(SqlConnection connection, string name)
        {
            using var cmd = new SqlCommand("SELECT 1 FROM dbo.__schema_migrations WHERE name = @Name", connection);
            cmd.Parameters.AddWithValue("@Name", name);
            var result = cmd.ExecuteScalar();
            return result is not null && result != DBNull.Value;
        }

        private static void MarkMigrationApplied(SqlConnection connection, string name)
        {
            using var cmd = new SqlCommand("INSERT INTO dbo.__schema_migrations (name) VALUES (@Name)", connection);
            cmd.Parameters.AddWithValue("@Name", name);
            cmd.ExecuteNonQuery();
        }

        private static void ExecuteBatch(SqlConnection connection, string batch)
        {
            if (string.IsNullOrWhiteSpace(batch)) return;
            using var cmd = new SqlCommand(batch, connection) { CommandTimeout = 120 };
            cmd.ExecuteNonQuery();
        }

        // Matches "CREATE TABLE dbo.<name>" (optionally bracketed) at the
        // start of a batch produced by the schema script.
        private static readonly Regex CreateTableRegex =
            new(@"CREATE\s+TABLE\s+dbo\.\[?(?<name>\w+)\]?", RegexOptions.IgnoreCase);

        // Matches individual "CREATE INDEX <idx> ON dbo.<table>(...)"
        // statements so a multi-statement index batch can be executed and
        // skipped one statement at a time.
        private static readonly Regex CreateIndexRegex =
            new(@"CREATE\s+INDEX\s+\[?(?<idx>\w+)\]?\s+ON\s+dbo\.\[?(?<table>\w+)\]?",
                RegexOptions.IgnoreCase);

        // Dispatches a single GO-delimited batch from SchemaScript:
        //  - a CREATE TABLE batch is skipped if the table already exists
        //  - a batch made up of one or more CREATE INDEX statements is
        //    split so each index is created/skipped independently
        //  - anything else (SET options, etc.) just runs
        private static void ExecuteSchemaBatch(SqlConnection connection, string batch)
        {
            if (string.IsNullOrWhiteSpace(batch)) return;

            var tableMatch = CreateTableRegex.Match(batch);
            if (tableMatch.Success)
            {
                var tableName = tableMatch.Groups["name"].Value;
                if (TableExists(connection, tableName)) return; // already created
                ExecuteBatch(connection, batch);
                return;
            }

            var indexMatches = CreateIndexRegex.Matches(batch);
            if (indexMatches.Count > 0)
            {
                foreach (var statement in SplitStatements(batch))
                {
                    var m = CreateIndexRegex.Match(statement);
                    if (!m.Success)
                    {
                        ExecuteBatch(connection, statement);
                        continue;
                    }

                    var indexName = m.Groups["idx"].Value;
                    var tableName = m.Groups["table"].Value;
                    if (IndexExists(connection, tableName, indexName)) continue; // already created
                    ExecuteBatch(connection, statement);
                }
                return;
            }

            // SET ANSI_NULLS / SET QUOTED_IDENTIFIER / anything not covered above
            ExecuteBatch(connection, batch);
        }

        // Splits a batch into individual top-level statements on ';', which
        // is safe here because the index-creation batch contains only flat
        // "CREATE INDEX ... ON dbo.table(cols);" statements with no nested
        // semicolons.
        private static string[] SplitStatements(string batch) =>
            batch.Split(';')
                .Select(s => s.Trim())
                .Where(s => s.Length > 0)
                .Select(s => s + ";")
                .ToArray();

        // SQL Server's "GO" is a batch separator understood by sqlcmd/SSMS,
        // not valid T-SQL -- ADO.NET/Dapper will throw on it if sent as part
        // of a single command. Split on a line containing only "GO" (any
        // casing, optional surrounding whitespace) before executing.
        private static readonly Regex GoSeparator = new(@"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase);

        private static string[] SplitGoBatches(string script) =>
            GoSeparator.Split(script)
                .Select(b => b.Trim())
                .Where(b => b.Length > 0)
                .ToArray();

        // ===================================================================
        // schema script -- ported verbatim from dragon_institute_sqlexpress.sql
        // ===================================================================

        private const string SchemaScript = """
            SET ANSI_NULLS ON;
            SET QUOTED_IDENTIFIER ON;
            GO

            CREATE TABLE dbo.users (
                id                     UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_users_id DEFAULT NEWID(),
                first_name             NVARCHAR(100)    NOT NULL,
                last_name              NVARCHAR(100)    NOT NULL,
                email                  NVARCHAR(255)    NOT NULL,
                phone                  NVARCHAR(30)     NOT NULL,
                password_hash          NVARCHAR(255)    NOT NULL,
                role                   NVARCHAR(20)     NOT NULL CONSTRAINT DF_users_role DEFAULT 'student',
                image                  NVARCHAR(MAX)    NULL,
                is_verified            BIT              NOT NULL CONSTRAINT DF_users_is_verified DEFAULT 0,
                is_blocked             BIT              NOT NULL CONSTRAINT DF_users_is_blocked DEFAULT 0,
                login_locked           BIT              NOT NULL CONSTRAINT DF_users_login_locked DEFAULT 0,
                failed_login_attempts  INT              NOT NULL CONSTRAINT DF_users_failed_login DEFAULT 0,
                last_login_at          DATETIMEOFFSET   NULL,
                created_at             DATETIMEOFFSET   NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSDATETIMEOFFSET(),
                updated_at             DATETIMEOFFSET   NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_users PRIMARY KEY (id),
                CONSTRAINT UQ_users_email UNIQUE (email),
                CONSTRAINT UQ_users_phone UNIQUE (phone),
                CONSTRAINT CK_users_role CHECK (role IN ('student','teacher','admin'))
            );
            GO

            CREATE TABLE dbo.media (
                id             UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_media_id DEFAULT NEWID(),
                filename       NVARCHAR(255)    NOT NULL,
                original_name  NVARCHAR(255)    NOT NULL,
                mime_type      NVARCHAR(100)    NOT NULL,
                size           INT              NOT NULL,
                url            NVARCHAR(MAX)    NOT NULL,
                s3_key         NVARCHAR(MAX)    NULL,
                uploaded_by    UNIQUEIDENTIFIER NULL,
                created_at     DATETIMEOFFSET   NOT NULL CONSTRAINT DF_media_created_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_media PRIMARY KEY (id),
                CONSTRAINT FK_media_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES dbo.users(id) ON DELETE SET NULL
            );
            GO

            CREATE TABLE dbo.categories (
                id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_categories_id DEFAULT NEWID(),
                name         NVARCHAR(120)    NOT NULL,
                slug         NVARCHAR(140)    NOT NULL,
                description  NVARCHAR(MAX)    NULL,
                created_at   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_categories_created_at DEFAULT SYSDATETIMEOFFSET(),
                updated_at   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_categories_updated_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_categories PRIMARY KEY (id),
                CONSTRAINT UQ_categories_name UNIQUE (name),
                CONSTRAINT UQ_categories_slug UNIQUE (slug)
            );
            GO

            CREATE TABLE dbo.courses (
                id             UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_courses_id DEFAULT NEWID(),
                slug           NVARCHAR(160)    NOT NULL,
                title          NVARCHAR(200)    NOT NULL,
                overview       NVARCHAR(MAX)    NOT NULL,
                price          DECIMAL(10,2)    NULL,
                discount       INT              NOT NULL CONSTRAINT DF_courses_discount DEFAULT 0,
                duration_days  INT              NOT NULL,
                course_type    NVARCHAR(20)     NOT NULL CONSTRAINT DF_courses_course_type DEFAULT 'offline',
                description    NVARCHAR(MAX)    NOT NULL,
                information    NVARCHAR(MAX)    NULL,
                category_id    UNIQUEIDENTIFIER NULL,
                image          NVARCHAR(MAX)    NULL,
                media_id       UNIQUEIDENTIFIER NULL,
                is_trending    BIT              NOT NULL CONSTRAINT DF_courses_is_trending DEFAULT 0,
                is_active      BIT              NOT NULL CONSTRAINT DF_courses_is_active DEFAULT 1,
                views          INT              NOT NULL CONSTRAINT DF_courses_views DEFAULT 0,
                free_features  NVARCHAR(MAX)    NULL,
                half_features  NVARCHAR(MAX)    NULL,
                paid_features  NVARCHAR(MAX)    NULL,
                created_at     DATETIMEOFFSET   NOT NULL CONSTRAINT DF_courses_created_at DEFAULT SYSDATETIMEOFFSET(),
                updated_at     DATETIMEOFFSET   NOT NULL CONSTRAINT DF_courses_updated_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_courses PRIMARY KEY (id),
                CONSTRAINT UQ_courses_slug UNIQUE (slug),
                CONSTRAINT UQ_courses_title UNIQUE (title),
                CONSTRAINT FK_courses_category FOREIGN KEY (category_id) REFERENCES dbo.categories(id) ON DELETE SET NULL,
                CONSTRAINT FK_courses_media FOREIGN KEY (media_id) REFERENCES dbo.media(id) ON DELETE SET NULL,
                CONSTRAINT CK_courses_course_type CHECK (course_type IN ('offline','online','hybrid'))
            );
            GO

            CREATE TABLE dbo.teacher_profiles (
                id                        UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_teacher_profiles_id DEFAULT NEWID(),
                user_id                   UNIQUEIDENTIFIER NOT NULL,
                bio                       NVARCHAR(MAX)    NULL,
                specialization            NVARCHAR(200)    NULL,
                enable_display_in_about   BIT              NOT NULL CONSTRAINT DF_teacher_profiles_display DEFAULT 0,
                created_at                DATETIMEOFFSET   NOT NULL CONSTRAINT DF_teacher_profiles_created_at DEFAULT SYSDATETIMEOFFSET(),
                updated_at                DATETIMEOFFSET   NOT NULL CONSTRAINT DF_teacher_profiles_updated_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_teacher_profiles PRIMARY KEY (id),
                CONSTRAINT UQ_teacher_profiles_user_id UNIQUE (user_id),
                CONSTRAINT FK_teacher_profiles_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
            );
            GO

            CREATE TABLE dbo.student_profiles (
                id                       UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_student_profiles_id DEFAULT NEWID(),
                user_id                  UNIQUEIDENTIFIER NOT NULL,
                [plan]                   NVARCHAR(20)     NOT NULL CONSTRAINT DF_student_profiles_plan DEFAULT 'free',
                course_id                UNIQUEIDENTIFIER NULL,
                payment_image            NVARCHAR(MAX)    NULL,
                citizenship_certificate  NVARCHAR(MAX)    NULL,
                initial_verification     BIT              NOT NULL CONSTRAINT DF_student_profiles_verif DEFAULT 0,
                created_at               DATETIMEOFFSET   NOT NULL CONSTRAINT DF_student_profiles_created_at DEFAULT SYSDATETIMEOFFSET(),
                updated_at               DATETIMEOFFSET   NOT NULL CONSTRAINT DF_student_profiles_updated_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_student_profiles PRIMARY KEY (id),
                CONSTRAINT UQ_student_profiles_user_id UNIQUE (user_id),
                CONSTRAINT FK_student_profiles_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
                CONSTRAINT FK_student_profiles_course FOREIGN KEY (course_id) REFERENCES dbo.courses(id),
                CONSTRAINT CK_student_profiles_plan CHECK ([plan] IN ('free','half','full'))
            );
            GO

            CREATE TABLE dbo.teacher_courses (
                id                   UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_teacher_courses_id DEFAULT NEWID(),
                teacher_profile_id   UNIQUEIDENTIFIER NOT NULL,
                course_id            UNIQUEIDENTIFIER NOT NULL,
                assigned_at          DATETIMEOFFSET   NOT NULL CONSTRAINT DF_teacher_courses_assigned_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_teacher_courses PRIMARY KEY (id),
                CONSTRAINT UQ_teacher_courses_profile_course UNIQUE (teacher_profile_id, course_id),
                CONSTRAINT FK_teacher_courses_profile FOREIGN KEY (teacher_profile_id) REFERENCES dbo.teacher_profiles(id) ON DELETE CASCADE,
                CONSTRAINT FK_teacher_courses_course FOREIGN KEY (course_id) REFERENCES dbo.courses(id) ON DELETE CASCADE
            );
            GO

            CREATE TABLE dbo.question_sheets (
                id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_question_sheets_id DEFAULT NEWID(),
                sheet_name   NVARCHAR(200)    NOT NULL,
                created_by   UNIQUEIDENTIFIER NULL,
                created_at   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_question_sheets_created_at DEFAULT SYSDATETIMEOFFSET(),
                updated_at   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_question_sheets_updated_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_question_sheets PRIMARY KEY (id)
            );
            GO

            CREATE TABLE dbo.questions (
                id             UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_questions_id DEFAULT NEWID(),
                sheet_id       UNIQUEIDENTIFIER NOT NULL,
                question_text  NVARCHAR(MAX)    NOT NULL,
                marks          DECIMAL(5,2)     NOT NULL CONSTRAINT DF_questions_marks DEFAULT 1,
                sort_order     INT              NOT NULL CONSTRAINT DF_questions_sort_order DEFAULT 0,
                created_at     DATETIMEOFFSET   NOT NULL CONSTRAINT DF_questions_created_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_questions PRIMARY KEY (id),
                CONSTRAINT FK_questions_sheet FOREIGN KEY (sheet_id) REFERENCES dbo.question_sheets(id) ON DELETE CASCADE
            );
            GO

            CREATE TABLE dbo.question_options (
                id            UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_question_options_id DEFAULT NEWID(),
                question_id   UNIQUEIDENTIFIER NOT NULL,
                option_text   NVARCHAR(MAX)    NOT NULL,
                is_correct    BIT              NOT NULL CONSTRAINT DF_question_options_is_correct DEFAULT 0,
                sort_order    INT              NOT NULL CONSTRAINT DF_question_options_sort_order DEFAULT 0,
                CONSTRAINT PK_question_options PRIMARY KEY (id),
                CONSTRAINT FK_question_options_question FOREIGN KEY (question_id) REFERENCES dbo.questions(id) ON DELETE CASCADE
            );
            GO

            CREATE TABLE dbo.exams (
                id                       UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_exams_id DEFAULT NEWID(),
                exam_code                NVARCHAR(50)     NOT NULL,
                title                    NVARCHAR(200)    NOT NULL,
                description              NVARCHAR(MAX)    NULL,
                start_date_time          DATETIMEOFFSET   NOT NULL,
                end_date_time            DATETIMEOFFSET   NOT NULL,
                total_marks              DECIMAL(8,2)     NOT NULL,
                pass_marks               DECIMAL(8,2)     NULL,
                duration_minutes         INT              NOT NULL,
                negative_marking         BIT              NOT NULL CONSTRAINT DF_exams_negative_marking DEFAULT 0,
                negative_marking_value   DECIMAL(5,2)     NULL,
                question_sheet_id        UNIQUEIDENTIFIER NOT NULL,
                course_id                UNIQUEIDENTIFIER NULL,
                access_plans             NVARCHAR(MAX)    NOT NULL CONSTRAINT DF_exams_access_plans DEFAULT '["free","half","paid"]',
                created_by               UNIQUEIDENTIFIER NULL,
                created_at               DATETIMEOFFSET   NOT NULL CONSTRAINT DF_exams_created_at DEFAULT SYSDATETIMEOFFSET(),
                updated_at               DATETIMEOFFSET   NOT NULL CONSTRAINT DF_exams_updated_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_exams PRIMARY KEY (id),
                CONSTRAINT UQ_exams_exam_code UNIQUE (exam_code),
                CONSTRAINT FK_exams_question_sheet FOREIGN KEY (question_sheet_id) REFERENCES dbo.question_sheets(id),
                CONSTRAINT FK_exams_course FOREIGN KEY (course_id) REFERENCES dbo.courses(id) ON DELETE SET NULL
            );
            GO

            CREATE TABLE dbo.exam_attempts (
                id                   UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_exam_attempts_id DEFAULT NEWID(),
                user_id              UNIQUEIDENTIFIER NOT NULL,
                exam_id              UNIQUEIDENTIFIER NOT NULL,
                started_at           DATETIMEOFFSET   NOT NULL CONSTRAINT DF_exam_attempts_started_at DEFAULT SYSDATETIMEOFFSET(),
                submitted_at         DATETIMEOFFSET   NULL,
                status               NVARCHAR(20)     NOT NULL CONSTRAINT DF_exam_attempts_status DEFAULT 'in_progress',
                total_marks          DECIMAL(8,2)     NULL,
                marks_obtained       DECIMAL(8,2)     NULL,
                correct_answers      INT              NULL,
                incorrect_answers    INT              NULL,
                unanswered           INT              NULL,
                percentage           DECIMAL(5,2)     NULL,
                time_taken_seconds   INT              NULL,
                CONSTRAINT PK_exam_attempts PRIMARY KEY (id),
                CONSTRAINT UQ_exam_attempts_user_exam UNIQUE (user_id, exam_id),
                CONSTRAINT FK_exam_attempts_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
                CONSTRAINT FK_exam_attempts_exam FOREIGN KEY (exam_id) REFERENCES dbo.exams(id) ON DELETE CASCADE,
                CONSTRAINT CK_exam_attempts_status CHECK (status IN ('in_progress','submitted','timed_out'))
            );
            GO

            CREATE TABLE dbo.exam_attempt_answers (
                id                   UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_exam_attempt_answers_id DEFAULT NEWID(),
                attempt_id           UNIQUEIDENTIFIER NOT NULL,
                question_id          UNIQUEIDENTIFIER NOT NULL,
                selected_option_id   UNIQUEIDENTIFIER NULL,
                is_correct           BIT              NULL,
                is_flagged           BIT              NOT NULL CONSTRAINT DF_exam_attempt_answers_flagged DEFAULT 0,
                answered_at          DATETIMEOFFSET   NULL,
                CONSTRAINT PK_exam_attempt_answers PRIMARY KEY (id),
                CONSTRAINT FK_exam_attempt_answers_attempt FOREIGN KEY (attempt_id) REFERENCES dbo.exam_attempts(id) ON DELETE CASCADE,
                CONSTRAINT FK_exam_attempt_answers_question FOREIGN KEY (question_id) REFERENCES dbo.questions(id),
                CONSTRAINT FK_exam_attempt_answers_option FOREIGN KEY (selected_option_id) REFERENCES dbo.question_options(id)
            );
            GO

            CREATE TABLE dbo.announcements (
                id            UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_announcements_id DEFAULT NEWID(),
                title         NVARCHAR(300)    NOT NULL,
                image         NVARCHAR(MAX)    NULL,
                media_id      UNIQUEIDENTIFIER NULL,
                description   NVARCHAR(MAX)    NOT NULL CONSTRAINT DF_announcements_description DEFAULT '',
                privacy       NVARCHAR(20)     NOT NULL CONSTRAINT DF_announcements_privacy DEFAULT 'public',
                course_id     UNIQUEIDENTIFIER NULL,
                created_at    DATETIMEOFFSET   NOT NULL CONSTRAINT DF_announcements_created_at DEFAULT SYSDATETIMEOFFSET(),
                updated_at    DATETIMEOFFSET   NOT NULL CONSTRAINT DF_announcements_updated_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_announcements PRIMARY KEY (id),
                CONSTRAINT FK_announcements_course FOREIGN KEY (course_id) REFERENCES dbo.courses(id) ON DELETE SET NULL,
                CONSTRAINT FK_announcements_media FOREIGN KEY (media_id) REFERENCES dbo.media(id) ON DELETE SET NULL
            );
            GO

            CREATE TABLE dbo.announcement_resources (
                id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_announcement_resources_id DEFAULT NEWID(),
                announcement_id   UNIQUEIDENTIFIER NOT NULL,
                media_id          UNIQUEIDENTIFIER NOT NULL,
                CONSTRAINT PK_announcement_resources PRIMARY KEY (id),
                CONSTRAINT FK_announcement_resources_announcement FOREIGN KEY (announcement_id) REFERENCES dbo.announcements(id) ON DELETE CASCADE,
                CONSTRAINT FK_announcement_resources_media FOREIGN KEY (media_id) REFERENCES dbo.media(id) ON DELETE CASCADE
            );
            GO

            CREATE TABLE dbo.events (
                id            UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_events_id DEFAULT NEWID(),
                title         NVARCHAR(300)    NOT NULL,
                description   NVARCHAR(MAX)    NOT NULL CONSTRAINT DF_events_description DEFAULT '',
                category      NVARCHAR(100)    NOT NULL CONSTRAINT DF_events_category DEFAULT 'Other',
                event_date    DATETIMEOFFSET   NOT NULL,
                address       NVARCHAR(MAX)    NULL,
                privacy       NVARCHAR(20)     NOT NULL CONSTRAINT DF_events_privacy DEFAULT 'public',
                course_id     UNIQUEIDENTIFIER NULL,
                image         NVARCHAR(MAX)    NULL,
                media_id      UNIQUEIDENTIFIER NULL,
                created_at    DATETIMEOFFSET   NOT NULL CONSTRAINT DF_events_created_at DEFAULT SYSDATETIMEOFFSET(),
                updated_at    DATETIMEOFFSET   NOT NULL CONSTRAINT DF_events_updated_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_events PRIMARY KEY (id),
                CONSTRAINT FK_events_course FOREIGN KEY (course_id) REFERENCES dbo.courses(id) ON DELETE SET NULL,
                CONSTRAINT FK_events_media FOREIGN KEY (media_id) REFERENCES dbo.media(id) ON DELETE SET NULL
            );
            GO

            CREATE TABLE dbo.event_resources (
                id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_event_resources_id DEFAULT NEWID(),
                event_id    UNIQUEIDENTIFIER NOT NULL,
                media_id    UNIQUEIDENTIFIER NOT NULL,
                CONSTRAINT PK_event_resources PRIMARY KEY (id),
                CONSTRAINT FK_event_resources_event FOREIGN KEY (event_id) REFERENCES dbo.events(id) ON DELETE CASCADE,
                CONSTRAINT FK_event_resources_media FOREIGN KEY (media_id) REFERENCES dbo.media(id) ON DELETE CASCADE
            );
            GO

            CREATE TABLE dbo.class_materials (
                id            UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_class_materials_id DEFAULT NEWID(),
                title         NVARCHAR(200)    NOT NULL,
                description   NVARCHAR(MAX)    NULL,
                file_url      NVARCHAR(MAX)    NULL,
                media_id      UNIQUEIDENTIFIER NULL,
                course_id     UNIQUEIDENTIFIER NULL,
                created_by    UNIQUEIDENTIFIER NULL,
                created_at    DATETIMEOFFSET   NOT NULL CONSTRAINT DF_class_materials_created_at DEFAULT SYSDATETIMEOFFSET(),
                updated_at    DATETIMEOFFSET   NOT NULL CONSTRAINT DF_class_materials_updated_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_class_materials PRIMARY KEY (id),
                CONSTRAINT FK_class_materials_course FOREIGN KEY (course_id) REFERENCES dbo.courses(id) ON DELETE SET NULL,
                CONSTRAINT FK_class_materials_media FOREIGN KEY (media_id) REFERENCES dbo.media(id) ON DELETE SET NULL
            );
            GO

            CREATE TABLE dbo.gallery_items (
                id                    UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_gallery_items_id DEFAULT NEWID(),
                title                 NVARCHAR(200)    NOT NULL,
                description           NVARCHAR(MAX)    NULL,
                media_type            NVARCHAR(20)     NOT NULL CONSTRAINT DF_gallery_items_media_type DEFAULT 'image',
                media_url             NVARCHAR(MAX)    NOT NULL,
                media_id              UNIQUEIDENTIFIER NULL,
                thumbnail_url         NVARCHAR(MAX)    NULL,
                thumbnail_media_id    UNIQUEIDENTIFIER NULL,
                [position]            INT              NOT NULL CONSTRAINT DF_gallery_items_position DEFAULT 0,
                is_active             BIT              NOT NULL CONSTRAINT DF_gallery_items_is_active DEFAULT 1,
                created_at            DATETIMEOFFSET   NOT NULL CONSTRAINT DF_gallery_items_created_at DEFAULT SYSDATETIMEOFFSET(),
                updated_at            DATETIMEOFFSET   NOT NULL CONSTRAINT DF_gallery_items_updated_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_gallery_items PRIMARY KEY (id),
                CONSTRAINT FK_gallery_items_media FOREIGN KEY (media_id) REFERENCES dbo.media(id) ON DELETE SET NULL,
                CONSTRAINT FK_gallery_items_thumbnail_media FOREIGN KEY (thumbnail_media_id) REFERENCES dbo.media(id),
                CONSTRAINT CK_gallery_items_media_type CHECK (media_type IN ('image','video'))
            );
            GO

            CREATE TABLE dbo.advertisements (
                id             UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_advertisements_id DEFAULT NEWID(),
                title          NVARCHAR(200)    NOT NULL,
                description    NVARCHAR(MAX)    NULL,
                image_url      NVARCHAR(MAX)    NULL,
                media_id       UNIQUEIDENTIFIER NULL,
                link_url       NVARCHAR(MAX)    NULL,
                button_text    NVARCHAR(100)    NULL,
                redirect_url   NVARCHAR(MAX)    NULL,
                privacy        NVARCHAR(20)     NOT NULL CONSTRAINT DF_advertisements_privacy DEFAULT 'all',
                is_active      BIT              NOT NULL CONSTRAINT DF_advertisements_is_active DEFAULT 1,
                created_at     DATETIMEOFFSET   NOT NULL CONSTRAINT DF_advertisements_created_at DEFAULT SYSDATETIMEOFFSET(),
                updated_at     DATETIMEOFFSET   NOT NULL CONSTRAINT DF_advertisements_updated_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_advertisements PRIMARY KEY (id),
                CONSTRAINT FK_advertisements_media FOREIGN KEY (media_id) REFERENCES dbo.media(id) ON DELETE SET NULL
            );
            GO

            CREATE TABLE dbo.site_content (
                id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_site_content_id DEFAULT NEWID(),
                [key]        NVARCHAR(100)    NOT NULL,
                data         NVARCHAR(MAX)    NOT NULL,
                created_at   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_site_content_created_at DEFAULT SYSDATETIMEOFFSET(),
                updated_at   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_site_content_updated_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_site_content PRIMARY KEY (id),
                CONSTRAINT UQ_site_content_key UNIQUE ([key])
            );
            GO

            CREATE TABLE dbo.subscribers (
                id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_subscribers_id DEFAULT NEWID(),
                email        NVARCHAR(255)    NOT NULL,
                created_at   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_subscribers_created_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_subscribers PRIMARY KEY (id),
                CONSTRAINT UQ_subscribers_email UNIQUE (email)
            );
            GO

            CREATE TABLE dbo.contact_messages (
                id            UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_contact_messages_id DEFAULT NEWID(),
                name          NVARCHAR(200)    NOT NULL,
                email         NVARCHAR(255)    NOT NULL,
                phone         NVARCHAR(40)     NULL,
                subject       NVARCHAR(300)    NOT NULL,
                message       NVARCHAR(MAX)    NOT NULL,
                status        NVARCHAR(20)     NOT NULL CONSTRAINT DF_contact_messages_status DEFAULT 'pending',
                admin_reply   NVARCHAR(MAX)    NULL,
                replied_at    DATETIMEOFFSET   NULL,
                created_at    DATETIMEOFFSET   NOT NULL CONSTRAINT DF_contact_messages_created_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_contact_messages PRIMARY KEY (id)
            );
            GO

            CREATE TABLE dbo.feedback (
                id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_feedback_id DEFAULT NEWID(),
                name            NVARCHAR(200)    NOT NULL,
                email           NVARCHAR(255)    NOT NULL,
                rating          SMALLINT         NOT NULL,
                feedback_text   NVARCHAR(MAX)    NOT NULL,
                admin_reply     NVARCHAR(MAX)    NULL,
                replied_at      DATETIMEOFFSET   NULL,
                created_at      DATETIMEOFFSET   NOT NULL CONSTRAINT DF_feedback_created_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_feedback PRIMARY KEY (id)
            );
            GO

            CREATE TABLE dbo.refresh_tokens (
                id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_refresh_tokens_id DEFAULT NEWID(),
                user_id      UNIQUEIDENTIFIER NOT NULL,
                token        NVARCHAR(500)    NOT NULL,
                expires_at   DATETIMEOFFSET   NOT NULL,
                is_revoked   BIT              NOT NULL CONSTRAINT DF_refresh_tokens_is_revoked DEFAULT 0,
                created_at   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_refresh_tokens_created_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_refresh_tokens PRIMARY KEY (id),
                CONSTRAINT UQ_refresh_tokens_token UNIQUE (token),
                CONSTRAINT FK_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
            );
            GO

            CREATE TABLE dbo.active_sessions (
                id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_active_sessions_id DEFAULT NEWID(),
                user_id         UNIQUEIDENTIFIER NULL,
                session_token   NVARCHAR(255)    NOT NULL,
                page_path       NVARCHAR(500)    NULL,
                last_seen       DATETIMEOFFSET   NOT NULL CONSTRAINT DF_active_sessions_last_seen DEFAULT SYSDATETIMEOFFSET(),
                ip_address      NVARCHAR(45)     NULL,
                user_agent      NVARCHAR(MAX)    NULL,
                CONSTRAINT PK_active_sessions PRIMARY KEY (id),
                CONSTRAINT FK_active_sessions_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
            );
            GO

            CREATE TABLE dbo.user_payments (
                id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_user_payments_id DEFAULT NEWID(),
                user_id             UNIQUEIDENTIFIER NOT NULL,
                payment_image_url   NVARCHAR(MAX)    NOT NULL,
                amount              NVARCHAR(50)     NULL,
                note                NVARCHAR(MAX)    NULL,
                created_at          DATETIMEOFFSET   NOT NULL CONSTRAINT DF_user_payments_created_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_user_payments PRIMARY KEY (id),
                CONSTRAINT FK_user_payments_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
            );
            GO

            CREATE TABLE dbo.analytics_daily (
                id                   UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_analytics_daily_id DEFAULT NEWID(),
                [date]               DATE             NOT NULL,
                total_visitors       INT              NOT NULL CONSTRAINT DF_analytics_daily_visitors DEFAULT 0,
                total_page_views     INT              NOT NULL CONSTRAINT DF_analytics_daily_page_views DEFAULT 0,
                new_registrations    INT              NOT NULL CONSTRAINT DF_analytics_daily_registrations DEFAULT 0,
                plan_free            INT              NOT NULL CONSTRAINT DF_analytics_daily_plan_free DEFAULT 0,
                plan_half            INT              NOT NULL CONSTRAINT DF_analytics_daily_plan_half DEFAULT 0,
                plan_full            INT              NOT NULL CONSTRAINT DF_analytics_daily_plan_full DEFAULT 0,
                subscribers_gained   INT              NOT NULL CONSTRAINT DF_analytics_daily_subs_gained DEFAULT 0,
                created_at           DATETIMEOFFSET   NOT NULL CONSTRAINT DF_analytics_daily_created_at DEFAULT SYSDATETIMEOFFSET(),
                CONSTRAINT PK_analytics_daily PRIMARY KEY (id),
                CONSTRAINT UQ_analytics_daily_date UNIQUE ([date])
            );
            GO

            CREATE TABLE dbo.analytics_utm_sources (
                id       UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_analytics_utm_sources_id DEFAULT NEWID(),
                [date]   DATE             NOT NULL,
                source   NVARCHAR(100)    NOT NULL,
                visits   INT              NOT NULL CONSTRAINT DF_analytics_utm_sources_visits DEFAULT 0,
                CONSTRAINT PK_analytics_utm_sources PRIMARY KEY (id),
                CONSTRAINT FK_analytics_utm_sources_date FOREIGN KEY ([date]) REFERENCES dbo.analytics_daily([date]) ON DELETE CASCADE
            );
            GO

            CREATE TABLE dbo.analytics_page_views (
                session_token   NVARCHAR(255) NOT NULL,
                page_path       NVARCHAR(500) NOT NULL,
                [date]          DATE          NOT NULL,
                CONSTRAINT PK_analytics_page_views PRIMARY KEY (session_token, page_path, [date])
            );
            GO

            CREATE TABLE dbo.analytics_visitor_sessions (
                session_token   NVARCHAR(255) NOT NULL,
                [date]          DATE          NOT NULL,
                CONSTRAINT PK_analytics_visitor_sessions PRIMARY KEY (session_token, [date])
            );
            GO

            CREATE INDEX IX_media_uploaded_by ON dbo.media(uploaded_by);
            CREATE INDEX IX_courses_category_id ON dbo.courses(category_id);
            CREATE INDEX IX_courses_media_id ON dbo.courses(media_id);
            CREATE INDEX IX_student_profiles_course_id ON dbo.student_profiles(course_id);
            CREATE INDEX IX_teacher_courses_course_id ON dbo.teacher_courses(course_id);
            CREATE INDEX IX_questions_sheet_id ON dbo.questions(sheet_id);
            CREATE INDEX IX_question_options_question_id ON dbo.question_options(question_id);
            CREATE INDEX IX_exams_question_sheet_id ON dbo.exams(question_sheet_id);
            CREATE INDEX IX_exams_course_id ON dbo.exams(course_id);
            CREATE INDEX IX_exam_attempts_exam_id ON dbo.exam_attempts(exam_id);
            CREATE INDEX IX_exam_attempt_answers_attempt_id ON dbo.exam_attempt_answers(attempt_id);
            CREATE INDEX IX_exam_attempt_answers_question_id ON dbo.exam_attempt_answers(question_id);
            CREATE INDEX IX_announcements_course_id ON dbo.announcements(course_id);
            CREATE INDEX IX_announcements_media_id ON dbo.announcements(media_id);
            CREATE INDEX IX_events_course_id ON dbo.events(course_id);
            CREATE INDEX IX_events_media_id ON dbo.events(media_id);
            CREATE INDEX IX_class_materials_course_id ON dbo.class_materials(course_id);
            CREATE INDEX IX_class_materials_media_id ON dbo.class_materials(media_id);
            CREATE INDEX IX_gallery_items_media_id ON dbo.gallery_items(media_id);
            CREATE INDEX IX_advertisements_media_id ON dbo.advertisements(media_id);
            CREATE INDEX IX_refresh_tokens_user_id ON dbo.refresh_tokens(user_id);
            CREATE INDEX IX_active_sessions_user_id ON dbo.active_sessions(user_id);
            CREATE INDEX IX_user_payments_user_id ON dbo.user_payments(user_id);
            GO
            """;
    }
}