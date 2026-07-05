/* ============================================================================
   Dragon Institute Database  -  SQL Server Express (T-SQL) build script
   Converted from a PostgreSQL 18 schema dump (31 tables, public schema).

   IMPORTANT ASSUMPTIONS (verify / edit before running in production):
   1. Postgres ENUM types are not shown with their values in \d output, only
      their names (course_type, user_role, student_plan, attempt_status,
      gallery_media_type). I've recreated them as NVARCHAR + CHECK
      constraints with a best-guess value list based on context elsewhere
      in the dump (e.g. analytics_daily has plan_free/plan_half/plan_full
      columns, so student_plan is assumed to be free/half/full).
      -> Search for "-- ASSUMPTION" and correct the value lists if wrong.
   2. Postgres text[] (array) columns (exams.access_plans) are stored as a
      JSON array string in NVARCHAR(MAX). Adjust in your app's data layer.
   3. gen_random_uuid() -> NEWID(), now() -> SYSDATETIMEOFFSET().
   4. timestamp with time zone -> DATETIMEOFFSET (preserves the tz-aware
      behavior of the original column type).
   5. FK actions (CASCADE / SET NULL / no action) are copied exactly from
      the constraints visible in your dump.
   6. Columns that had NO foreign key shown in the dump (e.g.
      question_sheets.created_by, class_materials.created_by,
      exams.created_by) are created as plain UNIQUEIDENTIFIER columns
      with no FK, matching the original exactly. Add a FK to users(id)
      yourself if that was the intent.

   Run this against a fresh database, e.g.:
       CREATE DATABASE DragonInstitute;
       GO
       USE DragonInstitute;
       GO
       -- then run the rest of this script
============================================================================ */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ============================================================================
   1. users
============================================================================ */
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
    -- ASSUMPTION: adjust to your real role list
    CONSTRAINT CK_users_role CHECK (role IN ('student','teacher','admin'))
);
GO

/* ============================================================================
   2. media
============================================================================ */
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

/* ============================================================================
   3. categories
============================================================================ */
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

/* ============================================================================
   4. courses
============================================================================ */
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
    -- ASSUMPTION: adjust to your real course_type list
    CONSTRAINT CK_courses_course_type CHECK (course_type IN ('offline','online','hybrid'))
);
GO

/* ============================================================================
   5. teacher_profiles
============================================================================ */
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

/* ============================================================================
   6. student_profiles
============================================================================ */
CREATE TABLE dbo.student_profiles (
    id                       UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_student_profiles_id DEFAULT NEWID(),
    user_id                  UNIQUEIDENTIFIER NOT NULL,
    plan                     NVARCHAR(20)     NOT NULL CONSTRAINT DF_student_profiles_plan DEFAULT 'free',
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
    -- ASSUMPTION: matches plan_free/plan_half/plan_full columns in analytics_daily
    CONSTRAINT CK_student_profiles_plan CHECK (plan IN ('free','half','full'))
);
GO

/* ============================================================================
   7. teacher_courses
============================================================================ */
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

/* ============================================================================
   8. question_sheets
============================================================================ */
CREATE TABLE dbo.question_sheets (
    id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_question_sheets_id DEFAULT NEWID(),
    sheet_name   NVARCHAR(200)    NOT NULL,
    created_by   UNIQUEIDENTIFIER NULL,
    created_at   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_question_sheets_created_at DEFAULT SYSDATETIMEOFFSET(),
    updated_at   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_question_sheets_updated_at DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT PK_question_sheets PRIMARY KEY (id)
);
GO

/* ============================================================================
   9. questions
============================================================================ */
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

/* ============================================================================
   10. question_options
============================================================================ */
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

/* ============================================================================
   11. exams
============================================================================ */
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
    -- ASSUMPTION: Postgres text[] array stored as a JSON array string
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

/* ============================================================================
   12. exam_attempts
============================================================================ */
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
    -- ASSUMPTION: adjust to your real attempt_status list
    CONSTRAINT CK_exam_attempts_status CHECK (status IN ('in_progress','submitted','timed_out'))
);
GO

/* ============================================================================
   13. exam_attempt_answers
============================================================================ */
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

/* ============================================================================
   14. announcements
============================================================================ */
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

/* ============================================================================
   15. announcement_resources
============================================================================ */
CREATE TABLE dbo.announcement_resources (
    id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_announcement_resources_id DEFAULT NEWID(),
    announcement_id   UNIQUEIDENTIFIER NOT NULL,
    media_id          UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT PK_announcement_resources PRIMARY KEY (id),
    CONSTRAINT FK_announcement_resources_announcement FOREIGN KEY (announcement_id) REFERENCES dbo.announcements(id) ON DELETE CASCADE,
    CONSTRAINT FK_announcement_resources_media FOREIGN KEY (media_id) REFERENCES dbo.media(id) ON DELETE CASCADE
);
GO

/* ============================================================================
   16. events
============================================================================ */
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

/* ============================================================================
   17. event_resources
============================================================================ */
CREATE TABLE dbo.event_resources (
    id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_event_resources_id DEFAULT NEWID(),
    event_id    UNIQUEIDENTIFIER NOT NULL,
    media_id    UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT PK_event_resources PRIMARY KEY (id),
    CONSTRAINT FK_event_resources_event FOREIGN KEY (event_id) REFERENCES dbo.events(id) ON DELETE CASCADE,
    CONSTRAINT FK_event_resources_media FOREIGN KEY (media_id) REFERENCES dbo.media(id) ON DELETE CASCADE
);
GO

/* ============================================================================
   18. class_materials
============================================================================ */
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

/* ============================================================================
   19. gallery_items
============================================================================ */
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
    CONSTRAINT FK_gallery_items_thumbnail_media FOREIGN KEY (thumbnail_media_id) REFERENCES dbo.media(id) ON DELETE SET NULL,
    -- ASSUMPTION: adjust to your real gallery_media_type list
    CONSTRAINT CK_gallery_items_media_type CHECK (media_type IN ('image','video'))
);
GO

/* ============================================================================
   20. advertisements
============================================================================ */
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

/* ============================================================================
   21. site_content
============================================================================ */
CREATE TABLE dbo.site_content (
    id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_site_content_id DEFAULT NEWID(),
    [key]        NVARCHAR(100)    NOT NULL,
    data         NVARCHAR(MAX)    NOT NULL,  -- was jsonb; validate with ISJSON() in app layer
    created_at   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_site_content_created_at DEFAULT SYSDATETIMEOFFSET(),
    updated_at   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_site_content_updated_at DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT PK_site_content PRIMARY KEY (id),
    CONSTRAINT UQ_site_content_key UNIQUE ([key])
);
GO

/* ============================================================================
   22. subscribers
============================================================================ */
CREATE TABLE dbo.subscribers (
    id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_subscribers_id DEFAULT NEWID(),
    email        NVARCHAR(255)    NOT NULL,
    created_at   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_subscribers_created_at DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT PK_subscribers PRIMARY KEY (id),
    CONSTRAINT UQ_subscribers_email UNIQUE (email)
);
GO

/* ============================================================================
   23. contact_messages
============================================================================ */
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

/* ============================================================================
   24. feedback
============================================================================ */
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

/* ============================================================================
   25. refresh_tokens
============================================================================ */
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

/* ============================================================================
   26. active_sessions
============================================================================ */
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

/* ============================================================================
   27. user_payments
============================================================================ */
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

/* ============================================================================
   28. analytics_daily
============================================================================ */
CREATE TABLE dbo.analytics_daily (
    id                   UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_analytics_daily_id DEFAULT NEWID(),
    date                 DATE             NOT NULL,
    total_visitors       INT              NOT NULL CONSTRAINT DF_analytics_daily_visitors DEFAULT 0,
    total_page_views     INT              NOT NULL CONSTRAINT DF_analytics_daily_page_views DEFAULT 0,
    new_registrations    INT              NOT NULL CONSTRAINT DF_analytics_daily_registrations DEFAULT 0,
    plan_free            INT              NOT NULL CONSTRAINT DF_analytics_daily_plan_free DEFAULT 0,
    plan_half            INT              NOT NULL CONSTRAINT DF_analytics_daily_plan_half DEFAULT 0,
    plan_full            INT              NOT NULL CONSTRAINT DF_analytics_daily_plan_full DEFAULT 0,
    subscribers_gained   INT              NOT NULL CONSTRAINT DF_analytics_daily_subs_gained DEFAULT 0,
    created_at           DATETIMEOFFSET   NOT NULL CONSTRAINT DF_analytics_daily_created_at DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT PK_analytics_daily PRIMARY KEY (id),
    CONSTRAINT UQ_analytics_daily_date UNIQUE (date)
);
GO

/* ============================================================================
   29. analytics_utm_sources
============================================================================ */
CREATE TABLE dbo.analytics_utm_sources (
    id       UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_analytics_utm_sources_id DEFAULT NEWID(),
    date     DATE             NOT NULL,
    source   NVARCHAR(100)    NOT NULL,
    visits   INT              NOT NULL CONSTRAINT DF_analytics_utm_sources_visits DEFAULT 0,
    CONSTRAINT PK_analytics_utm_sources PRIMARY KEY (id),
    CONSTRAINT FK_analytics_utm_sources_date FOREIGN KEY (date) REFERENCES dbo.analytics_daily(date) ON DELETE CASCADE
);
GO

/* ============================================================================
   30. analytics_page_views
============================================================================ */
CREATE TABLE dbo.analytics_page_views (
    session_token   NVARCHAR(255) NOT NULL,
    page_path       NVARCHAR(500) NOT NULL,
    date            DATE          NOT NULL,
    CONSTRAINT PK_analytics_page_views PRIMARY KEY (session_token, page_path, date)
);
GO

/* ============================================================================
   31. analytics_visitor_sessions
============================================================================ */
CREATE TABLE dbo.analytics_visitor_sessions (
    session_token   NVARCHAR(255) NOT NULL,
    date            DATE          NOT NULL,
    CONSTRAINT PK_analytics_visitor_sessions PRIMARY KEY (session_token, date)
);
GO

/* ============================================================================
   Helpful indexes on FK columns (SQL Server does not auto-index FKs
   the way some engines do)
============================================================================ */
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

PRINT 'Dragon Institute schema created successfully (31 tables).';
GO
