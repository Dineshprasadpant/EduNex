import * as userRepository from '../repository/userRepository.js';
import { emailService } from '../services/mailService.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { recordEnrollment } from '../controllers/userAnalyticsController.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
import {incrementStudentsEnrolled} from "../repository/courseRepository.js"
import { sendViaGmail } from '../services/mailService.js';
import { deleteFromS3 } from './fileService.js';

dotenv.config();

// Configure Handlebar s
handlebars.noConflict();
const { compile } = handlebars;

// Get template path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePath = path.join(__dirname, '../verificationConfirmationTemplate.html');

const adminNotificationPath = path.join(__dirname, '../newUserNotificationTemplate.html');

// Read and compile admin notification template
let adminNotificationTemplate;
try {
  const templateContent = fs.readFileSync(adminNotificationPath, 'utf8');
  adminNotificationTemplate = compile(templateContent, {
    noEscape: true,
    strict: true,
    preventIndent: true,
    allowProtoMethodsByDefault: true,
    allowProtoPropertiesByDefault: true
  });
} catch (err) {
  console.error('Error loading admin notification template:', err);
  throw new Error('Failed to load admin notification template');
}

// Read and compile template
let verificationTemplate;
try {
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  verificationTemplate = compile(templateContent, {
    noEscape: true,
    strict: true,
    preventIndent: true,
    allowProtoMethodsByDefault: true,
    allowProtoPropertiesByDefault: true
  });
} catch (err) {
  console.error('Error loading verification template:', err);
  throw new Error('Failed to load verification template');
}

dotenv.config();

export const searchUsers = async (searchTerm, pagination) => {
  // Validation
  if (!searchTerm?.trim()) {
    throw new Error('Search term cannot be empty');
  }

  if (searchTerm.trim().length < 2) {
    throw new Error('Search term must be at least 2 characters');
  }

  // Execute  search
  return await userRepository.searchUsersByFullname(searchTerm, pagination);
};

export const getUserInformation = async (userId) => {
  try {
    const users = await userRepository.getUserInformation(userId);
    return {
      success: true,
      users
    };
  } catch (error) {
    throw error;
  }
};
// Register a new user 
export const registerUser = async (userData) => {
  try {
    userData.status = 'unverified';
    const user = await userRepository.createUser(userData);
    
    // Send notification email to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const emailContent = adminNotificationTemplate({
          fullname: user.fullname,
          email: user.email,
          phone: user.phone || 'Not provided',
          plan: user.plan || 'Not specified',
          courseEnrolled: user.courseEnrolled || 'Not enrolled yet',
          registrationDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          adminDashboardUrl: process.env.ADMIN_DASHBOARD_URL || process.env.FRONTEND_URL,
          currentYear: new Date().getFullYear()
        });

        // Send in background (fire-and-forget)
         sendViaGmail({
          to: adminEmail,
          subject: `New User Registration: ${user.fullname}`,
          body: emailContent,
          isHtml: true
        }).catch(err => {
          console.error('Background email error:', err);
        });
      }
    } catch (emailError) {
      console.error('Error preparing admin notification:', emailError);
    }

    return {
      success: true,
      message: 'User registered successfully',
      userId: user._id
    };
  } catch (error) {
    throw error;
  }
};

// Verify user (admin only)
export const verifyUser = async (userId, batchId, currentUser) => {
  try {
    if (currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only admin can verify users');
    }

    const updatedUser = await userRepository.updateUserStatus(userId, batchId, 'verified');
    if (!updatedUser) {
      throw new Error('User not found');
    }
    const plan = updatedUser.plan;

    await recordEnrollment(plan);

    await incrementStudentsEnrolled(updatedUser.courseEnrolled)

    // Send verification confirmation email
    try {
      const emailContent = verificationTemplate({
        fullname: updatedUser.fullname,
        email: updatedUser.email,
        loginUrl: `${process.env.FRONTEND_URL}/login`, // Replace with your actual login URL
        currentYear: new Date().getFullYear()
      });
      sendViaGmail({
        to: updatedUser.email,
        subject: 'Your Account Has Been Verified',
        body: emailContent,
        isHtml: true
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't throw error - verification succeeded even if email failed
    }

    return {
      success: true,
      message: 'User verified successfully',
      user: {
        id: updatedUser._id,
        fullname: updatedUser.fullname,
        email: updatedUser.email,
        status: updatedUser.status
      }
    };
  } catch (error) {
    throw error;
  }
};

export const updateUserPlanService = async (userId, paymentImage, plan, planUpgradedFrom) => {
  // Validate input
  if (!paymentImage || !plan ||!planUpgradedFrom) {
    throw new Error('Payment image and plan are required');
  }

  const validPlans = ['full', 'half', 'free'];
  if (!validPlans.includes(plan)) {
    throw new Error('Invalid plan specified');
  }

  // Check if user exists
  const existingUser = await userRepository.findUserById(userId);
  if (!existingUser) {
    throw new Error('User not found');
  }

  // Update user
  const updatedUser = await userRepository.updateUserPlanAndPayment(userId, paymentImage, plan, planUpgradedFrom);
  return updatedUser;
};

// User login
export const loginUser = async (email, password) => {
  try {
    const user = await userRepository.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    if (user.status !== 'verified') {
      throw new Error('Account not verified yet');
    }

    const token = jwt.sign(
      {
        id: user._id,
        // email: user.email,
        role: user.role,
        plan: user.plan,
        // courseEnrolled: user.courseEnrolled 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return {
      success: true,
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        batch: user.batch,
        plan: user.plan
      }
    };
  } catch (error) {
    throw error;
  }
};

// Get unverified users (admin only)
export const getUnverifiedUsers = async (currentUser) => {
  try {
    if (currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only admin can access this resource');
    }

    const users = await userRepository.findUnverifiedUsers();
    return {
      success: true,
      count: users.length,
      users
    };
  } catch (error) {
    throw error;
  }
};

// Get verified users (admin only)
export const getVerifiedUsers = async (currentUser) => {
  try {
    if (currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only admin can access this resource');
    }

    const users = await userRepository.findVerifiedUsers();
    return {
      success: true,
      count: users.length,
      users
    };
  } catch (error) {
    throw error;
  }
};

// Update user (admin only)
export const updateUser = async (userId, updateData, currentUser) => {
  try {
    if (currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only admin can update users');
    }

    // Remove sensitive fields that shouldn't be updated here
    delete updateData.password;
    delete updateData.role;

    const updatedUser = await userRepository.updateUserById(userId, updateData);
    if (!updatedUser) {
      throw new Error('User not found');
    }

    return {
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    };
  } catch (error) {
    throw error;
  }
};

// Delete user (admin only)
export const deleteUser = async (userId, currentUser) => {
  try {
    if (currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only admin can delete users');
    }

    // First get the user to access their payment images
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Delete payment images from S3 if they exist
    if (user.paymentImage && user.paymentImage.length > 0) {
      // Flatten the 2D array and filter out empty values
      const allPaymentImages = user.paymentImage.flat().filter(url => url && url.trim() !== '');
      
      // Delete each image from S3
      await Promise.all(
        allPaymentImages.map(imageUrl => 
          deleteFromS3(imageUrl).catch(error => {
            console.error(`Failed to delete image ${imageUrl}:`, error.message);
            // Continue with other deletions even if one fails
          })
        )
      );
    }

    // Delete citizenship image if it exists
    if (user.citizenshipImageUrl) {
      await deleteFromS3(user.citizenshipImageUrl).catch(error => {
        console.error('Failed to delete citizenship image:', error.message);
      });
    }

    // Now delete the user from database
    const deletedUser = await userRepository.deleteUserById(userId);

    return {
      success: true,
      message: 'User and associated files deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Reset user password (admin only)
export const resetUserPassword = async (userId, newPassword, currentUser) => {
  try {
    if (currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only admin can reset passwords');
    }
    
    const updatedUser = await userRepository.updateUserPassword(userId, newPassword);
    if (!updatedUser) {
      throw new Error('User not found');
    }

    return {
      success: true,
      message: 'Password reset successfully',
      userId: updatedUser._id
    };
  } catch (error) {
    throw error;
  }
};

// Verify JWT token
export const verifyToken = async (token) => {
  try {
    if (!token) {
      throw new Error('No token provided');
    }
    
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

export const basicVerification  = async (token) => {
  try {
    if (!token) {
      throw new Error('No token provided');
    }
    
    return jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
  } catch (error) {
    throw error;
  }
};
export const registerTeacher = async (teacherData) => {
  try {
    // Check if teacher already exists
    const existingTeacher = await userRepository.findUserByEmail(teacherData.email);
    if (existingTeacher) {
      throw new Error('Teacher with this email already exists');
    }

    // Create teacher object
    const teacher = {
      ...teacherData,
      role: 'teacher',
      status: 'verified', 
      password: teacherData.password,
    };

    return await userRepository.createUser(teacher);
  } catch (error) {
    throw error;
  }
};
