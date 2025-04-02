import patternsData from '../data/patterns.json';
import quizData from '../data/quiz.json';

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

// to ensure difficulty is one of the allowed values
const validateDifficulty = (difficulty: string): 'Easy' | 'Medium' | 'Hard' => {
  if (difficulty === 'Easy' || difficulty === 'Medium' || difficulty === 'Hard') {
    return difficulty;
  }
  // Default to 'Medium' if an invalid value is provided
  return 'Medium';
};

// these would be the API calls when we connected backend
export const getPatternsList = (): PatternCard[] => {
  return patternsData.patterns.map(pattern => ({
    id: pattern.id,
    title: pattern.title,
    description: pattern.description,
    icon: pattern.icon
  }));
};

export const getPatternById = (patternId: string): Pattern | undefined => {
  const pattern = patternsData.patterns.find(p => p.id === patternId);
  
  if (!pattern) return undefined;
  
  // Transform the pattern to ensure type safety
  return {
    id: pattern.id,
    title: pattern.title,
    description: pattern.description,
    useCases: pattern.useCases,
    algorithmicBackground: pattern.algorithmicBackground,
    icon: pattern.icon,
    examples: pattern.examples.map(example => ({
      id: example.id,
      title: example.title,
      description: example.description,
      difficulty: validateDifficulty(example.difficulty),
      code: example.code
    }))
  };
};

export const getQuizQuestions = (): QuizQuestion[] => {
  return quizData.questions;
};
