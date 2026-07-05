import * as courseRepository from '../repository/courseRepository.js';
import { deleteFromS3 } from './fileService.js';

export async function getCoursesSummary(page = 1, limit = 10) {
  if (page < 1 || limit < 1) {
    throw new Error('Page and limit must be positive numbers');
  }

  const result = await courseRepository.findCoursesSummary(page, limit);
  

  return result;
}

export async function getCoursesFullDetails(page = 1, limit = 10) {
  if (page < 1 || limit < 1) {
    throw new Error('Page and limit must be positive numbers');
  }

  const result = await courseRepository.findCoursesFullDetails(page, limit);
  
  if (!result.courses || result.courses.length === 0) {
    throw new Error('No courses found');
  }

  return result;
}

export async function createCourse(courseData) {
  // Validate required fields
  const requiredFields = [
    'title', 'description', 'teachersCount', 'courseHighlights', 
    'overallHours', 'moduleLeader', 'category', 'learningFormat', 
    'curriculum', 'priority', 'deliveryMode', 'image'
  ];
  
  for (const field of requiredFields) {
    if (!courseData[field]) {
      throw new Error(`${field} is required`);
    }
  }

  // Validate prices based on delivery mode
  if (courseData.deliveryMode === 'online' && !courseData.onlinePrice) {
    throw new Error('onlinePrice is required for online courses');
  }
  
  if (courseData.deliveryMode === 'offline' && !courseData.offlinePrice) {
    throw new Error('offlinePrice is required for offline courses');
  }
  
  if (courseData.deliveryMode === 'hybrid' && (!courseData.onlinePrice || !courseData.offlinePrice)) {
    throw new Error('Both onlinePrice and offlinePrice are required for hybrid courses');
  }

  // Validate schedule for offline/hybrid courses
  if (courseData.deliveryMode !== 'online' && (!courseData.schedule || courseData.schedule.length === 0)) {
    throw new Error('Schedule is required for offline/hybrid courses');
  }

  return await courseRepository.createCourse(courseData);
}

export async function updateCourse(id, updateData) {
  // Prevent modification of protected fields
  const protectedFields = ['studentsEnrolled', 'overallRating', 'reviews'];
  for (const field of protectedFields) {
    if (updateData[field] !== undefined) {
      throw new Error(`Cannot modify ${field} directly`);
    }
  }

  // Validate prices if being updated
  if (updateData.onlinePrice !== undefined && updateData.onlinePrice < 0) {
    throw new Error('onlinePrice cannot be negative');
  }
  
  if (updateData.offlinePrice !== undefined && updateData.offlinePrice < 0) {
    throw new Error('offlinePrice cannot be negative');
  }

  return await courseRepository.updateCourse(id, updateData);
}

export async function getCourseById(id) {
  const course = await courseRepository.getCourseById(id);
  
  if (!course) {
    throw new Error('Course not found');
  }
  
  return course;
}

export async function getByDeliveryMode(mode, page = 1, limit = 10) {
  if (page < 1 || limit < 1) {
    throw new Error('Page and limit must be positive numbers');
  }

  const result = await courseRepository.getByDeliveryMode(mode, page, limit);
  
  if (!result.courses || result.courses.length === 0) {
    throw new Error('No courses found');
  }

  return result;
}

export async function deleteCourse(id) {
  try {
    // First get the course to access its image URL
    const course = await getCourseById(id);
    if (!course) {
      throw new Error('Course not found');
    }

    // Delete the image from S3 if it exists
    if (course.image) {
      await deleteFromS3(course.image).catch(error => {
        console.error(`Failed to delete course image ${course.image}:`, error.message);
        // Continue with deletion even if image deletion fails
      });
    }

    // Now delete the course from database
    const deletedCourse = await courseRepository.deleteCourse(id);
    
    return deletedCourse;
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}