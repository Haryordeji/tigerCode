import express from 'express';
import passport from 'passport';
import { register, login, getMe, googleCallback, logout } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Register and login routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

console.log('Auth routes loaded' );
// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

export default router;