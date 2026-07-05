import * as userService from '../services/userService.js';
import { uploadToS3 } from '../services/fileService.js';
import { ErrorResponse } from '../utils/ErrorHandling/errrorResponse.js';
// Register a new user
export const register = async (req, res) => {
  try {
    const { fullname, role, email, phone, password, plan, courseEnrolled } = req.body;
    
    if (!fullname || !role || !email || !phone || !password || !plan || !courseEnrolled) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // File validation constants
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_MIME_TYPE = 'image/png';

    // Check if files were uploaded
    if (!req.files || !req.files.citizenship) {
      return res.status(400).json({
        success: false,
        message: 'Citizenship document is required'
      });
    }

    // Validate citizenship document
    const citizenshipFile = req.files.citizenship[0];
    if (citizenshipFile.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'Citizenship document must be less than 5MB'
      });
    }
    if (citizenshipFile.mimetype !== ALLOWED_MIME_TYPE) {
      return res.status(400).json({
        success: false,
        message: 'Citizenship document must be a PNG file'
      });
    }

    // Upload citizenship document
    const citizenshipUploadResult = await uploadToS3(citizenshipFile);
    const citizenshipImageUrl = citizenshipUploadResult.data.url;

    // Upload payment receipt if it exists (for paid plans)
    let paymentImageUrl = null;
    if (req.files.paymentReceipt) {
      const paymentFile = req.files.paymentReceipt[0];
      
      // Validate payment receipt
      if (paymentFile.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          message: 'Payment receipt must be less than 5MB'
        });
      }
      if (paymentFile.mimetype !== ALLOWED_MIME_TYPE) {
        return res.status(400).json({
          success: false,
          message: 'Payment receipt must be a PNG file'
        });
      }

      const paymentUploadResult = await uploadToS3(paymentFile);
      paymentImageUrl = paymentUploadResult.data.url;
    }

    const result = await userService.registerUser({
      fullname,
      role,
      email,
      phone,
      password,
      citizenshipImageUrl,
      plan,
      paymentImage: paymentImageUrl ? [paymentImageUrl] : [],
      courseEnrolled,
      platformPreference: req.body.platformPreference || "asPerCourse"
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already registered' 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getUserInformation = async(req, res)=> {
  try {
    const {userId} = req.params;
    const result = await userService.getUserInformation(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching verified users:', error);
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ 
        success: false, 
        message: error.message 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error fetching verified users' 
    });
  }
  
}

export const searchUsersByFullname = async (req, res) => {
  try {
    const { name: searchTerm } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await userService.searchUsers(searchTerm, { page, limit });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    const statusCode = error.message.includes('cannot be empty') || 
                      error.message.includes('at least 2 characters') 
                      ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// Verify user status (admin only)
export const verifyUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const {batchId} = req.params;
    console.log(batchId)
    const result = await userService.verifyUser(userId, batchId, req.user);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Verification error:', error);
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    if (error.message.includes('User not found')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Error verifying user' 
    });
  }
};

// User login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const result = await userService.loginUser(email, password);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message.includes('Invalid email or password') || 
        error.message.includes('Account not verified')) {
      return res.status(401).json({ 
        success: false, 
        message: error.message 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Error during login' 
    });
  }
};

// Get unverified users (admin only)
export const getUnverifiedUsers = async (req, res) => {
  try {
    const result = await userService.getUnverifiedUsers(req.user);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching unverified users:', error);
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ 
        success: false, 
        message: error.message 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error fetching unverified users' 
    });
  }
};

// Get verified users (admin only)
export const getVerifiedUsers = async (req, res) => {
  try {
    const result = await userService.getVerifiedUsers(req.user);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching verified users:', error);
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ 
        success: false, 
        message: error.message 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error fetching verified users' 
    });
  }
};

// Update user (admin only)
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await userService.updateUser(userId, req.body, req.user);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.message.includes('Unauthorized') || 
        error.message.includes('User not found')) {
      const status = error.message.includes('Unauthorized') ? 403 : 404;
      return res.status(status).json({ 
        success: false, 
        message: error.message 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error updating user' 
    });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await userService.deleteUser(userId, req.user);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error deleting user:', error);
    
    if (error.message.includes('Unauthorized') || 
        error.message.includes('User not found')) {
      const status = error.message.includes('Unauthorized') ? 403 : 404;
      return res.status(status).json({ 
        success: false, 
        message: error.message 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error deleting user' 
    });
  }
};

// Reset user password (admin only)
export const resetPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    const result = await userService.resetUserPassword(userId, newPassword, req.user);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error resetting password:', error);
    
    if (error.message.includes('Unauthorized') || 
        error.message.includes('User not found')) {
      const status = error.message.includes('Unauthorized') ? 403 : 404;
      return res.status(status).json({ 
        success: false, 
        message: error.message 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error resetting password' 
    });
  }
};

export const updateUserPlan = async (req, res, next) => {
  try {
    const { paymentImage, plan, planUpgradedFrom } = req.body;
    const userId = req.params.id;

    // Validate that only allowed fields are present
    const allowedFields = ['paymentImage', 'plan', 'planUpgradedFrom'];
    const receivedFields = Object.keys(req.body);
    const invalidFields = receivedFields.filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      return next(new ErrorResponse(`Invalid fields: ${invalidFields.join(', ')}`, 400));
    }

    const updatedUser = await userService.updateUserPlanService(userId, paymentImage, plan, planUpgradedFrom);
    if(updatedUser){
    res.status(200).json({
      success: true,
      message: "Plan Changed Sucessfully"
    });
  } else{
    return next(new ErrorResponse(`Cannot Update the plan`, 400));
  }

  } catch (error) {
    next(error);
  }
};

export const registerTeacherController = async (req, res) => {
  try {
    const { fullname, email, phone, password, courseEnrolled, citizenshipImageUrl, plan } = req.body;

    // Basic validation
    if (!fullname || !email || !phone || !password || !courseEnrolled || !citizenshipImageUrl || !plan) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const teacherData = {
      fullname,
      email,
      phone,
      password,
      courseEnrolled,
      citizenshipImageUrl,
      plan
    };

    const teacher = await userService.registerTeacher(teacherData);

if(teacher){
    res.status(201).json({
      message: 'Teacher registered successfully',
    });
  } else {
    res.status(500).json({
      message: 'Cannot Register Teacher',
    });
  }
  } catch (error) {
    res.status(400).json({ 
      message: error.message || 'Error registering teacher',
      error: error.message 
    });
  }
};