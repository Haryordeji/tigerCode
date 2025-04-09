import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User';
import Progress from '../models/Progress';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new AppError('User already exists', 400);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password
  });

  // Create initial progress record for the user
  await Progress.create({
    user: user._id,
    patternsProgress: [],
    quizAttempts: [],
    quizScore: 0,
    totalPatternsViewed: 0
  });

  if (user) {
    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      }
    });
  } else {
    throw new AppError('Invalid user data', 400);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check for user with email
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken(user);

  // Update last active in progress
  await Progress.findOneAndUpdate(
    { user: user._id },
    { lastActive: new Date() },
    { upsert: true }
  );

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      token
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response) => {

  if (!req.user || !req.user._id) {
    throw new AppError('User not authenticated', 401);
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture
    }
  });
});

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.user._id) {
    throw new AppError('User not authenticated', 401);
  }
  // Generate token for the authenticated user
  const token = generateToken(req.user);

  // Redirect to frontend with token
  res.redirect(`${env.FRONTEND_URL}/auth-callback?token=${token}`);
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});