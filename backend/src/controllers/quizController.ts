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
      totalPatternsViewed: 0
    });
  }

  // Add quiz attempt
  progress.quizAttempts.push({
    questionId: question.id,
    selectedAnswer: answer,
    correct: isCorrect,
    timestamp: new Date()
  });

  // Update quiz score if correct
  if (isCorrect) {
    progress.quizScore += 1;
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
      explanation: question.explanation
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
        quizScore: 0
      }
    });
  }

  // Get total number of questions
  const totalQuestions = await QuizQuestion.countDocuments();

  // Calculate statistics
  const totalAttempts = progress.quizAttempts.length;
  const correctAttempts = progress.quizAttempts.filter(attempt => attempt.correct).length;
  const incorrectAttempts = totalAttempts - correctAttempts;
  const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

  res.status(200).json({
    success: true,
    data: {
      quizAttempts: progress.quizAttempts,
      quizScore: progress.quizScore,
      totalQuestions,
      totalAttempts,
      correctAttempts,
      incorrectAttempts,
      accuracy
    }
  });
});