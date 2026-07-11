using EduNex.Models;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
namespace EduNex.Api.Filters
{
    public class VerifyTurnstileAttribute : Attribute, IAsyncActionFilter
    {
        private const string VerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var httpClientFactory = context.HttpContext.RequestServices.GetRequiredService<IHttpClientFactory>();

            var secretKey = configuration["Turnstile:SecretKey"];
            if (string.IsNullOrEmpty(secretKey))
            {
                await next();
                return;
            }

            var token = context.HttpContext.Request.Form["turnstileToken"].ToString();
            if (string.IsNullOrEmpty(token))
            {
                token = context.HttpContext.Request.Headers["cf-turnstile-response"].ToString();
            }

            if (string.IsNullOrEmpty(token))
            {
                throw new BadHttpRequestException("Captcha verification required.");
            }

            var client = httpClientFactory.CreateClient();
            var formValues = new Dictionary<string, string>
            {
                ["secret"] = secretKey,
                ["response"] = token,
            };
            var remoteIp = context.HttpContext.Connection.RemoteIpAddress?.ToString();
            if (!string.IsNullOrEmpty(remoteIp))
            {
                formValues["remoteip"] = remoteIp;
            }

            var response = await client.PostAsync(VerifyUrl, new FormUrlEncodedContent(formValues));
            var result = await response.Content.ReadFromJsonAsync<TurnstileVerifyResponse>();

            if (result is null || !result.Success)
            {
                throw new BadRequestException("Captcha verification failed. Please try again.");
            }

            await next();
        }

        private class TurnstileVerifyResponse
        {
            public bool Success { get; set; }
        }
    }
}