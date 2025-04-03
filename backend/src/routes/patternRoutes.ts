import express from 'express';
import { 
  getPatterns, 
  getPattern, 
  completePattern, 
  getPatternProgress 
} from '../controllers/patternController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getPatterns);
router.get('/:id', getPattern);

// Protected routes
router.put('/:id/complete', protect, completePattern);
router.get('/user/progress', protect, getPatternProgress);

export default router;