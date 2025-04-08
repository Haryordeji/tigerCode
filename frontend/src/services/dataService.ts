// frontend/src/services/dataService.ts
export interface PatternCard {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Example {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  code: string;
}

export interface Pattern {
  id: string;
  title: string;
  description: string;
  useCases: string[];
  algorithmicBackground: string;
  examples: Example[];
  icon: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  description: string;
  options: {
    id: string;
    pattern: string;
  }[];
  correctAnswer: string;
  explanation: string;
}

export interface PatternProgress {
  patternId: string;
  completed: boolean;
  lastAccessed: Date;
  viewCount: number;
}

export interface QuizAttempt {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
  timestamp: Date;
  patternTested: string;
}

export interface PatternStats {
  correct: number;
  incorrect: number;
}

export interface PatternPerformance {
  pattern: string;
  accuracy: number;
  attempts: number;
}

export interface DashboardData {
  totalPatternsViewed: number;
  completedPatterns: number;
  completionPercentage: number;
  quizScore: number;
  totalQuizAttempts: number;
  correctQuizCount: number;
  accuracy: number;
  lastActive: Date | null;
  recentPatterns: {
    patternId: string;
    lastAccessed: Date;
    completed: boolean;
    viewCount: number;
  }[];
  patternStats: Record<string, PatternStats>;
  mostViewedPatterns: {
    patternId: string;
    viewCount: number;
  }[];
}

export interface QuizProgressData {
  quizAttempts: QuizAttempt[];
  quizScore: number;
  totalQuestions: number;
  totalQuizAttempts: number;
  correctQuizCount: number;
  incorrectCount: number;
  accuracy: number;
  patternPerformance: Record<string, { 
    correct: number; 
    total: number; 
    accuracy: number;
  }>;
}

export interface QuizSummary {
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
  topPatterns: PatternPerformance[];
}

export interface ProgressOverview {
  patternsProgress: {
    totalAvailable: number;
    viewed: number;
    completed: number;
    completion: number;
  };
  quizProgress: {
    totalQuestions: number;
    totalAttempts: number;
    correctAnswers: number;
    accuracy: number;
    questionsCoverage: number;
  };
  recentActivity: {
    type: 'pattern' | 'quiz';
    id: string;
    date: Date;
    correct?: boolean;
  }[];
}

// Helper function for API requests
const apiRequest = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  try {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...(options?.headers || {})
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Updated functions to use API calls
export const getPatternsList = async (): Promise<PatternCard[]> => {
  return apiRequest<PatternCard[]>('/patterns');
};

export const getPatternById = async (patternId: string): Promise<Pattern> => {
  return apiRequest<Pattern>(`/patterns/${patternId}`);
};

export const getQuizQuestions = async (): Promise<QuizQuestion[]> => {
  return apiRequest<QuizQuestion[]>('/quiz');
};

// Additional API functions
export const completePattern = async (patternId: string): Promise<{ patternId: string; completed: boolean }> => {
  return apiRequest<{ patternId: string; completed: boolean }>(`/patterns/${patternId}/complete`, {
    method: 'PUT'
  });
};

export const getPatternProgress = async (): Promise<{ 
  patternsProgress: PatternProgress[]; 
  totalPatternsViewed: number;
  completedPatterns: number;
  completionRate: number;
  mostViewedPatterns: {
    patternId: string;
    viewCount: number;
    completed: boolean;
  }[];
}> => {
  return apiRequest<{ 
    patternsProgress: PatternProgress[]; 
    totalPatternsViewed: number;
    completedPatterns: number;
    completionRate: number;
    mostViewedPatterns: {
      patternId: string;
      viewCount: number;
      completed: boolean;
    }[];
  }>('/patterns/user/progress');
};

export const submitQuizAnswer = async (questionId: string, answer: string): Promise<{
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  patternTested: string;
}> => {
  return apiRequest<{
    questionId: string;
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
    patternTested: string;
  }>(`/quiz/${questionId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ answer }),
  });
};

export const getQuizProgress = async (): Promise<QuizProgressData> => {
  return apiRequest<QuizProgressData>('/quiz/user/progress');
};

export const getQuizSummary = async (): Promise<QuizSummary> => {
  return apiRequest<QuizSummary>('/quiz/user/summary');
};

export const getUserDashboard = async (): Promise<DashboardData> => {
  return apiRequest<DashboardData>('/users/dashboard');
};

export const getProgressOverview = async (): Promise<ProgressOverview> => {
  return apiRequest<ProgressOverview>('/users/progress-overview');
};

export const getNextQuizQuestion = async (): Promise<{ 
  lastAnsweredIndex: number;
  nextUnansweredIndex: number;
}> => {
  return apiRequest<{ 
    lastAnsweredIndex: number;
    nextUnansweredIndex: number;
  }>('/quiz/user/continue');
};