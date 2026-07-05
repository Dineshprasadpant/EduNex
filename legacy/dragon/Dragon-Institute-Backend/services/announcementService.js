import * as repository from '../repository/announcementRepository.js';
import { emailService } from '../services/mailService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
import { deleteFromS3 } from './fileService.js'; 

// Configure Handlebars
handlebars.noConflict();
const { compile } = handlebars;

// Get template path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePath = path.join(__dirname, '../announcementNotificationTemplate.html');

// Read and compile template

let announcementTemplate;
try {
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  announcementTemplate = compile(templateContent, {
    noEscape: true,       // Allows HTML in templates
    strict: true,         // Ensures variables exist
    preventIndent: true,  // Prevents whitespace issues
    allowProtoMethodsByDefault: true,
    allowProtoPropertiesByDefault: true
  });
} catch (err) {
    console.error('Error loading announcement template:', err);
    throw new Error('Failed to load announcement template');
}

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const prepareAnnouncementEmailContent = (announcementData) => {
  // Convert Mongoose document to plain object if needed
  const announcement = announcementData.toObject ? announcementData.toObject() : announcementData;

  return {
    subject: `New Announcement: ${announcement.title}`,
    html: announcementTemplate({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority || 'medium',
      categories: announcement.categories || [],
      effectiveDate: formatDate(announcement.effectiveDate),
      expirationDate: formatDate(announcement.expirationDate),
      unsubscribeLink: 'https://yourdomain.com/unsubscribe'
    })
  };
};

export const createAnnouncement = async (announcementData) => {
    const announcement = await repository.createAnnouncement(announcementData);
    
    // Send email notification in the background
    try {
       
      const emailContent = prepareAnnouncementEmailContent(announcement);
      console.log(`Announcement email size: ${Buffer.byteLength(emailContent.html, 'utf8')} bytes`);
      emailService.sendBulkEmails({
        target: 'all',
        subject: emailContent.subject,
        body: emailContent.html,
        isHtml: true
      }).catch(err => {
        console.error('Error sending announcement notification emails:', err);
      });
    } catch (err) {
      console.error('Error preparing announcement notification emails:', err);
    }
    
    return announcement;
  };

export const getAnnouncement = async (id) => {
    const announcement = await repository.getAnnouncementById(id);
    if (!announcement) {
        throw new Error('Announcement not found');
    }
    return announcement;
};

export const getAllAnnouncements = async (page, limit) => {
    return await repository.getAllAnnouncements(page, limit);
};

export const updateAnnouncement = async (id, updateData) => {
    const announcement = await repository.updateAnnouncement(id, updateData);
    if (!announcement) {
        throw new Error('Announcement not found or not updated');
    }
    return announcement;
};



export const deleteAnnouncement = async (id) => {
  try {
    // First get the announcement to access its files
    const announcement = await repository.getAnnouncementById(id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    // Array to hold all file deletion promises
    const fileDeletionPromises = [];

    // Delete main image if it exists
    if (announcement.image) {
      fileDeletionPromises.push(
        deleteFromS3(announcement.image).catch(error => {
          console.error(`Failed to delete main image ${announcement.image}:`, error.message);
        })
      );
    }

    // Delete resource materials if they exist
    if (announcement.resourceMaterials && announcement.resourceMaterials.length > 0) {
      announcement.resourceMaterials.forEach(material => {
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

    // Now delete the announcement from database
    const deletedAnnouncement = await repository.deleteAnnouncement(id);
    
    return deletedAnnouncement;
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
};