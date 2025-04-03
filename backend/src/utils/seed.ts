import mongoose from 'mongoose';
import connectDB from '../config/db';
import Pattern from '../models/Pattern';
import QuizQuestion from '../models/Quiz';
import User from '../models/User';
import Progress from '../models/Progress';
import { env } from '../config/env';
import logger from './logger';

// Import initial data
import patternsData from '../../data/patterns.json';
import quizData from '../../data/quiz.json';

// Seed the database with initial data
const seedDatabase = async () => {
  try {
    // Connect to the database
    await connectDB();
    logger.info('Connected to MongoDB');

    // Clear existing data (optional, use with caution in production)
    logger.info('Clearing existing data...');
    await Pattern.deleteMany({});
    await QuizQuestion.deleteMany({});
    
    // Import patterns
    logger.info('Importing patterns data...');
    await Pattern.insertMany(patternsData.patterns);
    logger.info(`${patternsData.patterns.length} patterns imported successfully`);

    // Import quiz questions
    logger.info('Importing quiz questions data...');
    await QuizQuestion.insertMany(quizData.questions);
    logger.info(`${quizData.questions.length} quiz questions imported successfully`);

    logger.info('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error seeding database: ${error.message}`);
      logger.error(error.stack);
    } else {
      logger.error('Unknown error seeding database');
    }
    process.exit(1);
  }
};

// Create admin user if needed
const createAdminUser = async () => {
  try {
    // Connect to the database
    await connectDB();
    logger.info('Connected to MongoDB');

    // Check if admin user exists
    const adminExists = await User.findOne({ email: 'admin@tigercode.edu' });

    if (!adminExists) {
      logger.info('Creating admin user...');
      
      // Create admin user
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@tigercode.edu',
        password: 'adminPassword123', // Change this to a secure password
        role: 'admin'
      });

      // Create admin progress
      await Progress.create({
        user: admin._id,
        patternsProgress: [],
        quizAttempts: [],
        quizScore: 0,
        totalPatternsViewed: 0
      });

      logger.info('Admin user created successfully');
    } else {
      logger.info('Admin user already exists');
    }

    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error creating admin user: ${error.message}`);
    } else {
      logger.error('Unknown error creating admin user');
    }
    process.exit(1);
  }
};

// Check command line arguments for which action to perform
const action = process.argv[2];

if (action === 'admin') {
  createAdminUser();
} else {
  seedDatabase();
}