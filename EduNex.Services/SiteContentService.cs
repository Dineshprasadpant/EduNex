using EduNex.DataAccess;
using EduNex.Models;
using Microsoft.IdentityModel.Tokens.Experimental;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace EduNex.Services
{
    // 1:1 with siteContentService (site-content.service.ts).
    public interface ISiteContentService
    {
        Task<Dictionary<string, object>> GetAllAsync();
        Task<object> GetByKeyAsync(string key);
        Task<SiteContentResultDto> UpdateAsync(string key, JsonElement data);
        Task SeedDefaultsAsync();
    }

    public class SiteContentService : ISiteContentService
    {
        private readonly ISiteContentDal _siteContentDal;
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        public SiteContentService(ISiteContentDal siteContentDal)
        {
            _siteContentDal = siteContentDal;
        }

        private static object DeserializeSection(string key, string json)
        {
            var type = SiteContentKeys.SectionTypes[key];
            return JsonSerializer.Deserialize(json, type, JsonOptions) ?? SiteContentKeys.DefaultContent[key];
        }

        // Equivalent of parseSection(key, data): deserialize into the
        // section's POCO type, then run SiteContentKeys.Validate() (mirrors
        // the zod schema's exact constraints). Throws ValidationError (422)
        // on either a bad shape or a rule failure.
        private static object ParseSection(string key, JsonElement data)
        {
            var type = SiteContentKeys.SectionTypes[key];
            object? parsed;
            try
            {
                parsed = JsonSerializer.Deserialize(data.GetRawText(), type, JsonOptions);
            }
            catch (JsonException ex)
            {
                throw new ValidationException("Invalid section data", new Dictionary<string, string[]> { ["body"] = new[] { ex.Message } });
            }
            if (parsed is null)
                throw new ValidationException("Invalid section data", new Dictionary<string, string[]> { ["body"] = new[] { "Section data must be an object" } });

            var errors = SiteContentKeys.Validate(key, parsed);
            if (errors.Count > 0)
                throw new ValidationException("Invalid section data", new Dictionary<string, string[]> { ["body"] = errors.ToArray() });

            return parsed;
        }

        public async Task<Dictionary<string, object>> GetAllAsync()
        {
            var rows = await _siteContentDal.FindAllAsync();
            var stored = rows.ToDictionary(r => r.Key, r => r.Data);

            var result = new Dictionary<string, object>();
            foreach (var key in SiteContentKeys.All)
                result[key] = stored.TryGetValue(key, out var json) ? DeserializeSection(key, json) : SiteContentKeys.DefaultContent[key];

            return result;
        }

        public async Task<object> GetByKeyAsync(string key)
        {
            var row = await _siteContentDal.FindByKeyAsync(key);
            return row is not null ? DeserializeSection(key, row.Data) : SiteContentKeys.DefaultContent[key];
        }

        public async Task<SiteContentResultDto> UpdateAsync(string key, JsonElement data)
        {
            var parsed = ParseSection(key, data);
            var json = JsonSerializer.Serialize(parsed, SiteContentKeys.SectionTypes[key], JsonOptions);
            var row = await _siteContentDal.UpsertAsync(key, json);

            return new SiteContentResultDto { Key = row.Key, Data = DeserializeSection(key, row.Data), UpdatedAt = row.UpdatedAt };
        }

        public async Task SeedDefaultsAsync()
        {
            foreach (var key in SiteContentKeys.All)
            {
                var json = JsonSerializer.Serialize(SiteContentKeys.DefaultContent[key], SiteContentKeys.SectionTypes[key], JsonOptions);
                await _siteContentDal.InsertIfMissingAsync(key, json);
            }
        }
    }
}