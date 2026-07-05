using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EduNex.Models
{
    public class Exam
    {
        [JsonPropertyName("_id")]
        public Guid Id { get; set; }
        
        [JsonPropertyName("exam_id")]
        public string ExternalId { get; set; }
        
        public string Title { get; set; }
        public string Description { get; set; }
        
        [JsonPropertyName("exam_name")]
        public string ExamName { get; set; }
        
        [JsonPropertyName("startDateTime")]
        public DateTime StartDateTime { get; set; }
        
        [JsonPropertyName("endDateTime")]
        public DateTime EndDateTime { get; set; }
        
        [JsonPropertyName("total_marks")]
        public int TotalMarks { get; set; }
        
        [JsonPropertyName("pass_marks")]
        public int PassMarks { get; set; }
        
        public int Duration { get; set; }
        
        public bool NegativeMarking { get; set; }
        public decimal? NegativeMarkingNumber { get; set; }
        
        [JsonPropertyName("question_sheet_id")]
        public Guid QuestionSheetId { get; set; }

        // Mappings for populated data
        public string QuestionSheetName { get; set; }
        public List<Guid> BatchIds { get; set; } = new List<Guid>();
        public List<BatchRef> PopulatedBatches { get; set; } = new List<BatchRef>();
        
        [JsonPropertyName("status")]
        public string Status { get; set; } // current, upComming
    }
}
