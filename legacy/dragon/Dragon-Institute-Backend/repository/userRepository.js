import User from '../models/user.js';

// Create a new user
export const createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};


export const getUserInformation = async (userId) => {
  const user = await User.findById(userId)
  .select("-__v -password -createdAt -batch")
  .populate({
    path: "courseEnrolled",
    select: "title", 
  })
  return user
}
export const updateUserPlanAndPayment = async (userId, paymentImage, plan, planUpgradedFrom) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      $push: {
        paymentImage: [paymentImage] 
      },
      $set: {
        plan,
        planUpgradedFrom,
        status: 'unverified'
      }
    },
    { new: true, runValidators: true }
  ).select('-password -__v'); 
};


// Find user by ID
export const findUserById = async (id) => {
  return await User.findById(id);
};

// Find user by email
export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

// Update user status
export const updateUserStatus = async (userId, batchId, status) => {
  return await User.findByIdAndUpdate(
    userId,
    { batch: batchId,
      status },
    { new: true }
  ).select('-password');
};


export const addExamResults = async (userId, examData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.examsAttended.push({
    examId: examData.examId,
    examName: examData.examName,
    totalQuestions: examData.totalQuestions,
    correctAnswers: examData.correctAnswers,
    totalMarksObtained: examData.totalMarksObtained,
    totalMarks: examData.totalMarks,
    unAnsweredQuestions: examData.unAnsweredQuestions,
  });

  await user.save();
};

// Get unverified users
export const findUnverifiedUsers = async () => {
  return await User.find({ 
    status: 'unverified',
    role: 'user'
  }).select('-password').populate({
    path: "batch",
    select: 'batch_name _id',
  }).populate({
    path: "courseEnrolled",
    select: 'title _id',
  });
};

// Get verified users
export const findVerifiedUsers = async () => {
  return await User.find({ 
    status: 'verified'
  }).select('-password').populate({
    path: "batch",
    select: 'batch_name _id',
  }).populate({
    path: "courseEnrolled",
    select: 'title _id',
  });
};

// Update user by ID
export const updateUserById = async (userId, updateData) => {
  return await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true }
  ).select('-password');
};

// Delete user by ID
export const deleteUserById = async (userId) => {
  return await User.findByIdAndDelete(userId);
};

// Update user password
export const updateUserPassword = async (userId, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  user.password = newPassword;
  await user.save();
  return user;
};

export const searchUsersByFullname = async (searchTerm, { page = 1, limit = 10 } = {}) => {
  return await User.searchByFullname(searchTerm, { page, limit });
};