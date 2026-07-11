using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

// NuGet: System.IdentityModel.Tokens.Jwt
//
// Mirrors utils/jwt.ts's access-token half only (signAccessToken /
// verifyAccessToken, aliased as signToken/verifyToken). The Node file also
// defines signRefreshToken/verifyRefreshToken, but token.service.ts never
// actually calls them -- refresh tokens there are opaque
// crypto.randomBytes(64) values, hashed with SHA-256 and stored in
// dbo.refresh_tokens (see TokenService.cs). So there is no refresh-token
// JWT signing/verifying to port; only access tokens go through JWT here.
//
// Config mapping (env.ts wasn't provided, so these appsettings keys are a
// reasonable default -- rename to match your real config if different):
//   Jwt:Secret                    <- JWT_SECRET
//   Jwt:AccessTokenExpiryMinutes  <- JWT_ACCESS_EXPIRES_IN (converted to a
//                                     plain integer minutes value instead of
//                                     jsonwebtoken's "15m"-style string)
namespace EduNex.Api.Service
{
    public class JwtPayload
    {
        public Guid UserId { get; set; }
        public string Role { get; set; } = string.Empty;
    }

    public interface IJwtService
    {
        string SignAccessToken(JwtPayload payload);
        JwtPayload VerifyAccessToken(string token);
    }

    public class JwtService : IJwtService
    {
        private readonly string _secret;
        private readonly int _accessTokenExpiryMinutes;

        public JwtService(IConfiguration configuration)
        {
            _secret = configuration["Jwt:Secret"]
                ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
            _accessTokenExpiryMinutes = configuration.GetValue<int?>("Jwt:AccessTokenExpiryMinutes") ?? 15;
        }

        public string SignAccessToken(JwtPayload payload)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("userId", payload.UserId.ToString()),
                new Claim("role", payload.Role),
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_accessTokenExpiryMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public JwtPayload VerifyAccessToken(string token)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
            };

            var principal = new JwtSecurityTokenHandler().ValidateToken(token, validationParameters, out _);

            return new JwtPayload
            {
                UserId = Guid.Parse(principal.FindFirstValue("userId")!),
                Role = principal.FindFirstValue("role")!,
            };
        }
    }
}