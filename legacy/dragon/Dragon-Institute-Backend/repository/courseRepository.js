import Course from '../models/course.js';

export async function getByDeliveryMode(mode, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  // Count documents by priority
  const [highCount, mediumCount, lowCount] = await Promise.all([
    Course.countDocuments({ priority: 'high' , deliveryMode: mode}),
    Course.countDocuments({ priority: 'medium' , deliveryMode: mode}),
    Course.countDocuments({ priority: 'low', deliveryMode: mode })
  ]);

  // Calculate how many to take from each priority
  let highToTake = 0;
  let mediumToTake = 0;
  let lowToTake = 0;
  let remaining = limit;
  let remainingSkip = skip;

  // First allocate to high priority
  const availableHigh = highCount - remainingSkip;
  if (availableHigh > 0) {
    highToTake = Math.min(availableHigh, remaining);
    remaining -= highToTake;
    remainingSkip = Math.max(0, remainingSkip - highCount);
  } else {
    remainingSkip -= highCount;
  }

  // Then allocate to medium priority if needed
  if (remaining > 0 && remainingSkip >= 0) {
    const availableMedium = mediumCount - remainingSkip;
    if (availableMedium > 0) {
      mediumToTake = Math.min(availableMedium, remaining);
      remaining -= mediumToTake;
      remainingSkip = Math.max(0, remainingSkip - mediumCount);
    } else {
      remainingSkip -= mediumCount;
    }
  }

  // Finally allocate to low priority if needed
  if (remaining > 0 && remainingSkip >= 0) {
    const availableLow = lowCount - remainingSkip;
    if (availableLow > 0) {
      lowToTake = Math.min(availableLow, remaining);
    }
  }

  // Fetch courses from each priority
  const highCourses = highToTake > 0 ? await Course.find({ priority: 'high' , deliveryMode: mode})
    .select('title category studentsEnrolled moduleLeader overallHours price teachersCount image priority deliveryMode onlinePrice offlinePrice')
    .sort({ createdAt: -1 })
    .skip(skip > highCount ? highCount : skip)
    .limit(highToTake)
    .lean() : [];

  const mediumCourses = mediumToTake > 0 ? await Course.find({ priority: 'medium', deliveryMode: mode })
    .select('title category studentsEnrolled moduleLeader overallHours price teachersCount image priority deliveryMode onlinePrice offlinePrice')
    .sort({ createdAt: -1 })
    .skip(Math.max(0, skip - highCount))
    .limit(mediumToTake)
    .lean() : [];

  const lowCourses = lowToTake > 0 ? await Course.find({ priority: 'low', deliveryMode: mode })
    .select('title category studentsEnrolled moduleLeader overallHours price teachersCount image priority deliveryMode onlinePrice offlinePrice')
    .sort({ createdAt: -1 })
    .skip(Math.max(0, skip - highCount - mediumCount))
    .limit(lowToTake)
    .lean() : [];

  // Combine all courses
  const courses = [...highCourses, ...mediumCourses, ...lowCourses];
  
  // Calculate total count for pagination
  const totalCount = highCount + mediumCount + lowCount;
  
  return {
    courses: courses.map(course => ({
      ...course,
      price: course.deliveryMode === 'hybrid' 
        ? Math.min(course.onlinePrice || 0, course.offlinePrice || 0)
        : course.price
    })),
    pagination: {
      currentPage: parseInt(page),
      itemsPerPage: limit,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      hasPreviousPage: page > 1
    }
  };
}
export async function findCoursesSummary(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  // Count documents by priority
  const [highCount, mediumCount, lowCount] = await Promise.all([
    Course.countDocuments({ priority: 'high' }),
    Course.countDocuments({ priority: 'medium' }),
    Course.countDocuments({ priority: 'low' })
  ]);

  // Calculate how many to take from each priority
  let highToTake = 0;
  let mediumToTake = 0;
  let lowToTake = 0;
  let remaining = limit;
  let remainingSkip = skip;

  // First allocate to high priority
  const availableHigh = highCount - remainingSkip;
  if (availableHigh > 0) {
    highToTake = Math.min(availableHigh, remaining);
    remaining -= highToTake;
    remainingSkip = Math.max(0, remainingSkip - highCount);
  } else {
    remainingSkip -= highCount;
  }

  // Then allocate to medium priority if needed
  if (remaining > 0 && remainingSkip >= 0) {
    const availableMedium = mediumCount - remainingSkip;
    if (availableMedium > 0) {
      mediumToTake = Math.min(availableMedium, remaining);
      remaining -= mediumToTake;
      remainingSkip = Math.max(0, remainingSkip - mediumCount);
    } else {
      remainingSkip -= mediumCount;
    }
  }

  // Finally allocate to low priority if needed
  if (remaining > 0 && remainingSkip >= 0) {
    const availableLow = lowCount - remainingSkip;
    if (availableLow > 0) {
      lowToTake = Math.min(availableLow, remaining);
    }
  }

  // Fetch courses from each priority
  const highCourses = highToTake > 0 ? await Course.find({ priority: 'high' })
    .select('title category studentsEnrolled moduleLeader overallHours price teachersCount image priority deliveryMode onlinePrice offlinePrice')
    .sort({ createdAt: -1 })
    .skip(skip > highCount ? highCount : skip)
    .limit(highToTake)
    .lean() : [];

  const mediumCourses = mediumToTake > 0 ? await Course.find({ priority: 'medium' })
    .select('title category studentsEnrolled moduleLeader overallHours price teachersCount image priority deliveryMode onlinePrice offlinePrice')
    .sort({ createdAt: -1 })
    .skip(Math.max(0, skip - highCount))
    .limit(mediumToTake)
    .lean() : [];

  const lowCourses = lowToTake > 0 ? await Course.find({ priority: 'low' })
    .select('title category studentsEnrolled moduleLeader overallHours price teachersCount image priority deliveryMode onlinePrice offlinePrice')
    .sort({ createdAt: -1 })
    .skip(Math.max(0, skip - highCount - mediumCount))
    .limit(lowToTake)
    .lean() : [];

  // Combine all courses
  const courses = [...highCourses, ...mediumCourses, ...lowCourses];
  
  // Calculate total count for pagination
  const totalCount = highCount + mediumCount + lowCount;
  
  return {
    courses: courses.map(course => ({
      ...course,
      price: course.deliveryMode === 'hybrid' 
        ? Math.min(course.onlinePrice || 0, course.offlinePrice || 0)
        : course.price
    })),
    pagination: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      hasPreviousPage: page > 1
    }
  };
}

export const incrementStudentsEnrolled = async (courseId) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { $inc: { studentsEnrolled: 1 } }, 
      { new: true } 
    );

    if (!updatedCourse) {
      throw new Error('Course not found');
    }

    return updatedCourse;
  } catch (error) {
    throw error;
  }
};

export async function findCoursesFullDetails(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  // Count documents by priority
  const [highCount, mediumCount, lowCount] = await Promise.all([
    Course.countDocuments({ priority: 'high' }),
    Course.countDocuments({ priority: 'medium' }),
    Course.countDocuments({ priority: 'low' })
  ]);

  // Calculate how many to take from each priority
  let highToTake = 0;
  let mediumToTake = 0;
  let lowToTake = 0;
  let remaining = limit;
  let remainingSkip = skip;

  // First allocate to high priority
  const availableHigh = highCount - remainingSkip;
  if (availableHigh > 0) {
    highToTake = Math.min(availableHigh, remaining);
    remaining -= highToTake;
    remainingSkip = Math.max(0, remainingSkip - highCount);
  } else {
    remainingSkip -= highCount;
  }

  // Then allocate to medium priority if needed
  if (remaining > 0 && remainingSkip >= 0) {
    const availableMedium = mediumCount - remainingSkip;
    if (availableMedium > 0) {
      mediumToTake = Math.min(availableMedium, remaining);
      remaining -= mediumToTake;
      remainingSkip = Math.max(0, remainingSkip - mediumCount);
    } else {
      remainingSkip -= mediumCount;
    }
  }

  // Finally allocate to low priority if needed
  if (remaining > 0 && remainingSkip >= 0) {
    const availableLow = lowCount - remainingSkip;
    if (availableLow > 0) {
      lowToTake = Math.min(availableLow, remaining);
    }
  }

  // Fetch courses from each priority
  const highCourses = highToTake > 0 ? await Course.find({ priority: 'high' })
    .sort({ createdAt: -1 })
    .skip(skip > highCount ? highCount : skip)
    .limit(highToTake)
    .lean() : [];

  const mediumCourses = mediumToTake > 0 ? await Course.find({ priority: 'medium' })
    .sort({ createdAt: -1 })
    .skip(Math.max(0, skip - highCount))
    .limit(mediumToTake)
    .lean() : [];

  const lowCourses = lowToTake > 0 ? await Course.find({ priority: 'low' })
    .sort({ createdAt: -1 })
    .skip(Math.max(0, skip - highCount - mediumCount))
    .limit(lowToTake)
    .lean() : [];

  // Combine all courses
  const courses = [...highCourses, ...mediumCourses, ...lowCourses];
  
  // Calculate total count for pagination
  const totalCount = highCount + mediumCount + lowCount;
  
  return {
    courses: courses.map(course => ({
      ...course,
      price: course.deliveryMode === 'hybrid' 
        ? Math.min(course.onlinePrice || 0, course.offlinePrice || 0)
        : course.price
    })),
    pagination: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      hasPreviousPage: page > 1
    }
  };
}


export async function createCourse(courseData) {
  return await Course.create(courseData);
}

export async function updateCourse(id, updateData) {
  return await Course.findByIdAndUpdate(
    id, 
    updateData, 
    { new: true, runValidators: true }
  );
}

export async function deleteCourse(id) {
  return await Course.findByIdAndDelete(id);
}

export async function getCourseById(id) {
  return await Course.findById(id);
}