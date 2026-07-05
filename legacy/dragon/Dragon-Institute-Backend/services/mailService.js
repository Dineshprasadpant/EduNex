import { ses, emailConfig } from '../config/awsconfig.js';
import User from '../models/user.js';
import Subscriber from '../models/SubscriberModel.js';
import nodemailer from 'nodemailer';

// Helper function to validate email addresses
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendViaGmail = async ({ to, subject, body, isHtml = false }) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_FROM || emailConfig.fromAddress,
      to,
      subject,
      [isHtml ? 'html' : 'text']: body,
    };

    gmailTransporter.sendMail(mailOptions);
    return { success: true};
  } catch (error) {
    console.error('Gmail send error:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to send email with retry logic
// const sendEmailWithRetry = async (params, retries = 3) => {
//   for (let i = 0; i < retries; i++) {
//     try {
//       const result = await ses.sendEmail(params).promise();
//       return { success: true, messageId: result.MessageId };
//     } catch (error) {
//       if (i === retries - 1) {
//         console.log(`Failed after ${retries} attempts:`, error);
//         return { success: false, error: error.message };
//       }
//       // Exponential backoff
//       await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
//     }
//   }
// };

export const emailService = {
  async sendSingleEmail({ to, subject, body, isHtml = false }) {
    // if (!validateEmail(to)) {
    //   return { success: false, error: 'Invalid email address' };
    // }

    // const params = {
    //   Destination: { ToAddresses: [to] },
    //   Message: {
    //     Body: {
    //       // Use Html or Text based on the isHtml flag
    //       [isHtml ? 'Html' : 'Text']: { 
    //         Data: body,
    //         Charset: emailConfig.defaultCharset
    //       }
    //     },
    //     Subject: { 
    //       Data: subject,
    //       Charset: emailConfig.defaultCharset
    //     }
    //   },
    //   Source: emailConfig.fromAddress
    // };

    // try {
    //   if (emailConfig.sandboxMode) {
    //     const verifiedEmails = await ses.listVerifiedEmailAddresses().promise();
    //     if (!verifiedEmails.VerifiedEmailAddresses.includes(to)) {
    //       return { 
    //         success: false, 
    //         error: 'Recipient email not verified in sandbox mode' 
    //       };
    //     }
    //   }

    
    //   return await sendEmailWithRetry(params);
    try{
    return { 
            success: true, 
    };
    } catch(error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  },

  // async getRecipients({ target, batchId }) {
  //   try {
  //     let recipients = [];
  //     const emailOnlyProjection = { email: 1, _id: 0 };

  //     // Use parallel queries when possible
  //     const queries = [];
      
  //     if (target === 'subscribers' || target === 'all') {
  //       queries.push(Subscriber.find({}, emailOnlyProjection).lean().exec());
  //     }

  //     if (target === 'batch' || target === 'all') {
  //       const query = batchId ? { batch: batchId } : {};
  //       queries.push(User.find(query, emailOnlyProjection).lean().exec());
  //     }

  //     if (target === 'teachers' || target === 'all') {
  //       queries.push(User.find({ role: 'teacher' }, emailOnlyProjection).lean().exec());
  //     }

  //     const results = await Promise.all(queries);
      
  //     // Process results based on query order
  //     if (target === 'subscribers' || target === 'all') {
  //       recipients.push(...results[0].map(s => s.email));
  //     }
      
  //     if (target === 'batch' || target === 'all') {
  //       const userIndex = target === 'all' ? 1 : 0;
  //       recipients.push(...results[userIndex].map(u => u.email));
  //     }

  //     if (target === 'teachers' || target === 'all') {
  //       const teacherIndex = target === 'all' ? 2 : (target === 'batch' ? 1 : 0);
  //       recipients.push(...results[teacherIndex].map(t => t.email));
  //     }

  //     // Deduplicate and filter valid emails
  //     return [...new Set(recipients)].filter(validateEmail);
  //   } catch (error) {
  //     console.error('Error fetching recipients:', error);
  //     return [];
  //   }
  // },

  async sendBulkEmails({ target, batchId, subject, body, isHtml = false }) {
    try {
      // const recipients = await this.getRecipients({ target, batchId });
      
      // if (recipients.length === 0) {
      //   return { success: false, error: 'No valid recipients found' };
      // }

      // // For smaller batches, process immediately
      // const sendPromises = recipients.map(to => {
      //   const params = {
      //     Destination: { ToAddresses: [to] },
      //     Message: {
      //       Body: {
      //         [isHtml ? 'Html' : 'Text']: { 
      //           Data: body, 
      //           Charset: emailConfig.defaultCharset 
      //         }
      //       },
      //       Subject: { 
      //         Data: subject, 
      //         Charset: emailConfig.defaultCharset 
      //       }
      //     },
      //     Source: emailConfig.fromAddress
      //   };
      //   return sendEmailWithRetry(params);
      // });

      // const results = await Promise.all(sendPromises);
      // const sentCount = results.filter(r => r.success).length;
      // const failedCount = results.length - sentCount;
      // console.log(`Sent ${sentCount} emails (${failedCount} failed)`)
      // return {
      //   success: true,
      //   message: `Sent ${sentCount} emails (${failedCount} failed)`,
      //   sentCount,
      //   failedCount,
      //   details: results
      // };
       return {
        success: true,
      };
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      return { 
        success: false, 
        error: error.message,
        details: error 
      };
    }
  },

  // async verifyEmail(email) {
  //   try {
  //     await ses.verifyEmailIdentity({ EmailAddress: email }).promise();
  //     return { success: true, message: 'Verification email sent' };
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // }
};