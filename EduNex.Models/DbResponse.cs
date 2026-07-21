using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace EduNex.Models
{


    public readonly struct PaginationResult
    {
        public int Offset { get; init; }
        public int Limit { get; init; }
        public int Page { get; init; }
    }

    public static class Paginator
    {
        public static PaginationResult Paginate(string? pageRaw, string? limitRaw)
        {
            var page = Math.Max(1, ParseNumberOrDefault(pageRaw, 1));
            var limit = Math.Min(100, Math.Max(1, ParseNumberOrDefault(limitRaw, 10)));
            var offset = (page - 1) * limit;
            return new PaginationResult { Offset = offset, Limit = limit, Page = page };
        }

        // Mirrors JS `Number(x) || fallback`: empty/non-numeric/NaN AND the
        // literal value 0 all fall back to `fallback` (JS treats 0 as falsy).
        private static int ParseNumberOrDefault(string? raw, int fallback)
        {
            if (raw != null && double.TryParse(raw, out var n) && n != 0)
                return (int)n;
            return fallback;
        }
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; } = true;
        public string? Message { get; set; }
        public T? Data { get; set; }

        public static ApiResponse<T> Ok(T data, string? message = null) =>
            new() { Success = true, Data = data, Message = message };
    }

    // Non-generic variant for endpoints that only return a message (delete, etc).
    public class ApiResponse
    {
        public bool Success { get; set; } = true;
        public string? Message { get; set; }

        public static ApiResponse Ok(string message) =>
            new() { Success = true, Message = message };

        public static ApiResponse Fail(string message) =>
            new() { Success = false, Message = message };
    }
    public class PaginationMeta
    {
        public int Page { get; set; }
        public int Limit { get; set; }
        public int Total { get; set; }
        public int TotalPages { get; set; }

        public static PaginationMeta Create(int total, int page, int limit) => new()
        {
            Page = page,
            Limit = limit,
            Total = total,
            TotalPages = limit <= 0 ? 0 : (int)Math.Ceiling(total / (double)limit)
        };
    }

    // { success: true, data }  -- used by ok(res, data) and created(res, data)
    public class ApiDataResponse<T>
    {
        public bool Success { get; set; } = true;
        public T Data { get; set; } = default!;
    }

    public class ApiListResponse<T>
    {
        public bool Success { get; set; } = true;
        public IEnumerable<T> Data { get; set; } = Array.Empty<T>();

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public PaginationMeta? Meta { get; set; }
        public static ApiListResponse<T> Ok(IEnumerable<T> data, PaginationMeta meta) =>
        new() { Success = true, Data = data, Meta = meta };
    }


    public class PagedResult<T>
    {
        public IEnumerable<T> Data { get; set; } = Array.Empty<T>();
        public int Total { get; set; }
    }
    public class DbResponse<T>
    {
        public int Total { get; set; }
        public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
        public PagedResponse<T> ToPagedResponse(int page, int limit)
        {
            return new PagedResponse<T>
            {
                Data = Items,
                Pagination = new PaginationMeta
                {
                    Total = Total,
                    Page = page,
                    Limit = limit,
                    TotalPages = (int)Math.Ceiling((double)Total / limit),
                }
            };
        }
    }
    public class PagedResponse<T>
    {
        [JsonPropertyName("data")]
        public IEnumerable<T> Data { get; set; } = Enumerable.Empty<T>();

        [JsonPropertyName("pagination")]
        public PaginationMeta Pagination { get; set; } = new();
    }

   
}
