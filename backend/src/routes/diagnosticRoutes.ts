import express from 'express';
import { 
  getDiagnosticQuestions, 
  getDiagnosticQuestion, 
  submitDiagnosticAnswer, 
  getDiagnosticProgress,
  downloadDiagnosticResults,
  manuallyCompleteUserDiagnostic
} from '../controllers/diagnosticController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getDiagnosticQuestions);
router.get('/:id', getDiagnosticQuestion);

// Protected routes
router.post('/:id/answer', protect, submitDiagnosticAnswer);
router.get('/user/progress', protect, getDiagnosticProgress);
router.get('/results/download', protect, authorize('admin'), downloadDiagnosticResults);

router.post('/complete', protect, manuallyCompleteUserDiagnostic);

export default router;