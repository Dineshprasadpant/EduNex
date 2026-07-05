import express from 'express';
import { emailController } from "../controllers/mailController.js";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// Cloudflare Turnstile verification middleware
const verifyCaptcha = async (req, res, next) => {
  const { captchaToken } = req.body;
  
  if (!captchaToken) {
    return res.status(400).json({ 
      success: false,
      error: 'Captcha token is required' 
    });
  }

  try {
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
        response: captchaToken
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (!response.status === 200) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid captcha token' 
      });
    }

    next();
  } catch (error) {
    console.error('Captcha verification error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to verify captcha' 
    });
  }
};

// Single email route with captcha verification
router.post('/sendmail', verifyCaptcha, emailController.sendSingle);

export default router;