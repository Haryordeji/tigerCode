import express from 'express';
import { 
  getQuizQuestions, 
  getQuizQuestion, 
  submitQuizAnswer, 
  getQuizProgress 
} from '../controllers/quizController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getQuizQuestions);
router.get('/:id', getQuizQuestion);

// Protected routes
router.post('/:id/answer', protect, submitQuizAnswer);
router.get('/user/progress', protect, getQuizProgress);

export default router;