import * as examService from '../services/examService.js';
import { handleError } from '../utils/errorHandler.js';

export const createExam = async (req, res) => {
    try {
        const exam = await examService.createExam(req.body);
        res.status(201).json({ success: true, data: exam });
    } catch (err) {
        handleError(err, res);
    }
};

export const getExamsByIds = async (req, res) => {
    try {
        const { examIds } = req.body;
        const exams = await examService.getExamsByIds(examIds);
        res.json({ success: true, data: exams });
    } catch (err) {
        handleError(err, res);
    }
};

export const getExamsByBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { userId } = req.query;
        const {status} = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const result = await examService.getExamsByBatch(batchId, page, limit, userId, status);
        res.json({ 
            success: true, 
            data: result.exams,
            pagination: result.pagination
        });
    } catch (err) {
        handleError(err, res);
    }
};

export const getPaginatedExams = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const result = await examService.getPaginatedExams(page, limit);
        res.json({ 
            success: true, 
            data: result.exams,
            pagination: result.pagination
        });
    } catch (err) {
        handleError(err, res);
    }
};

export const updateExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const updateData = req.body;
        
        const updatedExam = await examService.updateExam(examId, updateData);
        res.json({ success: true, data: updatedExam });
    } catch (err) {
        handleError(err, res);
    }
};

export const deleteExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const deletedExam = await examService.deleteExam(examId);
        res.json({ success: true, data: deletedExam });
    } catch (err) {
        handleError(err, res);
    }
};