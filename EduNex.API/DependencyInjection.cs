using EduNex.DataAccess;
using EduNex.Services;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.OpenApi.Models;
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
            // Controllers
            services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
            services.AddEndpointsApiExplorer();

            // Swagger
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
                            UnresolvedReference = true,
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

            // Repositories
            services.AddScoped<IAnnouncementDal>(_ =>
                new AnnouncementDal(connectionString));
            services.AddScoped<IAdvertisementDal>(_ =>
                new AdvertisementDal(connectionString));
            services.AddScoped<IAnnouncementDal>(_ =>
                new AnnouncementDal(connectionString));
            services.AddScoped<IAdvertisementDal>(_ =>
                new AdvertisementDal(connectionString));
            services.AddScoped<IAnalyticsDal>(_ =>
                new AnalyticsDal(connectionString));
            services.AddScoped<IBatchDal>(_ =>
                new BatchDal(connectionString));
            services.AddScoped<IClassMaterialDal>(_ =>
                new ClassMaterialDal(connectionString));
            services.AddScoped<ICourseDal>(_ =>
                new CourseDal(connectionString));
            services.AddScoped<IEventDal>(_ =>
                new EventDal(connectionString));
            services.AddScoped<IExamPerformanceDal>(_ =>
                new ExamPerformanceDal(connectionString));
            services.AddScoped<IExamDal>(_ =>
                new ExamDal(connectionString));
            services.AddScoped<IFeedbackDal>(_ =>
                new FeedbackDal(connectionString));
            services.AddScoped<INewsDal>(_ =>
                new NewsDal(connectionString));
            services.AddScoped<IQuestionSheetDal>(_ =>
                new QuestionSheetDal(connectionString));
            services.AddScoped<ISubscriberDal>(_ =>
                new SubscriberDal(connectionString));
            services.AddScoped<IUserDal>(_ =>
                new UserDal(connectionString));
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
            services.AddScoped<IFileService, FileService>();
            services.AddScoped<IMailService, MailService>();
            services.AddScoped<INewsService, NewsService>();
            services.AddScoped<IQuestionSheetService, QuestionSheetService>();
            services.AddScoped<ISubscriberService, SubscriberService>();
            services.AddScoped<IUserService, UserService>();

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