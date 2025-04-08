// backend/src/routes/quizRoutes.ts
import express from 'express';
import { 
  getQuizQuestions, 
  getQuizQuestion, 
  submitQuizAnswer, 
  getQuizProgress,
  getQuizSummary,
  getNextQuestion
} from '../controllers/quizController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getQuizQuestions);
router.get('/:id', getQuizQuestion);

// Protected routes
router.post('/:id/answer', protect, submitQuizAnswer);
router.get('/user/progress', protect, getQuizProgress);
router.get('/user/summary', protect, getQuizSummary);
router.get('/user/continue', protect, getNextQuestion);

export default router;