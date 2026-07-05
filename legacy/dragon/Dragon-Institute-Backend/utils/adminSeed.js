import * as userRepository from '../repository/userRepository.js';
import dotenv from 'dotenv';

dotenv.config();

export const seedAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const existingAdmin = await userRepository.findUserByEmail(adminEmail);
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create admin user
    const adminData = {
      fullname: process.env.ADMIN_NAME || 'System Admin',
      role: 'admin',
      email: adminEmail,
      phone: process.env.ADMIN_PHONE || '1234567890',
      password: process.env.ADMIN_PASSWORD || 'admin@123',
      plan: 'admin',
      status: 'verified' ,
      plan: 'full',
      courseEnrolled: '67d2a46fba6de65bd41351a0',
      citizenshipImageUrl: 'www.example.com'
    };
    
    const admin = await userRepository.createUser(adminData);
    console.log(`Admin user created with email: ${admin.email}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};