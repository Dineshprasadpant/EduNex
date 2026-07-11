using System;
using System.Text.Json;
using EduNex.Models;
namespace EduNex.API
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (ValidationException vex)
            {
                await WriteAsync(context, vex.StatusCode, new
                {
                    success = false,
                    code = vex.Code,
                    message = vex.Message,
                    errors = vex.Errors
                });
            }
            catch (AppException aex)
            {
                await WriteAsync(context, aex.StatusCode, new
                {
                    success = false,
                    code = aex.Code,
                    message = aex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Unhandled Error]");
                await WriteAsync(context, 500, new
                {
                    success = false,
                    code = "INTERNAL_ERROR",
                    message = "Something went wrong"
                });
            }
        }

        private static Task WriteAsync(HttpContext context, int statusCode, object body)
        {
            if (context.Response.HasStarted) return Task.CompletedTask;

            context.Response.Clear();
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";
            return context.Response.WriteAsync(JsonSerializer.Serialize(body, JsonOptions));
        }
    }
}