import { Document } from 'mongoose';

// Define the QuizQuestion interface for quiz.json
export interface QuizOption {
  id: string;
  pattern: string;
}

export interface QuizQuestionData {
  id: string;
  question: string;
  description: string;
  options: QuizOption[];
  correctAnswer: string;
  explanation: string;
}

// Define the Pattern interfaces for patterns.json
export interface PatternExample {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  code: string;
}

export interface PatternData {
  id: string;
  title: string;
  description: string;
  icon: string;
  useCases: string[];
  algorithmicBackground: string;
  examples: PatternExample[];
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

// User interfaces
export interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  profilePicture?: string;
  token?: string;
}

// Progress interfaces
export interface PatternProgress {
  patternId: string;
  completed: boolean;
  lastAccessed: Date;
}

export interface QuizAttempt {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
  timestamp: Date;
}

export interface UserProgress {
  patternsProgress: PatternProgress[];
  quizAttempts: QuizAttempt[];
  quizScore: number;
  totalPatternsViewed: number;
  lastActive: Date;
}

export interface DashboardData {
  totalPatternsViewed: number;
  completedPatterns: number;
  quizScore: number;
  quizAttempts: number;
  lastActive: Date | null;
  recentPatterns: string[];
  patternStats: Record<string, { correct: number; incorrect: number }>;
}

// Request body interfaces
export interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface UpdateProfileRequestBody {
  name?: string;
  email?: string;
  password?: string;
  profilePicture?: string;
}

export interface QuizAnswerRequestBody {
  answer: string;
}