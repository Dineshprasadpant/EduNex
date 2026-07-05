import * as repository from '../repository/eventsRepository.js';
import { emailService } from '../services/mailService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
import { deleteFromS3 } from './fileService.js'; 

// Configure Handlebars to allow prototype access
handlebars.noConflict();
const { compile } = handlebars;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePath = path.join(__dirname, '../eventNotificationTemplate.html');

// Read and compile template with safe access options
let emailTemplate;
try {
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  emailTemplate = compile(templateContent, {
    noEscape: true,       // Allows HTML in templates
    strict: true,         // Ensures variables exist
    preventIndent: true,  // Prevents whitespace issues
    allowProtoMethodsByDefault: true,
    allowProtoPropertiesByDefault: true
  });
} catch (err) {
  console.error('Error loading email template:', err);
  throw new Error('Failed to load email template');
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const prepareEventEmailContent = (eventData) => {
  // Convert Mongoose document to plain object if needed
  const eventObj = eventData.toObject ? eventData.toObject() : eventData;
  
  const startDate = formatDate(eventObj.start_date);
  const endDate = formatDate(eventObj.end_date);
  const eventDate = startDate === endDate 
    ? startDate 
    : `${startDate} to ${endDate}`;

  return {
    subject: `New Event: ${eventObj.title}`,
    html: emailTemplate({
      eventTitle: eventObj.title,
      eventDescription: eventObj.description,
      eventDate: eventDate,
      eventVenue: `${eventObj.venue.name}, ${eventObj.venue.address}`,
      eventMaterials: eventObj.resourceMaterials || [],
      eventExtraInfo: eventObj.extraInformation || [],
      organizerName: eventObj.organizer.name,
      organizerEmail: eventObj.organizer.email,
      unsubscribeLink: 'https://yourdomain.com/unsubscribe'
    })
  };
};

export const createEvent = async (eventData) => {
  const event = await repository.createEvent(eventData);
  
  try {
    const emailContent = prepareEventEmailContent(event);
    console.log(`Event email size: ${Buffer.byteLength(emailContent.html, 'utf8')} bytes`);
    await emailService.sendBulkEmails({
      target: 'all',
      subject: emailContent.subject,
      body: emailContent.html,
      isHtml: true  // Ensure this flag is passed to indicate HTML content
    });
  } catch (err) {
    console.error('Error sending event notifications:', err);
  }
  
  return event;
};


export const getEvent = async (id) => {
  const event = await repository.getEventById(id);
  if (!event) {
    throw new Error('Event not found');
  }
  return event;
};

export const getByMonthAndYear = async (month, year) => {
  const events = await repository.getByMonthAndYear(month, year);
  if(!events){
    throw new Error('Event not found');
  }
  return events;

}

export const getAllEvents = async (page, limit) => {
  return await repository.getAllEvents(page, limit);
};

export const updateEvent = async (id, updateData) => {
  const event = await repository.updateEvent(id, updateData);
  if (!event) {
    throw new Error('Event not found or not updated');
  }
  return event;
};



export const deleteEvent = async (id) => {
  try {
    // First get the event to access its resource materials
    const event = await repository.getEventById(id);
    if (!event) {
      throw new Error('Event not found');
    }

    // Delete resource materials from S3 if they exist
    if (event.resourceMaterials && event.resourceMaterials.length > 0) {
      // Extract all URLs from resource materials
      const resourceUrls = event.resourceMaterials
        .map(material => material.url)
        .filter(url => url && url.trim() !== '');

      // Delete each resource file from S3
      await Promise.all(
        resourceUrls.map(url => 
          deleteFromS3(url).catch(error => {
            console.error(`Failed to delete resource ${url}:`, error.message);
            // Continue with other deletions even if one fails
          })
        )
      );
    }

    // Now delete the event from database
    const deletedEvent = await repository.deleteEvent(id);
    
    return deletedEvent;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};