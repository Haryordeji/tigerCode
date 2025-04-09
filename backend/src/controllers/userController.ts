import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User';
import Progress from '../models/Progress';
import { AppError } from '../middleware/errorHandler';
import QuizQuestion from '../models/Quiz';
import Pattern from '../models/Pattern';

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
        totalQuizAttempts: progress.totalQuizAttempts,
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
        lastActive: null,
        accuracy: 0,
        patternStats: {}
      }
    });
  }

  // Calculate stats
  const completedPatterns = progress.patternsProgress.filter(p => p.completed).length;
  const totalPatterns = await Pattern.countDocuments();
  const completionPercentage = totalPatterns > 0 ? (completedPatterns / totalPatterns) * 100 : 0;
  
  // Calculate quiz accuracy
  const accuracy = progress.totalQuizAttempts > 0 
    ? (progress.correctQuizCount / progress.totalQuizAttempts) * 100 
    : 0;

  // Get recently accessed patterns
  const recentPatterns = progress.patternsProgress
    .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
    .slice(0, 5)
    .map(p => ({
      patternId: p.patternId,
      lastAccessed: p.lastAccessed,
      completed: p.completed,
      viewCount: p.viewCount
    }));

  // Get patterns correct/incorrect ratio by pattern
  const patternStats: Record<string, { correct: number; incorrect: number }> = {};
  
  // Process quiz attempts to get pattern stats
  for (const attempt of progress.quizAttempts) {
    if (attempt.patternTested) {
      if (!patternStats[attempt.patternTested]) {
        patternStats[attempt.patternTested] = { correct: 0, incorrect: 0 };
      }
      
      if (attempt.correct) {
        patternStats[attempt.patternTested].correct += 1;
      } else {
        patternStats[attempt.patternTested].incorrect += 1;
      }
    }
  }

  // Get most viewed patterns
  const mostViewedPatterns = [...progress.patternsProgress]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 3)
    .map(p => ({
      patternId: p.patternId,
      viewCount: p.viewCount
    }));

  res.status(200).json({
    success: true,
    data: {
      totalPatternsViewed: progress.totalPatternsViewed,
      completedPatterns,
      completionPercentage,
      quizScore: progress.quizScore,
      totalQuizAttempts: progress.totalQuizAttempts,
      correctQuizCount: progress.correctQuizCount,
      lastActive: progress.lastActive,
      recentPatterns,
      patternStats,
      accuracy,
      mostViewedPatterns
    }
  });
});

// @desc    Get learning progress overview
// @route   GET /api/users/progress-overview
// @access  Private
export const getProgressOverview = asyncHandler(async (req: Request, res: Response): Promise<any> => {
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
        patternsProgress: {
          total: 0,
          completed: 0,
          completion: 0
        },
        quizProgress: {
          totalAttempts: 0,
          correctAnswers: 0,
          accuracy: 0
        },
        recentActivity: []
      }
    });
  }
  
  // Calculate pattern progress stats
  const totalPatterns = await Pattern.countDocuments();
  const viewedPatterns = progress.patternsProgress.length;
  const completedPatterns = progress.patternsProgress.filter(p => p.completed).length;
  const patternCompletion = totalPatterns > 0 ? (completedPatterns / totalPatterns) * 100 : 0;
  
  // Calculate quiz progress stats
  const totalQuestions = await QuizQuestion.countDocuments();
  const quizAttempts = progress.totalQuizAttempts;
  const correctAnswers = progress.correctQuizCount;
  const quizAccuracy = quizAttempts > 0 ? (correctAnswers / quizAttempts) * 100 : 0;
  const questionsCoverage = totalQuestions > 0 ? 
    (progress.quizAttempts.map(a => a.questionId).filter((v, i, a) => a.indexOf(v) === i).length / totalQuestions) * 100 
    : 0;
  
  // Get recent activity (combining patterns and quizzes)
  const patternActivity = progress.patternsProgress.map(p => ({
    type: 'pattern',
    id: p.patternId,
    date: p.lastAccessed
  }));
  
  const quizActivity = progress.quizAttempts.map(q => ({
    type: 'quiz',
    id: q.questionId,
    date: q.timestamp,
    correct: q.correct
  }));
  
  // Combine and sort by date (most recent first)
  const recentActivity = [...patternActivity, ...quizActivity]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
  
  res.status(200).json({
    success: true,
    data: {
      patternsProgress: {
        totalAvailable: totalPatterns,
        viewed: viewedPatterns,
        completed: completedPatterns,
        completion: patternCompletion
      },
      quizProgress: {
        totalQuestions,
        totalAttempts: quizAttempts,
        correctAnswers,
        accuracy: quizAccuracy,
        questionsCoverage
      },
      recentActivity
    }
  });
});