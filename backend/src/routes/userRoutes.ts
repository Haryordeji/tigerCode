import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile,
  getUserDashboard
} from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.get('/dashboard', getUserDashboard);

export default router;