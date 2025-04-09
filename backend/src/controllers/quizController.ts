import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import QuizQuestion from '../models/Quiz';
import Progress from '../models/Progress';
import { AppError } from '../middleware/errorHandler';

// @desc    Get all quiz questions
// @route   GET /api/quiz
// @access  Public
export const getQuizQuestions = asyncHandler(async (req: Request, res: Response) => {
  const questions = await QuizQuestion.find();

  res.status(200).json({
    success: true,
    count: questions.length,
    data: questions
  });
});

// @desc    Get single quiz question
// @route   GET /api/quiz/:id
// @access  Public
export const getQuizQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await QuizQuestion.findOne({ id: req.params.id });

  if (!question) {
    throw new AppError(`Question not found with id of ${req.params.id}`, 404);
  }

  res.status(200).json({
    success: true,
    data: question
  });
});

// @desc    Submit quiz answer
// @route   POST /api/quiz/:id/answer
// @access  Private
export const submitQuizAnswer = asyncHandler(async (req: Request, res: Response) => {
  const { answer } = req.body;

  // Validate quiz question exists
  const question = await QuizQuestion.findOne({ id: req.params.id });

  if (!question) {
    throw new AppError(`Question not found with id of ${req.params.id}`, 404);
  }

  if (!req.user || !req.user._id) {
    throw new AppError('User not authenticated', 401);
  }

  // Check if answer is correct
  const isCorrect = answer === question.correctAnswer;

  // Get the pattern being tested from the correct answer
  const correctOption = question.options.find(opt => opt.id === question.correctAnswer);
  const patternTested = correctOption ? correctOption.pattern : '';

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

  // Add quiz attempt
  progress.quizAttempts.push({
    questionId: question.id,
    selectedAnswer: answer,
    correct: isCorrect,
    timestamp: new Date(),
    patternTested
  });

  // Increment total quiz attempts count
  progress.totalQuizAttempts += 1;

  // Update quiz score and correct count if correct
  if (isCorrect) {
    progress.quizScore += 1;
    progress.correctQuizCount += 1;
  }

  // Update lastActive
  progress.lastActive = new Date();

  // Save progress
  await progress.save();

  res.status(200).json({
    success: true,
    data: {
      questionId: question.id,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      patternTested
    }
  });
});

// @desc    Get user quiz progress
// @route   GET /api/quiz/progress
// @access  Private
export const getQuizProgress = asyncHandler(async (req: Request, res: Response): Promise<any> => {
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
        quizAttempts: [],
        quizScore: 0,
        totalQuizAttempts: 0,
        correctQuizCount: 0,
        accuracy: 0
      }
    });
  }

  // Get total number of questions
  const totalQuestions = await QuizQuestion.countDocuments();

  // Calculate statistics
  const accuracy = progress.totalQuizAttempts > 0 
    ? (progress.correctQuizCount / progress.totalQuizAttempts) * 100 
    : 0;

  // Calculate performance by pattern
  const patternPerformance: Record<string, { correct: number; total: number; accuracy: number }> = {};
  
  progress.quizAttempts.forEach(attempt => {
    if (attempt.patternTested) {
      if (!patternPerformance[attempt.patternTested]) {
        patternPerformance[attempt.patternTested] = {
          correct: 0,
          total: 0,
          accuracy: 0
        };
      }
      
      patternPerformance[attempt.patternTested].total += 1;
      
      if (attempt.correct) {
        patternPerformance[attempt.patternTested].correct += 1;
      }
    }
  });
  
  // Calculate accuracy for each pattern
  Object.keys(patternPerformance).forEach(pattern => {
    const { correct, total } = patternPerformance[pattern];
    patternPerformance[pattern].accuracy = total > 0 ? (correct / total) * 100 : 0;
  });

  res.status(200).json({
    success: true,
    data: {
      quizAttempts: progress.quizAttempts,
      quizScore: progress.quizScore,
      totalQuestions,
      totalQuizAttempts: progress.totalQuizAttempts,
      correctQuizCount: progress.correctQuizCount,
      incorrectCount: progress.totalQuizAttempts - progress.correctQuizCount,
      accuracy,
      patternPerformance
    }
  });
});

// @desc    Get quiz performance summary
// @route   GET /api/quiz/summary
// @access  Private
export const getQuizSummary = asyncHandler(async (req: Request, res: Response): Promise<any> => {
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
        totalAttempts: 0,
        correctCount: 0,
        accuracy: 0,
        topPatterns: []
      }
    });
  }
  
  // Calculate performance by pattern
  const patternStats: Record<string, { correct: number; total: number }> = {};
  
  progress.quizAttempts.forEach(attempt => {
    if (attempt.patternTested) {
      if (!patternStats[attempt.patternTested]) {
        patternStats[attempt.patternTested] = { correct: 0, total: 0 };
      }
      
      patternStats[attempt.patternTested].total += 1;
      
      if (attempt.correct) {
        patternStats[attempt.patternTested].correct += 1;
      }
    }
  });
  
  // Get top 3 strongest patterns
  const topPatterns = Object.entries(patternStats)
    .map(([pattern, stats]) => ({
      pattern,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      attempts: stats.total
    }))
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 3);
  
  const accuracy = progress.totalQuizAttempts > 0 
    ? (progress.correctQuizCount / progress.totalQuizAttempts) * 100 
    : 0;
  
  res.status(200).json({
    success: true,
    data: {
      totalAttempts: progress.totalQuizAttempts,
      correctCount: progress.correctQuizCount,
      accuracy,
      topPatterns
    }
  });
});

// @desc    Get last answered question and next unanswered question
// @route   GET /api/quiz/continue
// @access  Private
export const getNextQuestion = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  if (!req.user || !req.user._id) {
    throw new AppError('User not authenticated', 401);
  }
  
  const userId = req.user._id;
  
  // Find user progress
  const progress = await Progress.findOne({ user: userId });
  
  if (!progress || progress.quizAttempts.length === 0) {
    // No quiz attempts yet, return first question
    return res.status(200).json({
      success: true,
      data: {
        lastAnsweredIndex: -1,
        nextUnansweredIndex: 0
      }
    });
  }
  
  // Get all questions
  const allQuestions = await QuizQuestion.find().sort({ id: 1 });
  
  // Get all question IDs that have been attempted
  const attemptedQuestionIds = new Set(progress.quizAttempts.map(attempt => attempt.questionId));
  
  // Find the index of the first unanswered question
  const nextUnansweredIndex = allQuestions.findIndex(q => !attemptedQuestionIds.has(q.id));
  
  // Get the most recently answered question
  const sortedAttempts = [...progress.quizAttempts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const lastAnsweredQuestionId = sortedAttempts[0]?.questionId;
  const lastAnsweredIndex = allQuestions.findIndex(q => q.id === lastAnsweredQuestionId);
  
  res.status(200).json({
    success: true,
    data: {
      lastAnsweredIndex: lastAnsweredIndex !== -1 ? lastAnsweredIndex : -1,
      nextUnansweredIndex: nextUnansweredIndex !== -1 ? nextUnansweredIndex : 0
    }
  });
});