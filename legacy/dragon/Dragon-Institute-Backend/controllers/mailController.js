import { emailService } from "../services/mailService.js";
import dotenv from 'dotenv';

dotenv.config();

export const emailController = {
  async sendSingle(req, res) {
    const { name, email, subject, phone, message} = req.body.formData;
    
    
    try {
      const newSubject =  `Got a query mail from ${name} from mail ${email} having contact number ${phone} regarding: ${subject}`
      const result = await emailService.sendSingleEmail({ to: process.env.ADMIN_EMAIL , subject, body:newSubject });
      
      if (result.success) {
        res.json({ 
          success: true,
          message: 'Email sent successfully', 
          messageId: result.messageId 
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: result.error 
        });
      }
    } catch (error) {
      console.error('Controller error in sendSingle:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  },
  
  async sendBulk(req, res) {
    const { target, batchId, subject, body } = req.body;
    
    if (!target || !subject || !body) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: target, subject, body' 
      });
    }
    
    if (target === 'batch' && !batchId) {
      return res.status(400).json({ 
        success: false,
        error: 'batchId is required when target is batch' 
      });
    }
    
    if (!['batch', 'subscribers', 'teachers', 'all'].includes(target)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid target. Must be one of: batch, subscribers, teachers, all' 
      });
    }
    
    try {
      const result = await emailService.sendBulkEmails({ 
        target, 
        batchId, 
        subject, 
        body 
      });
      
      if (result.success) {
        res.json({ 
          success: true,
          message: result.message,
          ...(result.sentCount !== undefined && {
            sentCount: result.sentCount,
            failedCount: result.failedCount
          }),
          ...(result.totalRecipients !== undefined && {
            totalRecipients: result.totalRecipients
          })
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Controller error in sendBulk:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  },

  async verifyEmail(req, res) {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required field: email' 
      });
    }
    
    try {
      const result = await emailService.verifyEmail(email);
      
      if (result.success) {
        res.json({ 
          success: true,
          message: result.message
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: result.error 
        });
      }
    } catch (error) {
      console.error('Controller error in verifyEmail:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  }
};