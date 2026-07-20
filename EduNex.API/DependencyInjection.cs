using EduNex.Api.DataAccess;
using EduNex.Api.Filters;
using EduNex.Api.Service;
using EduNex.DataAccess;
using EduNex.Services;
using Microsoft.OpenApi.Models;
using System.Text.Json;
using System.Text.Json.Serialization;
using EduNex.Common;
namespace EduNex.API
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationServices(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new Exception("Connection string not found.");

            Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;

            services.AddControllers()
                .AddJsonOptions(o =>
                {
                    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                    o.JsonSerializerOptions.Converters.Add(
                        new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
                });

            services.AddEndpointsApiExplorer();

            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "EduNex API",
                    Version = "v1"
                });

                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using Bearer token",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            services.AddSingleton<AppState>();

            services.AddDistributedMemoryCache();

            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = configuration.GetConnectionString("Redis");
            });

            services.AddHttpClient();


            services.AddScoped<IAnnouncementDal, AnnouncementDal>();
            services.AddScoped<IGalleryDal,GalleryDal>();
            services.AddScoped<IMediaDal, MediaDal>();
            services.AddScoped<IAdvertisementDal>(_ => new AdvertisementDal(connectionString));
            services.AddScoped<IAnalyticsDal>(_ => new AnalyticsDal(connectionString));
            services.AddScoped<IBatchDal>(_ => new BatchDal(connectionString));
            services.AddScoped<IClassMaterialDal, ClassMaterialDal>();
            services.AddScoped<ICourseDal, CourseDal>();
            services.AddScoped<IEventDal, EventDal>();
            services.AddScoped<IExamPerformanceDal>(_ => new ExamPerformanceDal(connectionString));
            services.AddScoped<IExamDal>(_ => new ExamDal(connectionString));
            services.AddScoped<IFeedbackDal, FeedbackDal>();
            services.AddScoped<INewsDal>(_ => new NewsDal(connectionString));
            services.AddScoped<IQuestionsDal, QuestionsDal>();
            services.AddScoped<ISubscriberDal>(_ => new SubscriberDal(connectionString));
            services.AddScoped<IDbConnectionFactory, DbConnectionFactory>();
            services.AddScoped<IAuthDal, AuthDal>();
            services.AddScoped<IUserDal>(_ => new UserDal(connectionString));
            services.AddScoped<ISiteContentDal, SiteContentDal>();
            services.AddScoped<ICategoryDal, CategoryDal>();


            // Services
            services.AddScoped<IAnnouncementService, AnnouncementService>();
            services.AddScoped<IAdvertisementService, AdvertisementService>();
            services.AddScoped<IAnalyticsService, AnalyticsService>();
            services.AddScoped<IBatchService, BatchService>();
            services.AddScoped<IClassMaterialService, ClassMaterialService>();
            services.AddScoped<ICourseService, CourseService>();
            services.AddScoped<IEventService, EventService>();
            services.AddScoped<IExamPerformanceService, ExamPerformanceService>();
            services.AddScoped<IExamService, ExamService>();
            services.AddScoped<IFeedbackService, FeedbackService>();
            services.AddScoped<IMailService, MailService>();
            services.AddScoped<INewsService, NewsService>();
            services.AddScoped<IQuestionsService, QuestionsService>();
            services.AddScoped<ISubscriberService, SubscriberService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IJwtService, JwtService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<ISiteContentService, SiteContentService>();
            services.AddScoped<ITurnstileVerifier, TurnstileVerifier>();
            services.AddScoped<ICategoryService, CategoryService>();
            services.AddScoped<BlockedUserCheckFilter>();
            services.AddScoped<IGalleryService, GalleryService>();
            services.AddScoped<IMediaService, MediaService>();
            services.AddScoped<IFileService, FileService>();
            // CORS
            var allowedOrigins = configuration
                .GetSection("Cors:AllowedOrigins")
                .Get<string[]>();

            services.AddCors(options =>
            {
                options.AddPolicy("AllowOrigins", policy =>
                {
                    if (allowedOrigins?.Contains("*") == true)
                    {
                        policy.AllowAnyOrigin()
                              .AllowAnyMethod()
                              .AllowAnyHeader();
                    }
                    else
                    {
                        policy.WithOrigins(allowedOrigins ?? Array.Empty<string>())
                              .AllowAnyMethod()
                              .AllowAnyHeader();
                    }
                });
            });

            return services;
        }
    }
}