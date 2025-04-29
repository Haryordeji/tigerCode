import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  getDiagnosticQuestions, 
  submitDiagnosticAnswer, 
  getDiagnosticProgress,
  manuallyCompleteDiagnostic,
  QuizQuestion,
  DiagnosticAttempt,
  DiagnosticProgressData
} from '../services/dataService';

export const Diagnostic = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [diagnosticCompleted, setDiagnosticCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean;
    explanation: string;
    patternTested: string;
  } | null>(null);
  const [, setDiagnosticProgress] = useState<DiagnosticProgressData | null>(null);
  const [completedQuestions, setCompletedQuestions] = useState<Map<string, DiagnosticAttempt>>(new Map());
  const { user, updateDiagnosticStatus } = useAuth();  

const navigate = useNavigate();
  
  // Session stats
  const [, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    patternStats: {} as Record<string, { correct: number, incorrect: number }>
  });

  useEffect(() => {
    const fetchDiagnosticData = async () => {
      try {
        setLoading(true);
        
        // Get all diagnostic questions
        const diagnosticQuestions = await getDiagnosticQuestions();
        setQuestions(diagnosticQuestions);
        
        // If user is logged in, get their diagnostic progress
        if (user) {
          try {
            const progress = await getDiagnosticProgress();
            setDiagnosticProgress(progress);
            
            // If diagnostic is already completed, redirect to dashboard
            if (progress.diagnosticCompleted) {
              setDiagnosticCompleted(true);
              return;
            }
            
            // Create a map of completed questions
            const completedMap = new Map<string, DiagnosticAttempt>();
            progress.diagnosticAttempts.forEach(attempt => {
              completedMap.set(attempt.questionId, attempt);
            });
            setCompletedQuestions(completedMap);
            
            // Set current score
            setScore(progress.diagnosticScore);
            
            // Find the first unanswered question
            if (diagnosticQuestions.length > 0 && progress.diagnosticAttempts.length > 0) {
              const answeredIds = new Set(progress.diagnosticAttempts.map(a => a.questionId));
              const firstUnansweredIndex = diagnosticQuestions.findIndex(q => !answeredIds.has(q.id));
              
              if (firstUnansweredIndex !== -1) {
                setCurrentQuestionIndex(firstUnansweredIndex);
              } else {
                // All questions have been answered - mark as completed
                setDiagnosticCompleted(true);
              }
            }
          } catch (err) {
            console.error('Failed to load diagnostic progress:', err);
          }
        }
      } catch (err) {
        setError('Failed to load diagnostic questions. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnosticData();
  }, [user, navigate]);

  // Redirect to dashboard if diagnostic is completed
  useEffect(() => {
    if (diagnosticCompleted && !loading) {
      setTimeout(() => {
        navigate('/dashboard');
      }, 5000);
    }
  }, [diagnosticCompleted, loading, navigate]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleCheckAnswer = async () => {
    if (!selectedOption || !currentQuestion) return;
    
    setShowAnswer(true);
    
    try {
      if (user) {
        // If logged in, submit answer to API
        const result = await submitDiagnosticAnswer(currentQuestion.id, selectedOption);
        
        // Update answer result state
        setAnswerResult({
          isCorrect: result.isCorrect,
          explanation: result.explanation,
          patternTested: result.patternTested
        });
        
        // Update completedQuestions map
        setCompletedQuestions(prev => {
          const newMap = new Map(prev);
          newMap.set(currentQuestion.id, {
            questionId: currentQuestion.id,
            selectedAnswer: selectedOption,
            correct: result.isCorrect,
            timestamp: new Date(),
            patternTested: result.patternTested
          });
          return newMap;
        });
        
        // Update session stats
        setSessionStats(prev => {
          const newStats = { ...prev };
          
          // Update overall correct/incorrect count
          if (result.isCorrect) {
            newStats.correct += 1;
            setScore(score + 1);
          } else {
            newStats.incorrect += 1;
          }
          
          // Update pattern-specific stats
          if (result.patternTested) {
            if (!newStats.patternStats[result.patternTested]) {
              newStats.patternStats[result.patternTested] = { correct: 0, incorrect: 0 };
            }
            
            if (result.isCorrect) {
              newStats.patternStats[result.patternTested].correct += 1;
            } else {
              newStats.patternStats[result.patternTested].incorrect += 1;
            }
          }
          
          return newStats;
        });
      } else {
        // Alert user they need to log in to take the diagnostic
        setError('You need to log in to take the diagnostic quiz');
        return;
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
      setError('Failed to submit answer. Please try again.');
    }
  };

  const handleNextQuestion = async () => {
    setSelectedOption(null);
    setShowAnswer(false);
    setAnswerResult(null);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Show loading state
      setLoading(true);
      try {
        // First check if it's already marked as completed
        const progress = await getDiagnosticProgress();
        
        if (!progress.diagnosticCompleted) {
          // If not completed, manually complete it
          await manuallyCompleteDiagnostic();
        }
        
        // Update local state
        setDiagnosticCompleted(true);
        
        // This is the key part: update the auth context
        if (updateDiagnosticStatus) {
          updateDiagnosticStatus(true);
        }
        
        setLoading(false);
        
        // Navigate immediately to dashboard instead of waiting
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Failed to complete diagnostic:', err);
        setLoading(false);
        setDiagnosticCompleted(true);
        
        // Even if it fails, redirect after a short delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      }
    }
  };
  

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tiger-orange"></div>
      </div>
    );
  }

  if (diagnosticCompleted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-tiger-orange mb-6">Diagnostic Quiz Completed!</h1>
          <p className="mb-4">Thank you for completing the diagnostic quiz. Your results have been saved.</p>
          <p className="mb-8">You'll be redirected to the dashboard in a few seconds...</p>
          <div className="animate-spin mx-auto rounded-full h-8 w-8 border-t-2 border-b-2 border-tiger-orange"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <div className="mt-4">
          <button 
            onClick={() => navigate('/login')}
            className="bg-tiger-orange text-black px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-tiger-orange mb-6">No Questions Available</h1>
          <p className="mb-4">We couldn't find any diagnostic questions. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-tiger-orange">Diagnostic Quiz</h1>
        <div className="text-gray-600">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-2">{currentQuestion.question}</h2>
          <p className="text-gray-600">{currentQuestion.description}</p>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Which pattern would you use to solve this problem?</h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <div 
                key={option.id}
                onClick={() => !showAnswer && handleOptionSelect(option.id)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedOption === option.id 
                    ? 'bg-tiger-orange bg-opacity-10 border-2 border-tiger-orange' 
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                } ${
                  showAnswer && option.id === currentQuestion.correctAnswer
                    ? 'bg-green-100 border-2 border-green-500'
                    : showAnswer && option.id === selectedOption && option.id !== currentQuestion.correctAnswer
                      ? 'bg-red-100 border-2 border-red-500'
                      : ''
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    selectedOption === option.id ? 'bg-tiger-orange text-white' : 'bg-gray-200'
                  } ${
                    showAnswer && option.id === currentQuestion.correctAnswer
                      ? 'bg-green-500 text-white'
                      : showAnswer && option.id === selectedOption && option.id !== currentQuestion.correctAnswer
                        ? 'bg-red-500 text-white'
                        : ''
                  }`}>
                    {option.id.toUpperCase()}
                  </div>
                  <span className="font-medium">{option.pattern}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showAnswer && answerResult && (
          <div className="p-6 bg-gray-50 border-t">
            <div className="flex items-center mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium mr-3 ${
                answerResult.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {answerResult.isCorrect ? 'Correct!' : 'Incorrect'}
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-tiger-orange mb-2">Explanation</h3>
            <p className="text-gray-700">{answerResult.explanation}</p>
          </div>
        )}

        <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
        <div className="text-gray-600">
          Current score: {score}/{completedQuestions.size}
        </div>
          
          {!showAnswer ? (
            <button
              onClick={handleCheckAnswer}
              disabled={!selectedOption}
              className={`px-6 py-2 rounded-lg font-medium ${
                selectedOption 
                  ? 'bg-tiger-orange text-black hover:bg-opacity-90' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              } transition-colors`}
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="bg-tiger-orange text-black px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Diagnostic'}
            </button>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Progress</h3>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-tiger-orange h-2.5 rounded-full"
            style={{ width: `${(completedQuestions.size / questions.length) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{completedQuestions.size} of {questions.length} questions answered</span>
          <span>{Math.round((completedQuestions.size / questions.length) * 100)}% complete</span>
        </div>
      </div>
    </div>
  );
};