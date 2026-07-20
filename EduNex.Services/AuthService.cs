using EduNex.Api.DataAccess;
using EduNex.Models;
using EduNex.Services;
using Microsoft.Extensions.Configuration;


namespace EduNex.Api.Service
{
    public interface IAuthService
    {
        Task<UserDto> RegisterAsync(RegisterRequestDto request);
        Task<LoginOutcome> LoginAsync(LoginRequestDto request);
        Task<UserDto> GetMeAsync(Guid userId);
    }
    public class LoginOutcome
    {
        public bool Success { get; set; }
        public LoginResultDto? Result { get; set; }
        public string? Message { get; set; }
        public bool IsAccountIssue { get; set; }
    }
    public class AuthService : IAuthService
    {
        private readonly IAuthDal _authDal;
        private readonly ITokenService _tokenService;
        private readonly IFileService _fileService;
        private readonly IMailService _mailService;
        private readonly int _maxFailedLoginAttempts;

        public AuthService(
            IAuthDal authDal,
            ITokenService tokenService,
            IFileService fileService,
            IMailService mailService,
            IConfiguration configuration)
        {
            _authDal = authDal;
            _tokenService = tokenService;
            _fileService = fileService;
            _mailService = mailService;
 
            _maxFailedLoginAttempts = configuration.GetValue<int?>("Auth:MaxFailedLoginAttempts") ?? 5;
        }
        public async Task<UserDto> RegisterAsync(RegisterRequestDto request)
        {
            if (await _authDal.FindUserByEmailAsync(request.Email) is not null)
                throw new ConflictException("A user with this email already exists");

            if (await _authDal.FindUserByPhoneAsync(request.Phone) is not null)
                throw new ConflictException("A user with this phone number already exists");

            if (request.Citizenship is null)
                throw new BadRequestException("Citizenship certificate is required");

            if (request.Plan != PlanType.Free && request.Payment is null)
                throw new BadRequestException("Payment image is required for paid plans");

            // Upload first so we don't create a user row if storage is unreachable
            // (same ordering rationale as the Node version's S3 upload-before-insert).
            var citizenshipUpload = await _fileService.UploadFileAsync(
                request.Citizenship, "uploads/citizenship",
                DocUploadRules.AllowedExtensions, DocUploadRules.MaxFileSizeBytes);

            string? paymentUrl = null;
            if (request.Payment is not null)
            {
                var paymentUpload = await _fileService.UploadFileAsync(
                    request.Payment, "uploads/payment",
                    DocUploadRules.AllowedExtensions, DocUploadRules.MaxFileSizeBytes);
                paymentUrl = paymentUpload.Url;
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var newUser = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Phone = request.Phone,
                PasswordHash = passwordHash,
                Role = "user",
                IsVerified = false,
                IsBlocked = false,
            };

            var newProfile = new StudentProfile
            {
                Plan = request.Plan,
                CourseId = request.CourseId,
                PaymentImage = paymentUrl,
                CitizenshipCertificate = citizenshipUpload.Url,
            };

            var (createdUser, _) = await _authDal.CreateUserWithStudentProfileAsync(newUser, newProfile);

            // Intentionally no user-facing email here -- students only hear
            // from us once an admin verifies the account.
            string? courseTitle = request.CourseId.HasValue
                ? await _authDal.FindCourseTitleByIdAsync(request.CourseId.Value)
                : null;

            // Fire-and-forget, never throws (see MailService.cs).
            _ = _mailService.SendNewUserAdminNotificationAsync(new NewUserAdminNotificationPayload
            {
                FirstName = createdUser.FirstName,
                LastName = createdUser.LastName,
                Email = createdUser.Email,
                Phone = createdUser.Phone,
                Role = createdUser.Role,
                Plan = request.Plan,
                CourseTitle = courseTitle,
            });

            return UserDto.FromEntity(createdUser);
        }


        public async Task<LoginOutcome> LoginAsync(LoginRequestDto request)
        {
            var user = await _authDal.FindUserByEmailAsync(request.Email);
            if (user is null)
                return Fail("Invalid email or password", isAccountIssue: false);

            if (user.LoginLocked)
                return Fail("Account is locked", isAccountIssue: true);

            if (user.IsBlocked)
                return Fail("Account is blocked", isAccountIssue: true);

            var validPassword = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!validPassword)
            {
                var newAttempts = user.FailedLoginAttempts + 1;
                var shouldLock = newAttempts >= _maxFailedLoginAttempts;
                await _authDal.RecordFailedLoginAsync(user.Id, newAttempts, shouldLock);

                return shouldLock
                    ? Fail("Account is locked", isAccountIssue: true)
                    : Fail("Invalid email or password", isAccountIssue: false);
            }

            await _authDal.RecordSuccessfulLoginAsync(user.Id);

            // authService.login's post-auth checks.
            if (!user.IsVerified)
                return Fail("Account not verified", isAccountIssue: true);
            // IsBlocked/LoginLocked already confirmed false above.

            var tokens = await _tokenService.GenerateTokenPairAsync(new JwtPayload
            {
                UserId = user.Id,
                Role = user.Role,
            });

            return new LoginOutcome
            {
                Success = true,
                Result = new LoginResultDto
                {
                    AccessToken = tokens.AccessToken,
                    RefreshToken = tokens.RefreshToken,
                    User = UserDto.FromEntity(user),
                },
            };
        }

        private static LoginOutcome Fail(string message, bool isAccountIssue) => new()
        {
            Success = false,
            Message = message,
            IsAccountIssue = isAccountIssue,
        };

        public async Task<UserDto> GetMeAsync(Guid userId)
        {
            var user = await _authDal.FindUserByIdAsync(userId);
            if (user is null)
                throw new UnauthorizedException("User not found");

            return UserDto.FromEntity(user);
        }
    }
}