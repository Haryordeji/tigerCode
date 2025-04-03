import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { env } from '../config/env';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Resource not found - ${req.originalUrl}`, 404);
  next(error);
};

// Error handler middleware
export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  // Log the error
  logger.error(`${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Default status code and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  // Handle mongoose duplicate key errors
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // Send the error response
  res.status(statusCode).json({
    success: false,
    message,
    stack: env.NODE_ENV === 'production' ? '📋' : err.stack
  });
};