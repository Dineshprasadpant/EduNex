using EduNex.Api.DataAccess;
using EduNex.Models;
using System.Security.Cryptography;

namespace EduNex.Api.Service
{
    public interface ITokenService
    {
        Task<TokenPairDto> GenerateTokenPairAsync(JwtPayload payload);
        Task<TokenPairDto> RotateRefreshTokenAsync(string rawToken);
        Task RevokeOneAsync(string rawToken);
        Task RevokeAllForUserAsync(Guid userId);
    }
    public class TokenService : ITokenService
    {
        private static readonly TimeSpan ThirtyDays = TimeSpan.FromDays(30);

        private readonly IAuthDal _authDal;
        private readonly IJwtService _jwtService;

        public TokenService(IAuthDal authDal, IJwtService jwtService)
        {
            _authDal = authDal;
            _jwtService = jwtService;
        }

        private static string HashToken(string raw)
        {
            var bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(raw));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        public async Task<TokenPairDto> GenerateTokenPairAsync(JwtPayload payload)
        {
            var accessToken = _jwtService.SignAccessToken(payload);

            var raw = Convert.ToHexString(RandomNumberGenerator.GetBytes(64)).ToLowerInvariant();
            var hashed = HashToken(raw);
            var expiresAt = DateTimeOffset.UtcNow.Add(ThirtyDays);

            await _authDal.InsertRefreshTokenAsync(new RefreshToken
            {
                UserId = payload.UserId,
                Token = hashed,
                ExpiresAt = expiresAt,
            });

            return new TokenPairDto { AccessToken = accessToken, RefreshToken = raw };
        }

        public async Task<TokenPairDto> RotateRefreshTokenAsync(string rawToken)
        {
            var hashed = HashToken(rawToken);
            var row = await _authDal.FindActiveRefreshTokenWithUserAsync(hashed);

            if (row is null || row.ExpiresAt < DateTimeOffset.UtcNow)
                throw new UnauthorizedException("Invalid or expired refresh token");

            // A blocked account must not be able to mint fresh tokens.
            if (row.IsBlocked)
                throw new UnauthorizedException("Your account has been blocked");

            await _authDal.RevokeRefreshTokenByIdAsync(row.Id);

            return await GenerateTokenPairAsync(new JwtPayload { UserId = row.UserId, Role = row.Role });
        }

        public async Task RevokeOneAsync(string rawToken) =>
            await _authDal.RevokeRefreshTokenByTokenAsync(HashToken(rawToken));

        public async Task RevokeAllForUserAsync(Guid userId) =>
            await _authDal.RevokeAllRefreshTokensForUserAsync(userId);
    }
}