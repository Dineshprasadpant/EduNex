import express from 'express';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import userRoutes from './routes/userRoutes.js';
import { seedAdminUser } from './utils/adminSeed.js';
import questionSheetRoutes from './routes/questionSheetRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import examRoutes from './routes/examRoutes.js';
import advertisementRoutes from './routes/advertisementRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import eventRoutes from './routes/eventsRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import classMaterialRoutes from "./routes/classMaterialRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import uploadRoutes from "./routes/fileRoutes.js";
import feedbackRouter from "./routes/feedBackRoutes.js";
import examPerformanceRoutes from "./routes/examPerformanceRoutes.js";
import userAnalyticsRoutes from "./routes/userAnalyticsRoutes.js";
import subscriberRoutes from "./routes/subscriberRoutes.js";
import bodyParser from 'body-parser';
import mailRoutes from "./routes/mailRoutes.js";
import serverless from 'serverless-http';
import cors from 'cors';
import schedulerRoutes from "./routes/schedulerRoutes.js"

dotenv.config();

// Initialize Express app
const app = express();

// Proper CORS configuration for AWS Lambda
app.use(cors({
  origin: '*', // Allow all origins - you can restrict this to specific domains if needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(bodyParser.json());

// Connect to MongoDB and seed admin user
const initializeServer = async () => {
  // Connect to database
  await connectDatabase();
  
  // Create admin user if it doesn't exist
  await seedAdminUser();
};

// Middleware
app.use(express.json());

// Handle OPTIONS requests explicitly for preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// Add root path handler (IMPORTANT: Add this for Lambda testing)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running successfully'
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/questionsheets', questionSheetRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/announcements', announcementRoutes);
app.use("/api/advertisements", advertisementRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/classMaterial", classMaterialRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/files', uploadRoutes);
app.use('/api/feedbacks', feedbackRouter);
app.use('/api/performance', examPerformanceRoutes);
app.use('/api/analytics', userAnalyticsRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/cleaner', schedulerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// AWS Lambda handler
const handler = serverless(app);

// Track if we've initialized the server for Lambda
let isInitialized = false;

// Handle Lambda events
export const lambdaHandler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false; // Prevent Lambda from waiting for DB connections to close
  
  // Initialize server only once per Lambda container
  if (!isInitialized) {
    try {
      await initializeServer();
      console.log('Server initialized successfully in Lambda');
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize server in Lambda:', error);
      // We'll continue execution even if initialization fails
    }
  }
  
  // Add CORS headers to all Lambda responses
  const response = await handler(event, context);
  
  // Ensure CORS headers are present in the response
  if (!response.headers) {
    response.headers = {};
  }
  
  // Make sure these headers are explicitly set for every response
  response.headers['Access-Control-Allow-Origin'] = '*';
  response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
  response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
  response.headers['Access-Control-Allow-Credentials'] = 'true';
  
  return response;
};

// Local development
if (process.env.ENVIRONMENT === 'development') {
  const PORT = process.env.PORT || 3000;
  
  initializeServer()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Failed to initialize server:', err);
      process.exit(1);
    });
}

export default lambdaHandler;