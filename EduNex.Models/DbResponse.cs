using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
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

    public class PaginationMeta
    {
        [JsonPropertyName("total")]
        public int Total { get; set; }

        [JsonPropertyName("page")]
        public int Page { get; set; }

        [JsonPropertyName("limit")]
        public int Limit { get; set; }

        [JsonPropertyName("totalPages")]
        public int TotalPages { get; set; }
    }
}
