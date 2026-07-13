using EduNex.Api.Filters;
using EduNex.Models;
using EduNex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens.Experimental;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

namespace EduNex.API.Controllers
{
    [ApiController]
    [Route("api/site-content")]
    public class SiteContentController : ControllerBase
    {
        private readonly ISiteContentService _siteContentService;

        public SiteContentController(ISiteContentService siteContentService)
        {
            _siteContentService = siteContentService;
        }

        // keyParamSchema.refine(isSiteContentKey) equivalent.
        private static void EnsureValidKey(string key)
        {
            if (!SiteContentKeys.IsValid(key))
                throw new ValidationException("Invalid request", new Dictionary<string, string[]> { ["params.key"] = new[] { "Unknown section key" } });
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiDataResponse<Dictionary<string, object>>), 200)]
        public async Task<IActionResult> List()
        {
            var data = await _siteContentService.GetAllAsync();
            return Ok(new ApiDataResponse<Dictionary<string, object>> { Data = data });
        }

        [HttpGet("{key}")]
        [ProducesResponseType(typeof(ApiDataResponse<object>), 200)]
        public async Task<IActionResult> GetByKey(string key)
        {
            EnsureValidKey(key);
            var data = await _siteContentService.GetByKeyAsync(key);
            return Ok(new ApiDataResponse<object> { Data = data });
        }

        [HttpPut("{key}")]
        [Authorize(Roles = "Admin")]
        [ServiceFilter(typeof(BlockedUserCheckFilter))]
        [ProducesResponseType(typeof(ApiDataResponse<SiteContentResultDto>), 200)]
        public async Task<IActionResult> Update(string key, [FromBody] JsonElement body)
        {
            EnsureValidKey(key);
            var result = await _siteContentService.UpdateAsync(key, body);
            return Ok(new ApiDataResponse<SiteContentResultDto> { Data = result });
        }
    }
}