import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import passport from 'passport';
import { env } from './config/env';
import configurePassport from './config/passport';
import authRoutes from './routes/authRoutes';
import patternRoutes from './routes/patternRoutes';
import quizRoutes from './routes/quizRoutes';
import userRoutes from './routes/userRoutes';
import { notFound, errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));

// Logging in development
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Initialize Passport
app.use(passport.initialize());
configurePassport();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patterns', patternRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/users', userRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to TigerCode API' });
});

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

export default app;