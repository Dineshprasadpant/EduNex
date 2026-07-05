import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const token = Cookies.get("token");

export interface Question {
    question: string;
    correctAnswer: string;
    answers: string[];
    marks?: number;
}

export interface QuestionSheet {
    sheetName: string;
    questions: Question[];
}

export const createQuestionSheet = async (sheetData: QuestionSheet) => {
    const response = await fetch(`${API_URL}/questionsheets`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sheetData),
    });

    if (!response.ok) {
        throw new Error("Failed to create question sheet");
    }

    return response.json();
};

