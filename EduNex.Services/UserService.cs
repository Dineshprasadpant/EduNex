using EduNex.Common;
using EduNex.DataAccess;
using EduNex.Models;
using Microsoft.Extensions.Configuration;

namespace EduNex.Services
{
    public interface IUserService
    {
        Task<(List<UserListItemDto> Data, int Total, int Page, int Limit)> ListAsync(ListUsersQuery query);
        Task<UserDto> GetByIdAsync(Guid id);
        Task<UserDto> CreateAsync(CreateUserRequest input);
        Task<UserDto> UpdateAsync(Guid id, UpdateUserRequest input);
        Task<UserDto> VerifyAsync(Guid id);
        Task<UserDto> BlockAsync(Guid id, bool blocked);
        Task<UserDto> UnlockAsync(Guid id);
        Task<ResetPasswordResultDto> ResetPasswordAsync(Guid id, string newPassword);
        Task<object?> GetProfileAsync(Guid id, Guid requesterId, string requesterRole);
        Task<TeacherProfileDto> UpdateProfileAsync(Guid id, UpdateProfileRequest input, Guid requesterId, string requesterRole);
        Task<StudentProfile> UpdateEnrollmentAsync(Guid id, UpdateEnrollmentRequest input, Guid requesterId, string requesterRole);
        Task<List<TeacherAboutDto>> GetTeachersForAboutAsync();
    }

    public class UserService : IUserService
    {
        private readonly IUserDal _repo;
        private readonly IMailService _mail;
        private readonly string _frontendUrl;

        public UserService(IUserDal repo,IMailService mail, IConfiguration configuration)
        {
            _repo = repo;
            _mail = mail;
            _frontendUrl = configuration["Frontend:Url"] ?? string.Empty;
        }

        public async Task<(List<UserListItemDto> Data, int Total, int Page, int Limit)> ListAsync(ListUsersQuery query)
        {
            var page = query.Page ?? 1;
            var limit = query.Limit ?? 20;
            var offset = (page - 1) * limit;

            bool? isVerified = query.IsVerified switch
            {
                "true" => true,
                "false" => false,
                _ => null
            };

            var (data, total) = await _repo.ListAsync(query.Role, query.Search, isVerified, limit, offset);
            return (data, total, page, limit);
        }

        public async Task<UserDto> GetByIdAsync(Guid id)
        {
            var user = await _repo.GetByIdAsync(id) ?? throw new NotFoundException("User not found");
            return ToDto(user);
        }

        public async Task<UserDto> CreateAsync(CreateUserRequest input)
        {
            if (await _repo.EmailExistsAsync(input.Email))
                throw new ConflictException("Email already exists");

            if (await _repo.PhoneExistsAsync(input.Phone))
                throw new ConflictException("Phone number already exists");

            if (input.Role == "student")
            {
                if (string.IsNullOrEmpty(input.CitizenshipCertificate))
                    throw new BadRequestException("Citizenship certificate is required");

                if (!string.IsNullOrEmpty(input.Plan) && input.Plan != "free" && string.IsNullOrEmpty(input.PaymentImage))
                    throw new BadRequestException("Payment image is required for paid plans");
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(input.Password);

            var user = await _repo.InsertUserAsync(new User
            {
                FirstName = input.FirstName,
                LastName = input.LastName,
                Email = input.Email,
                Phone = input.Phone,
                PasswordHash = passwordHash,
                Role = input.Role,
                Image = input.Image,
                IsVerified = input.IsVerified ?? (input.Role == "teacher"),
                IsBlocked = false,
                LoginLocked = false,
                FailedLoginAttempts = 0
            });

            if (input.Role == "student")
            {
                var plan = input.Plan ?? "free";
                var courseId = input.CourseId;
                var initialVerification = user.IsVerified;

                await _repo.InsertStudentProfileAsync(new StudentProfile
                {
                    UserId = user.Id,
                    Plan = plan,
                    CourseId = courseId,
                    PaymentImage = input.PaymentImage,
                    CitizenshipCertificate = input.CitizenshipCertificate,
                    InitialVerification = initialVerification
                });

                if (user.IsVerified)
                {
                    string? courseTitle = null;
                    string? planFeatures = null;
                    if (courseId.HasValue)
                    {
                        var course = await _repo.GetCourseByIdAsync(courseId.Value);
                        if (course != null)
                        {
                            courseTitle = course.Title;
                            planFeatures = plan switch
                            {
                                "paid" => course.PaidFeatures,
                                "half" => course.HalfFeatures,
                                _ => course.FreeFeatures
                            };
                        }
                    }

                    await _mail.SendAccountVerifiedAsync(user.Email, $"{user.FirstName} {user.LastName}", new AccountVerifiedMailData
                    {
                        Plan = plan,
                        CourseTitle = courseTitle,
                        PlanFeatures = planFeatures,
                        PortalUrl = $"{_frontendUrl}/login"
                    });
                }
            }
            else if (input.Role == "teacher")
            {
                var profile = await _repo.InsertTeacherProfileAsync(new TeacherProfile
                {
                    UserId = user.Id,
                    Bio = input.Bio,
                    Specialization = input.Specialization,
                    EnableDisplayInAbout = input.EnableDisplayInAbout ?? false
                });

                if (input.CourseIds?.Count > 0)
                    await _repo.InsertTeacherCoursesAsync(profile.Id, input.CourseIds);
            }

            return ToDto(user);
        }


        public async Task<UserDto> UpdateAsync(Guid id, UpdateUserRequest input)
        {
            var existing = await _repo.GetByIdAsync(id) ?? throw new NotFoundException("User not found");

            if (input.Email != null && input.Email != existing.Email && await _repo.EmailExistsAsync(input.Email, id))
                throw new ConflictException("Email already in use");

            if (input.Phone != null && input.Phone != existing.Phone && await _repo.PhoneExistsAsync(input.Phone, id))
                throw new ConflictException("Phone number already in use");

            existing.FirstName = input.FirstName ?? existing.FirstName;
            existing.LastName = input.LastName ?? existing.LastName;
            existing.Email = input.Email ?? existing.Email;
            existing.Phone = input.Phone ?? existing.Phone;
            existing.Image = input.Image ?? existing.Image;
            existing.IsVerified = input.IsVerified ?? existing.IsVerified;
            existing.IsBlocked = input.IsBlocked ?? existing.IsBlocked;
            existing.LoginLocked = input.LoginLocked ?? existing.LoginLocked;

            var updated = await _repo.UpdateUserAsync(existing) ?? throw new NotFoundException("User not found");

            if (existing.Role == "student")
            {
                var studentFieldsProvided = input.Plan != null || input.CourseId != null
                    || input.PaymentImage != null || input.CitizenshipCertificate != null;

                if (studentFieldsProvided)
                {
                    var profile = await _repo.GetStudentProfileByUserIdAsync(id);
                    if (profile != null)
                    {
                        await _repo.UpdateStudentProfileFieldsAsync(
                            id,
                            input.Plan ?? profile.Plan,
                            input.CourseId ?? profile.CourseId,
                            input.PaymentImage ?? profile.PaymentImage,
                            input.CitizenshipCertificate ?? profile.CitizenshipCertificate);
                    }
                }
            }
            else if (existing.Role == "teacher")
            {
                var teacherFieldsProvided = input.Bio != null || input.Specialization != null || input.EnableDisplayInAbout != null;

                if (teacherFieldsProvided)
                {
                    var profile = await _repo.GetTeacherProfileByUserIdAsync(id);
                    if (profile != null)
                    {
                        var updatedProfile = await _repo.UpdateTeacherProfileFieldsAsync(
                            id,
                            input.Bio ?? profile.Bio,
                            input.Specialization ?? profile.Specialization,
                            input.EnableDisplayInAbout ?? profile.EnableDisplayInAbout);

                        if (updatedProfile != null && input.CourseIds != null)
                        {
                            await _repo.DeleteTeacherCoursesAsync(updatedProfile.Id);
                            if (input.CourseIds.Count > 0)
                                await _repo.InsertTeacherCoursesAsync(updatedProfile.Id, input.CourseIds);
                        }
                    }
                }
            }

            return ToDto(updated);
        }

        public async Task<UserDto> VerifyAsync(Guid id)
        {
            var user = await _repo.SetVerifiedAsync(id) ?? throw new NotFoundException("User not found");

            if (user.Role == "student")
            {
                var profile = await _repo.GetStudentProfileByUserIdAsync(id);
                if (profile != null && !profile.InitialVerification)
                {
                    await _repo.SetStudentInitialVerificationAsync(id);

                    string? courseTitle = null;
                    string? planFeatures = null;
                    if (profile.CourseId.HasValue)
                    {
                        var course = await _repo.GetCourseByIdAsync(profile.CourseId.Value);
                        if (course != null)
                        {
                            courseTitle = course.Title;
                            planFeatures = profile.Plan switch
                            {
                                "paid" => course.PaidFeatures,
                                "half" => course.HalfFeatures,
                                _ => course.FreeFeatures
                            };
                        }
                    }

                    await _mail.SendAccountVerifiedAsync(user.Email, $"{user.FirstName} {user.LastName}", new AccountVerifiedMailData
                    {
                        Plan = profile.Plan,
                        CourseTitle = courseTitle,
                        PlanFeatures = planFeatures,
                        PortalUrl = $"{_frontendUrl}/login"
                    });
                }
            }

            return ToDto(user);
        }

        public async Task<UserDto> BlockAsync(Guid id, bool blocked)
        {
            var user = await _repo.SetBlockedAsync(id, blocked) ?? throw new NotFoundException("User not found");
            if (blocked) await _repo.RevokeAllRefreshTokensAsync(id);
            return ToDto(user);
        }

        public async Task<UserDto> UnlockAsync(Guid id)
        {
            var user = await _repo.UnlockAsync(id) ?? throw new NotFoundException("User not found");
            return ToDto(user);
        }

        public async Task<ResetPasswordResultDto> ResetPasswordAsync(Guid id, string newPassword)
        {
            var user = await _repo.GetByIdAsync(id) ?? throw new NotFoundException("User not found");

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _repo.UpdatePasswordHashAsync(id, passwordHash);
            await _repo.RevokeAllRefreshTokensAsync(id);

            // Matches the source exactly: the plaintext new password is
            // emailed to the user. Flagging in case this wasn't intentional.
            await _mail.SendPasswordResetAsync(user.Email, $"{user.FirstName} {user.LastName}", newPassword);

            return new ResetPasswordResultDto();
        }

        // ---- Self-service profile / enrollment -----------------------------

        public async Task<object?> GetProfileAsync(Guid id, Guid requesterId, string requesterRole)
        {
            if (requesterRole != "admin" && requesterId != id) throw new ForbiddenException();

            var user = await _repo.GetByIdAsync(id) ?? throw new NotFoundException("User not found");

            if (user.Role == "student")
                return await _repo.GetStudentProfileByUserIdAsync(id);

            if (user.Role == "teacher")
            {
                var profile = await _repo.GetTeacherProfileByUserIdAsync(id);
                if (profile == null) return null;

                var courses = await _repo.GetTeacherCoursesAsync(profile.Id);
                return new TeacherProfileWithCoursesDto
                {
                    Id = profile.Id,
                    UserId = profile.UserId,
                    Bio = profile.Bio,
                    Specialization = profile.Specialization,
                    EnableDisplayInAbout = profile.EnableDisplayInAbout,
                    CreatedAt = profile.CreatedAt,
                    UpdatedAt = profile.UpdatedAt,
                    Courses = courses
                };
            }

            return null;
        }

        public async Task<TeacherProfileDto> UpdateProfileAsync(Guid id, UpdateProfileRequest input, Guid requesterId, string requesterRole)
        {
            if (requesterRole != "admin" && requesterId != id) throw new ForbiddenException();

            var user = await _repo.GetByIdAsync(id) ?? throw new NotFoundException("User not found");

            if (user.Role != "teacher")
                throw new ForbiddenException("Profile updates not allowed for this role");

            var existing = await _repo.GetTeacherProfileByUserIdAsync(id);

            var updated = await _repo.UpdateTeacherProfileFieldsAsync(
                id,
                input.Bio ?? existing?.Bio,
                input.Specialization ?? existing?.Specialization,
                existing?.EnableDisplayInAbout) ?? throw new NotFoundException("Teacher profile not found");

            return new TeacherProfileDto
            {
                Id = updated.Id,
                UserId = updated.UserId,
                Bio = updated.Bio,
                Specialization = updated.Specialization,
                EnableDisplayInAbout = updated.EnableDisplayInAbout,
                CreatedAt = updated.CreatedAt,
                UpdatedAt = updated.UpdatedAt
            };
        }

        public async Task<StudentProfile> UpdateEnrollmentAsync(Guid id, UpdateEnrollmentRequest input, Guid requesterId, string requesterRole)
        {
            if (requesterRole != "admin" && requesterId != id) throw new ForbiddenException();

            var user = await _repo.GetByIdAsync(id) ?? throw new NotFoundException("User not found");
            if (user.Role != "student") throw new ForbiddenException("Only students have enrollment");

            var existing = await _repo.GetStudentProfileByUserIdAsync(id);

            // No "anything provided?" guard here on purpose - matches the
            // TS updateEnrollment, which always issues the UPDATE (bumping
            // updated_at) even when none of the three fields were sent,
            // unlike the studentFieldsProvided guard in UpdateAsync above.
            return await _repo.UpdateStudentProfileFieldsAsync(
                id,
                existing?.Plan,
                input.CourseId ?? existing?.CourseId,
                input.PaymentImage ?? existing?.PaymentImage,
                input.CitizenshipCertificate ?? existing?.CitizenshipCertificate)
                ?? throw new NotFoundException("Student profile not found");
        }

        // ---- Public listing --------------------------------------------------

        public Task<List<TeacherAboutDto>> GetTeachersForAboutAsync() => _repo.GetTeachersForAboutAsync();

        // ---- Mapping -----------------------------------------------------

        private static UserDto ToDto(User u) => new()
        {
            Id = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Email = u.Email,
            Phone = u.Phone,
            Role = u.Role,
            Image = u.Image,
            IsVerified = u.IsVerified,
            IsBlocked = u.IsBlocked,
            LoginLocked = u.LoginLocked,
            FailedLoginAttempts = u.FailedLoginAttempts,
            LastLoginAt = u.LastLoginAt,
            CreatedAt = u.CreatedAt,
            UpdatedAt = u.UpdatedAt
        };
    }
}