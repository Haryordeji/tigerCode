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

export const getPatternProgress = async (): Promise<{ patternsProgress: any[]; totalPatternsViewed: number }> => {
  return apiRequest<{ patternsProgress: any[]; totalPatternsViewed: number }>('/patterns/user/progress');
};

export const submitQuizAnswer = async (questionId: string, answer: string): Promise<{
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}> => {
  return apiRequest<{
    questionId: string;
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
  }>(`/quiz/${questionId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ answer }),
  });
};

export const getQuizProgress = async (): Promise<{
  quizAttempts: any[];
  quizScore: number;
  totalQuestions: number;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracy: number;
}> => {
  return apiRequest<{
    quizAttempts: any[];
    quizScore: number;
    totalQuestions: number;
    totalAttempts: number;
    correctAttempts: number;
    incorrectAttempts: number;
    accuracy: number;
  }>('/quiz/user/progress');
};