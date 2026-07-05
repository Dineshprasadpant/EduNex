import {
  createNews,
  findNewsById,
  findAllNewsPaginated,
  updateNewsById,
  deleteNewsById
} from '../repository/newsRepository.js';
import { emailService } from '../services/mailService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
  import { deleteFromS3 } from './fileService.js';

// Configure Handlebars
handlebars.noConflict();

// Get template path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePath = path.join(__dirname, '../newsNotificationTemplate.html');

// Simple in-memory cache for the compiled template
let newsTemplate = null;

const loadTemplate = () => {
  if (newsTemplate) return newsTemplate;
  
  try {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Validate template size
    if (Buffer.byteLength(templateContent, 'utf8') > 100000) {
      throw new Error('News template is too large (>100KB)');
    }
    
    newsTemplate = handlebars.compile(templateContent, {
      noEscape: true,
      strict: false
    });
    
    return newsTemplate;
  } catch (err) {
    console.error('Error loading news template:', err);
    throw new Error('Failed to load news template');
  }
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const prepareNewsEmailContent = (newsData) => {
  const template = loadTemplate();
  const news = newsData.toObject ? newsData.toObject() : newsData;

  const renderedHtml = template({
    title: news.title,
    publisher: news.publisher,
    content: news.content,
    publishDate: formatDate(news.publishDate || new Date()),
    categories: news.categories || [],
    readMoreLink: `https://dragoneducationfoundation/news/${news._id}` || 'https://dragoneducationfoundation/news/',
    unsubscribeLink: 'https://yourdomain.com/unsubscribe'
  }).replace(/\s+/g, ' ').trim();

  if (Buffer.byteLength(renderedHtml, 'utf8') > 256000) {
    console.warn('Warning: Large news email content size may cause delivery issues');
  }

  return {
    subject: `New Update: ${news.title}`,
    html: renderedHtml
  };
};

export const createNewsService = async (newsData) => {
  if (!newsData.title || !newsData.publisher || !newsData.content) {
    throw new Error('Title, publisher, and content are required');
  }

  const news = await createNews(newsData);
  
  try {
    const emailContent = prepareNewsEmailContent(news);
    
    await emailService.sendBulkEmails({
      target: 'all',
      subject: emailContent.subject,
      body: emailContent.html,
      isHtml: true
    });
  } catch (err) {
    console.error('Error sending news notification:', err);
    // Consider adding retry logic here
  }
  
  return news;
};
  
  export const getNewsByIdService = async (id) => {
    const news = await findNewsById(id);
    if (!news) throw new Error('News not found');
    return news;
  };
  
  export const getAllNewsService = async ({ page, limit }) => {
    return await findAllNewsPaginated({ page, limit });
  };
  
  export const updateNewsService = async (id, updateData) => {
    const updatedNews = await updateNewsById(id, updateData);
    if (!updatedNews) throw new Error('News not found');
    return updatedNews;
  };
  


export const deleteNewsService = async (id) => {
  try {
    // First get the news item to access its files
    const news = await findNewsById(id);
    if (!news) {
      throw new Error('News not found');
    }

    // Array to hold all file deletion promises
    const fileDeletionPromises = [];

    // Delete main image if it exists
    if (news.image) {
      fileDeletionPromises.push(
        deleteFromS3(news.image).catch(error => {
          console.error(`Failed to delete main image ${news.image}:`, error.message);
        })
      );
    }

    // Delete CTA image if it exists
    if (news.cta?.imageUrl) {
      fileDeletionPromises.push(
        deleteFromS3(news.cta.imageUrl).catch(error => {
          console.error(`Failed to delete CTA image ${news.cta.imageUrl}:`, error.message);
        })
      );
    }

    // Delete resource materials if they exist
    if (news.resourceMaterials?.length > 0) {
      news.resourceMaterials.forEach(material => {
        if (material.url) {
          fileDeletionPromises.push(
            deleteFromS3(material.url).catch(error => {
              console.error(`Failed to delete resource ${material.url}:`, error.message);
            })
          );
        }
      });
    }

    // Wait for all file deletions to complete (successfully or not)
    await Promise.all(fileDeletionPromises);

    // Now delete the news from database
    const deletedNews = await deleteNewsById(id);
    
    return deletedNews;
  } catch (error) {
    console.error('Error deleting news:', error);
    throw error;
  }
};