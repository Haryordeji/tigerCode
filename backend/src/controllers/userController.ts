import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User';
import Progress from '../models/Progress';
import { AppError } from '../middleware/errorHandler';
import QuizQuestion from '../models/Quiz';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.user._id) {
    throw new AppError('User not authenticated', 401);
  }
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get user progress
  const progress = await Progress.findOne({ user: user._id });

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      progress: progress ? {
        totalPatternsViewed: progress.totalPatternsViewed,
        quizScore: progress.quizScore,
        lastActive: progress.lastActive
      } : null
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.user._id) {
    throw new AppError('User not authenticated', 401);
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Update fields
  if (req.body.name) {
    user.name = req.body.name;
  }
  
  if (req.body.email) {
    // Check if email already exists for another user
    const existingUser = await User.findOne({ email: req.body.email });
    
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      throw new AppError('Email already in use', 400);
    }
    
    user.email = req.body.email;
  }
  
  if (req.body.password) {
    user.password = req.body.password;
  }
  
  if (req.body.profilePicture) {
    user.profilePicture = req.body.profilePicture;
  }

  // Save updated user
  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profilePicture: updatedUser.profilePicture
    }
  });
});

// @desc    Get user dashboard stats
// @route   GET /api/users/dashboard
// @access  Private
export const getUserDashboard = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  if (!req.user || !req.user._id) {
    throw new AppError('User not authenticated', 401);
  }
  const userId = req.user._id;

  // Get user progress
  const progress = await Progress.findOne({ user: userId });

  if (!progress) {
    return res.status(200).json({
      success: true,
      data: {
        totalPatternsViewed: 0,
        completedPatterns: 0,
        quizScore: 0,
        quizAttempts: 0,
        lastActive: null
      }
    });
  }

  // Calculate stats
  const completedPatterns = progress.patternsProgress.filter(p => p.completed).length;
  const quizAttempts = progress.quizAttempts.length;

  // Get recently accessed patterns
  const recentPatterns = progress.patternsProgress
    .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
    .slice(0, 3)
    .map(p => p.patternId);

  // Get patterns correct/incorrect ratio by pattern
  const quizPatternStats: Record<string, { correct: number; incorrect: number }> = {};
  
  // Process quiz attempts to get pattern stats
  for (const attempt of progress.quizAttempts) {
    // Get question 
    const question = await QuizQuestion.findOne({ id: attempt.questionId });
    
    if (question) {
      // Get correct answer pattern
      const correctOption = question.options.find(opt => opt.id === question.correctAnswer);
      
      if (correctOption) {
        const pattern = correctOption.pattern;
        
        if (!quizPatternStats[pattern]) {
          quizPatternStats[pattern] = { correct: 0, incorrect: 0 };
        }
        
        if (attempt.correct) {
          quizPatternStats[pattern].correct += 1;
        } else {
          quizPatternStats[pattern].incorrect += 1;
        }
      }
    }
  }

  res.status(200).json({
    success: true,
    data: {
      totalPatternsViewed: progress.totalPatternsViewed,
      completedPatterns,
      quizScore: progress.quizScore,
      quizAttempts,
      lastActive: progress.lastActive,
      recentPatterns,
      patternStats: quizPatternStats
    }
  });
});