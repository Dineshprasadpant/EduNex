// Types for performance data

export interface Batch {
    _id: string;
    batch_name: string;
    course: {
      _id: string;
      title: string;
    } | null;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }
  
  export interface PerformanceSummary {
    _id: string;
    batchId: {
      _id: string;
      batch_name: string;
    };
    examId: {
      _id: string;
      title: string;
    } | null;
    academicYear: string;
    overallPercentage: number;
    numberOfExaminees: number;
    createdAt: string;
    __v: number;
  }
  
  export interface PerformanceDetails {
    _id: string;
    batchId: {
      _id: string,
      batch_name: string
    };
    examId: {
      _id: string;
      title: string
    }
    academicYear: string;
    overallPercentage: number;
    numberOfExaminees: number;
    highestScorers: {
      studentId: {
        _id: string,
        fullname: string
      };
      percentage: number;
      _id: string;
    }[];
    createdAt: string;
    __v: number;
  }
  
  export interface RecurringTopPerformer {
    studentName: string;
    studentId: string | null;
    occurrences: number;
    appearances: {
      examId: string;
      examTitle: string;
      percentage: number;
      academicYear: string;
      date: string;
    }[];
  }
  
  export interface PaginationState {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
    totalPages: number;
  }
  
  export interface ChartDataPoint {
    name: string;
    percentage: number;
    examinees: number;
    date?: string;
  }
  
  export interface PieChartDataPoint {
    name: string;
    value: number;
    studentId: string | null;
  }
  
  export interface ProgressionDataPoint {
    name: string;
    date: string;
    percentage: number;
    examinees: number;
  }
  
  export interface ReportData {
    yearlyPerformance: PerformanceSummary[];
    topPerformers: RecurringTopPerformer[];
    batchComparisons: any[];
    examPerformance: PerformanceDetails[];
  }
  
  export interface ExportRecordResponse {
    records: PerformanceDetails[];
    meta: {
      page: number;
      limit: number;
      total: number;
      hasNextPage: boolean;
    };
  }