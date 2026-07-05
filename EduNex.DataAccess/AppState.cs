using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using EduNex.Models;
using Microsoft.Extensions.Caching.Distributed;

namespace EduNex.DataAccess
{

    public class AppState
    {
        private static readonly ConcurrentDictionary<string, SessionUser> _memoryStore = new();
        private readonly IDistributedCache _cache;

        public AppState(IDistributedCache cache)
        {
            _cache = cache;
        }

        public void SetUser(string token, SessionUser user)
        {
            _memoryStore[token] = user;
        }

        public async Task SetUserWithRedisAsync(string token, SessionUser user, TimeSpan? expiry = null)
        {
            var json = JsonSerializer.Serialize(user);
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiry ?? TimeSpan.FromHours(24)
            };
            await _cache.SetStringAsync($"session:{token}", json, options);
        }

        public ConnectingUser? GetConnectingUser(HttpRequest request)
        {
            return Task.Run(() => GetConnectingUserAsync(request)).Result;
        }

        public async Task<ConnectingUser?> GetConnectingUserAsync(HttpRequest request)
        {
            try
            {
                request.Headers.TryGetValue("Authorization", out var authHeader);
                var token = authHeader.ToString();

                if (string.IsNullOrEmpty(token))
                    throw new Exception("Authorization header missing.");

                // Try in-memory first
                if (_memoryStore.TryGetValue(token, out var memUser))
                    return MapToConnectingUser(memUser);

                // Try Redis/distributed cache
                var tokenOnly = token.StartsWith("Bearer ") ? token.Split(" ")[1] : token;
                var json = await _cache.GetStringAsync($"session:{tokenOnly}");
                if (json != null)
                {
                    var redisUser = JsonSerializer.Deserialize<SessionUser>(json);
                    if (redisUser != null)
                        return MapToConnectingUser(redisUser);
                }

                throw new Exception("User session not found. Please login again.");
            }
            catch (Exception ex)
            {
                throw new Exception("ConnectingUser error: " + ex.Message);
            }
        }

        public void RemoveUser(string token)
        {
            _memoryStore.TryRemove(token, out _);
        }

        public async Task RemoveUserWithRedisAsync(string token)
        {
            var tokenOnly = token.StartsWith("Bearer ") ? token.Split(" ")[1] : token;
            _memoryStore.TryRemove(token, out _);
            await _cache.RemoveAsync($"session:{tokenOnly}");
        }

        public IEnumerable<SessionUser> GetConnectedUsers()
        {
            return _memoryStore.Values;
        }
        private static ConnectingUser MapToConnectingUser(SessionUser user)
        {
            return new ConnectingUser
            {
                Id = user.Id,
                Email = user.Email,
                Role = user.Role,
                Plan = user.Plan,
                UserConnectionString = user.ConnectionString,
                BatchId = user.BatchId,
                CourseEnrolledId = user.CourseEnrolledId,
                ConnectedAt = user.ConnectedAt
            };
        }
    }
}