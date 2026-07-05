// apiCalls.ts
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const getToken = () => {
  return Cookies.get("token");
};

const getHeaders = () => {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
  };
};

interface FetchExamsParams {
  batch: string;
  id: string;
  page?: number;
  limit?: number;
  status: 'current' | 'upComming';
}

interface Exam {
  _id: string;
  exam_id: string;
  title: string;
  description: string;
  exam_name: string;
  startDateTime: string;
  endDateTime: string;
  total_marks: number;
  pass_marks: number;
  question_sheet_id?: string;
  batches: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  status?: string;
  duration: number;
  negativeMarking: boolean;
  negativeMarkingNumber: Number;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface FetchExamsResponse {
  success: boolean;
  data: Exam[];
  pagination: PaginationData;
}

export const fetchExams = async ({
  batch,
  id,
  page = 1,
  limit = 10,
  status
}: FetchExamsParams): Promise<FetchExamsResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      userId: id,
      status: status
    });

    const response = await fetch(`${BASE_URL}/exams/batch/${batch}?${params}`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching exams:", error);
    throw error;
  }
};

interface Question {
  question: string;
  marks: number;
  answers: string[];
  _id: string;
}

interface QuestionSheet {
  _id: string;
  sheetName: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  negativeMarkingNumber: Number;
  __v: number;
}

interface FetchQuestionSheetResponse {
  success: boolean;
  data: QuestionSheet;
}

export const fetchQuestionSheet = async (questionSheetId: string): Promise<FetchQuestionSheetResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/questionsheets/${questionSheetId}`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching question sheet:', error);
    throw error;
  }
};

interface SubmitExamResponse {
  success: boolean;
  data: {
    _id: string;
    sheetName: string;
    questions: {
      correctAnswer: string;
      _id: string;
    }[];
  };
}

export const submitExamAnswers = async (
  questionSheetId: string,
): Promise<SubmitExamResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/questionsheets/${questionSheetId}?answer=0`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting answers:', error);
    throw error;
  }
};

interface ExamResult {
  totalQuestions: number;
  correctAnswersCount: number;
  totalMarksObtained: number;
  totalPossibleMarks: number;
  percentage: number;
  examName: string | undefined;
  unAnsweredQuestions: number;
  answers: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    marksObtained: number;
    marksDeducted: number;
  }[];
}

export const submitExamResult = async (
  examId: string,
  result: ExamResult
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${BASE_URL}/questionsheets/${examId}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ result })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
    
  } catch (error) {
    console.error('Error submitting exam result:', error);
    throw error;
  }
};