import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Pattern from '../models/Pattern';
import Progress from '../models/Progress';
import { AppError } from '../middleware/errorHandler';

// @desc    Get all patterns
// @route   GET /api/patterns
// @access  Public
export const getPatterns = asyncHandler(async (req: Request, res: Response) => {
  const patterns = await Pattern.find().select('id title description icon');

  res.status(200).json({
    success: true,
    count: patterns.length,
    data: patterns
  });
});

// @desc    Get single pattern
// @route   GET /api/patterns/:id
// @access  Public
export const getPattern = asyncHandler(async (req: Request, res: Response) => {
  const pattern = await Pattern.findOne({ id: req.params.id });

  if (!pattern) {
    throw new AppError(`Pattern not found with id of ${req.params.id}`, 404);
  }

  // If authenticated, update user progress
  if (req.user) {
    const userId = req.user._id;

    // Find user progress
    const progress = await Progress.findOne({ user: userId });

    if (progress) {
      // Check if pattern is already in progress
      const patternProgressIndex = progress.patternsProgress.findIndex(
        p => p.patternId === pattern.id
      );

      if (patternProgressIndex === -1) {
        // Add pattern to progress if it's the first time viewing
        progress.patternsProgress.push({
          patternId: pattern.id,
          completed: false,
          lastAccessed: new Date(),
          viewCount: 1
        });
        
        // Increment totalPatternsViewed if this is a new pattern
        progress.totalPatternsViewed += 1;
      } else {
        // Update lastAccessed and increment viewCount
        progress.patternsProgress[patternProgressIndex].lastAccessed = new Date();
        progress.patternsProgress[patternProgressIndex].viewCount += 1;
        // NOTE: We don't increment totalPatternsViewed since this pattern has been viewed before
      }

      // Update lastActive
      progress.lastActive = new Date();

      // Ensure totalPatternsViewed doesn't exceed the actual number of patterns
      const totalPatternCount = await Pattern.countDocuments();
      if (progress.totalPatternsViewed > totalPatternCount) {
        progress.totalPatternsViewed = totalPatternCount;
      }

      // Save progress
      await progress.save();
    } else {
      // Create new progress record if it doesn't exist
      await Progress.create({
        user: userId,
        patternsProgress: [{
          patternId: pattern.id,
          completed: false,
          lastAccessed: new Date(),
          viewCount: 1
        }],
        quizAttempts: [],
        quizScore: 0,
        totalPatternsViewed: 1,
        lastActive: new Date(),
        correctQuizCount: 0,
        totalQuizAttempts: 0
      });
    }
  }

  res.status(200).json({
    success: true,
    data: pattern
  });
});

// @desc    Mark pattern as completed
// @route   PUT /api/patterns/:id/complete
// @access  Private
export const completePattern = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.user._id) {
    throw new AppError('User not authenticated', 401);
  }
  const pattern = await Pattern.findOne({ id: req.params.id });

  if (!pattern) {
    throw new AppError(`Pattern not found with id of ${req.params.id}`, 404);
  }

  const userId = req.user._id;

  // Find user progress
  let progress = await Progress.findOne({ user: userId });

  if (!progress) {
    // Create progress if it doesn't exist
    progress = await Progress.create({
      user: userId,
      patternsProgress: [],
      quizAttempts: [],
      quizScore: 0,
      totalPatternsViewed: 0,
      correctQuizCount: 0,
      totalQuizAttempts: 0
    });
  }

  // Check if pattern is already in progress
  const patternProgressIndex = progress.patternsProgress.findIndex(
    p => p.patternId === pattern.id
  );

  if (patternProgressIndex === -1) {
    // Add pattern to progress
    progress.patternsProgress.push({
      patternId: pattern.id,
      completed: true,
      lastAccessed: new Date(),
      viewCount: 1
    });
    
    // Increment totalPatternsViewed if this is a new pattern
    progress.totalPatternsViewed += 1;
    
    // Ensure totalPatternsViewed doesn't exceed the actual number of patterns
    const totalPatternCount = await Pattern.countDocuments();
    if (progress.totalPatternsViewed > totalPatternCount) {
      progress.totalPatternsViewed = totalPatternCount;
    }
  } else {
    // Mark pattern as completed
    progress.patternsProgress[patternProgressIndex].completed = true;
    progress.patternsProgress[patternProgressIndex].lastAccessed = new Date();
  }

  // Update lastActive
  progress.lastActive = new Date();

  // Save progress
  await progress.save();

  res.status(200).json({
    success: true,
    data: {
      patternId: pattern.id,
      completed: true
    }
  });
});

// @desc    Get user pattern progress
// @route   GET /api/patterns/progress
// @access  Private
export const getPatternProgress = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  if (!req.user || !req.user._id) {
    throw new AppError('User not authenticated', 401);
  }
  
  const userId = req.user._id;

  // Find user progress
  const progress = await Progress.findOne({ user: userId });

  if (!progress) {
    return res.status(200).json({
      success: true,
      data: {
        patternsProgress: [],
        totalPatternsViewed: 0
      }
    });
  }

  // Calculate completion stats
  const completedPatterns = progress.patternsProgress.filter(p => p.completed).length;
  const completionRate = progress.patternsProgress.length > 0 
    ? (completedPatterns / progress.patternsProgress.length) * 100 
    : 0;

  // Get most viewed patterns
  const mostViewedPatterns = [...progress.patternsProgress]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 3)
    .map(p => ({
      patternId: p.patternId,
      viewCount: p.viewCount,
      completed: p.completed
    }));

  res.status(200).json({
    success: true,
    data: {
      patternsProgress: progress.patternsProgress,
      totalPatternsViewed: progress.totalPatternsViewed,
      completedPatterns,
      completionRate,
      mostViewedPatterns
    }
  });
});