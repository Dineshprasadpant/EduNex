import * as courseService from '../services/courseService.js';

export async function getAllCoursesSummary(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await courseService.getCoursesSummary(page, limit);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
}

export async function getAllCoursesFullDetails(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await courseService.getCoursesFullDetails(page, limit);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
}

export async function createCourse(req, res) {
  try {
    const courseData = req.body;
    const newCourse = await courseService.createCourse(courseData);
    
    res.status(201).json({
      status: 'success',
      data: {
        course: newCourse
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
}

export async function getCourseById(req, res) {
  try {
    const { id } = req.params;
    const result = await courseService.getCourseById(id);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
}

export async function getByDeliveryMode(req, res) {
  try {
    const {mode } = req.params;
    const {page, limit} = req.query;
    const result = await courseService.getByDeliveryMode(mode, page, limit);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
}

export async function updateCourse(req, res) {
  try {
    
    const { id } = req.params;
    const updateData = req.body;

    console.log(updateData)
    
    const updatedCourse = await courseService.updateCourse(id, updateData);
    
    res.status(200).json({
      status: 'success',
      data: {
        course: updatedCourse
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
}

export async function deleteCourse(req, res) {
  try {
    const { id } = req.params;
    await courseService.deleteCourse(id);
    
    res.status(200).json({
      status: 'success',
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
}