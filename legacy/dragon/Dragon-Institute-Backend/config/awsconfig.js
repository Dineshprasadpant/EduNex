import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS
AWS.config.update({
  region: process.env.AMAZONWS_REGION || 'us-east-1',
  accessKeyId: process.env.AMAZONWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AMAZONWS_SECRET_ACCESS_KEY
});

// SES Configuration
const sesConfig = {
  apiVersion: '2010-12-01',
  sandboxMode: process.env.AWS_SES_SANDBOX 
};

// SQS Configuration
const sqsConfig = {
  apiVersion: '2012-11-05'
};

export const ses = new AWS.SES(sesConfig);
export const sqs = new AWS.SQS(sqsConfig);

// Email configuration
export const emailConfig = {
    fromAddress: process.env.EMAIL_FROM_ADDRESS,
    sandboxMode: process.env.SES_SANDBOX_MODE === 'true',
    concurrencyLimit: parseInt(process.env.SES_CONCURRENCY_LIMIT) || 10,
    defaultCharset: 'UTF-8'
  };