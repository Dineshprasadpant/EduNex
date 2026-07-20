using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;

namespace EduNex.Common
{
    public interface ITurnstileVerifier
    {
        Task<bool> VerifyAsync(string? token, string? remoteIp = null);
    }

    public class TurnstileVerifier : ITurnstileVerifier
    {
        private const string VerifyEndpoint = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

        private readonly HttpClient _http;
        private readonly string _secretKey;

        public TurnstileVerifier(HttpClient http, IConfiguration configuration)
        {
            _http = http;
            _secretKey = configuration["Turnstile:SecretKey"]
                ?? throw new InvalidOperationException("Turnstile:SecretKey is not configured.");
        }

        public async Task<bool> VerifyAsync(string? token, string? remoteIp = null)
        {
            if (string.IsNullOrEmpty(token)) return false;

            var formData = new Dictionary<string, string>
            {
                ["secret"] = _secretKey,
                ["response"] = token
            };
            if (!string.IsNullOrEmpty(remoteIp)) formData["remoteip"] = remoteIp;

            using var response = await _http.PostAsync(VerifyEndpoint, new FormUrlEncodedContent(formData));
            if (!response.IsSuccessStatusCode) return false;

            var result = await response.Content.ReadFromJsonAsync<TurnstileVerifyResponse>();
            return result?.Success ?? false;
        }

        private class TurnstileVerifyResponse
        {
            [JsonPropertyName("success")]
            public bool Success { get; set; }
        }
    }
}