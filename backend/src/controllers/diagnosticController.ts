import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import DiagnosticQuestion from '../models/Diagnostic';
import Progress from '../models/Progress';
import { AppError } from '../middleware/errorHandler';
import { createObjectCsvStringifier } from 'csv-writer';
import User from '../models/User';

// @desc    Get all diagnostic questions
// @route   GET /api/diagnostic
// @access  Public
export const getDiagnosticQuestions = asyncHandler(async (req: Request, res: Response) => {
  const questions = await DiagnosticQuestion.find();

  res.status(200).json({
    success: true,
    count: questions.length,
    data: questions
  });
});

// @desc    Get single diagnostic question
// @route   GET /api/diagnostic/:id
// @access  Public
export const getDiagnosticQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await DiagnosticQuestion.findOne({ id: req.params.id });

  if (!question) {
    throw new AppError(`Question not found with id of ${req.params.id}`, 404);
  }

  res.status(200).json({
    success: true,
    data: question
  });
});

// @desc    Submit diagnostic answer
// @route   POST /api/diagnostic/:id/answer
// @access  Private
export const submitDiagnosticAnswer = asyncHandler(async (req: Request, res: Response) => {
  const { answer } = req.body;

  // Validate diagnostic question exists
  const question = await DiagnosticQuestion.findOne({ id: req.params.id });

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
      diagnosticAttempts: [],
      quizScore: 0,
      diagnosticScore: 0,
      totalPatternsViewed: 0,
      correctQuizCount: 0,
      totalQuizAttempts: 0,
      diagnosticCompleted: false,
      lastDiagnosticAttempt: new Date()
    });
  }

  // Check if this question has already been answered
  const existingAttemptIndex = progress.diagnosticAttempts.findIndex(
    a => a.questionId === question.id
  );
  
  if (existingAttemptIndex !== -1) {
    // Update existing attempt
    progress.diagnosticAttempts[existingAttemptIndex] = {
      questionId: question.id,
      selectedAnswer: answer,
      correct: isCorrect,
      timestamp: new Date(),
      patternTested
    };
  } else {
    // Add new diagnostic attempt
    progress.diagnosticAttempts.push({
      questionId: question.id,
      selectedAnswer: answer,
      correct: isCorrect,
      timestamp: new Date(),
      patternTested
    });
  }

  // Update diagnostic score if correct
  if (isCorrect) {
    // If updating an existing attempt that was incorrect before
    if (existingAttemptIndex !== -1 && !progress.diagnosticAttempts[existingAttemptIndex].correct) {
      progress.diagnosticScore += 1;
    } 
    // If this is a new attempt
    else if (existingAttemptIndex === -1) {
      progress.diagnosticScore += 1;
    }
  }

  // Update lastDiagnosticAttempt
  progress.lastDiagnosticAttempt = new Date();

  // Check if diagnostic is completed (all questions answered)
  const totalQuestions = await DiagnosticQuestion.countDocuments();
  
  if (totalQuestions > 0) {
    // Get unique question IDs from attempts
    const attemptedQuestionIds = new Set(
      progress.diagnosticAttempts.map(a => a.questionId)
    );
    
    // If all questions have been attempted, mark diagnostic as completed
    if (attemptedQuestionIds.size >= totalQuestions) {
      progress.diagnosticCompleted = true;
      console.log('Marking diagnostic as completed');
    }
  }

  // Save progress
  await progress.save();

  res.status(200).json({
    success: true,
    data: {
      questionId: question.id,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      patternTested,
      diagnosticCompleted: progress.diagnosticCompleted
    }
  });
});

// @desc    Get user diagnostic progress
// @route   GET /api/diagnostic/progress
// @access  Private
export const getDiagnosticProgress = asyncHandler(async (req: Request, res: Response): Promise<any> => {
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
        diagnosticAttempts: [],
        diagnosticScore: 0,
        diagnosticCompleted: false,
        lastDiagnosticAttempt: null,
        totalQuestions: await DiagnosticQuestion.countDocuments()
      }
    });
  }

  // Get total number of questions
  const totalQuestions = await DiagnosticQuestion.countDocuments();
  console.log(`Total diagnostic questions: ${totalQuestions}`);

  // Calculate statistics
  const accuracy = progress.diagnosticAttempts.length > 0 
    ? (progress.diagnosticAttempts.filter(a => a.correct).length / progress.diagnosticAttempts.length) * 100 
    : 0;

  // Calculate performance by pattern
  const patternPerformance: Record<string, { correct: number; total: number; accuracy: number }> = {};
  
  progress.diagnosticAttempts.forEach(attempt => {
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

  // Get unique question IDs from attempts to check completion status
  const attemptedQuestionIds = new Set(progress.diagnosticAttempts.map(a => a.questionId));
  console.log(`Attempted questions: ${attemptedQuestionIds.size}`);
  
  // Make sure totalQuestions is greater than 0 before doing the comparison
  const isCompleted = totalQuestions > 0 && attemptedQuestionIds.size >= totalQuestions;
  
  // Update progress.diagnosticCompleted if needed
  if (isCompleted && !progress.diagnosticCompleted) {
    progress.diagnosticCompleted = true;
    await progress.save();
    console.log('Updated diagnostic completion status in database');
  }

  res.status(200).json({
    success: true,
    data: {
      diagnosticAttempts: progress.diagnosticAttempts,
      diagnosticScore: progress.diagnosticScore,
      totalQuestions,
      accuracy,
      patternPerformance,
      diagnosticCompleted: progress.diagnosticCompleted || isCompleted,
      lastDiagnosticAttempt: progress.lastDiagnosticAttempt
    }
  });
});

// @desc    Download diagnostic results as CSV
// @route   GET /api/diagnostic/results/download
// @access  Private (Admin only)
export const downloadDiagnosticResults = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  if (!req.user || !req.user._id || req.user.role !== 'admin') {
    throw new AppError('Not authorized', 403);
  }

  // Fetch all users with their progress
  const users = await User.find().select('_id name email');
  
  // Prepare data for CSV
  const csvData = [];
  
  for (const user of users) {
    const progress = await Progress.findOne({ user: user._id });
    
    if (progress) {
      const diagnosticCorrect = progress.diagnosticAttempts.filter(a => a.correct).length;
      const diagnosticTotal = progress.diagnosticAttempts.length;
      const diagnosticAccuracy = diagnosticTotal > 0 ? (diagnosticCorrect / diagnosticTotal) * 100 : 0;
      
      const quizCorrect = progress.correctQuizCount;
      const quizTotal = progress.totalQuizAttempts;
      const quizAccuracy = quizTotal > 0 ? (quizCorrect / quizTotal) * 100 : 0;
      
      // Pattern performance in diagnostic
      const patternPerformance: Record<string, { correct: number; total: number }> = {};
      
      progress.diagnosticAttempts.forEach(attempt => {
        if (attempt.patternTested) {
          if (!patternPerformance[attempt.patternTested]) {
            patternPerformance[attempt.patternTested] = { correct: 0, total: 0 };
          }
          
          patternPerformance[attempt.patternTested].total += 1;
          
          if (attempt.correct) {
            patternPerformance[attempt.patternTested].correct += 1;
          }
        }
      });
      
      // Format pattern performance for CSV
      const patternPerformanceStr = Object.entries(patternPerformance)
        .map(([pattern, stats]) => {
          const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
          return `${pattern}:${accuracy.toFixed(1)}%`;
        })
        .join('; ');
      
      csvData.push({
        userId: user._id,
        name: user.name,
        email: user.email,
        diagnosticCompleted: progress.diagnosticCompleted ? 'Yes' : 'No',
        diagnosticScore: progress.diagnosticScore,
        diagnosticAttempts: diagnosticTotal,
        diagnosticAccuracy: diagnosticAccuracy.toFixed(1) + '%',
        quizScore: quizCorrect,
        quizAttempts: quizTotal,
        quizAccuracy: quizAccuracy.toFixed(1) + '%',
        patternPerformance: patternPerformanceStr,
        lastActive: progress.lastActive ? progress.lastActive.toISOString() : 'N/A'
      });
    } else {
      // User with no progress
      csvData.push({
        userId: user._id,
        name: user.name,
        email: user.email,
        diagnosticCompleted: 'No',
        diagnosticScore: 0,
        diagnosticAttempts: 0,
        diagnosticAccuracy: '0%',
        quizScore: 0,
        quizAttempts: 0,
        quizAccuracy: '0%',
        patternPerformance: '',
        lastActive: 'N/A'
      });
    }
  }
  
  // Create CSV
  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: 'userId', title: 'User ID' },
      { id: 'name', title: 'Name' },
      { id: 'email', title: 'Email' },
      { id: 'diagnosticCompleted', title: 'Diagnostic Completed' },
      { id: 'diagnosticScore', title: 'Diagnostic Score' },
      { id: 'diagnosticAttempts', title: 'Diagnostic Attempts' },
      { id: 'diagnosticAccuracy', title: 'Diagnostic Accuracy' },
      { id: 'quizScore', title: 'Quiz Score' },
      { id: 'quizAttempts', title: 'Quiz Attempts' },
      { id: 'quizAccuracy', title: 'Quiz Accuracy' },
      { id: 'patternPerformance', title: 'Pattern Performance' },
      { id: 'lastActive', title: 'Last Active' }
    ]
  });
  
  const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(csvData);
  
  // Set headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="tigercode-user-performance.csv"');
  
  // Send CSV as response
  res.status(200).send(csvString);
});

// Add this to backend/src/controllers/diagnosticController.ts
export const manuallyCompleteUserDiagnostic = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.user._id) {
    throw new AppError('User not authenticated', 401);
  }
  
  // Find user progress
  let progress = await Progress.findOne({ user: req.user._id });
  
  if (!progress) {
    progress = await Progress.create({
      user: req.user._id,
      patternsProgress: [],
      quizAttempts: [],
      diagnosticAttempts: [],
      quizScore: 0,
      diagnosticScore: 0,
      totalPatternsViewed: 0,
      correctQuizCount: 0,
      totalQuizAttempts: 0,
      diagnosticCompleted: true,
      lastDiagnosticAttempt: new Date()
    });
  } else {
    progress.diagnosticCompleted = true;
    await progress.save();
  }
  
  res.status(200).json({
    success: true,
    message: 'Diagnostic marked as completed',
    data: {
      diagnosticCompleted: true
    }
  });
});
