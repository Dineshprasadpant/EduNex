using EduNex.Api.DataAccess;
using EduNex.Models;
using Microsoft.AspNetCore.Mvc.Filters;

namespace EduNex.Api.Filters
{
    public class BlockedUserCheckFilter : IAsyncActionFilter
    {
        private readonly IAuthDal _authDal;

        public BlockedUserCheckFilter(IAuthDal authDal)
        {
            _authDal = authDal;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var userIdClaim = context.HttpContext.User.FindFirst("userId")?.Value;
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedException("Invalid or expired token");
            }

            var state = await _authDal.GetUserAuthStateAsync(userId);
            if (state is null)
            {
                throw new UnauthorizedException("Account no longer exists");
            }
            if (state.IsBlocked)
            {
                throw new UnauthorizedException("Your account has been blocked");
            }

            await next();
        }
    }
}