import { dot } from 'node:test/reporters';
import app from './app';
import connectDB from './config/db';
import logger from './utils/logger';
import dotenv from 'dotenv';

dotenv.config();
// Connect to MongoDB
connectDB();

logger.info(process.env.GOOGLE_CALLBACK_URL );
// check the env are not null
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
  logger.error('Google OAuth credentials are not set in environment variables');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  logger.error('MongoDB URI is not set in environment variables');
  process.exit(1);
}
if (!process.env.FRONTEND_URL) {
  logger.error('Frontend URL is not set in environment variables');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  logger.error('JWT secret is not set in environment variables');
  process.exit(1);
}
if (!process.env.JWT_EXPIRES_IN) {
  logger.error('JWT expires in is not set in environment variables');
  process.exit(1);  
}

// Start server
const server = app.listen(process.env.PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  // Exit process
  process.exit(1);
});