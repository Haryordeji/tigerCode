import { useState, useEffect } from 'react';
import { getQuizQuestions, submitQuizAnswer, QuizQuestion } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const Quiz = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean;
    explanation: string;
    patternTested: string;
  } | null>(null);
  const { user } = useAuth();
  
  // Track correct/incorrect for this session
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    patternStats: {} as Record<string, { correct: number, incorrect: number }>
  });

  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        setLoading(true);
        const quizQuestions = await getQuizQuestions();
        setQuestions(quizQuestions);
      } catch (err) {
        setError('Failed to load quiz questions. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizQuestions();
  }, []);

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
        const result = await submitQuizAnswer(currentQuestion.id, selectedOption);
        
        // Update answer result state
        setAnswerResult({
          isCorrect: result.isCorrect,
          explanation: result.explanation,
          patternTested: result.patternTested
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
        // If not logged in, check answer locally
        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        
        // Find pattern tested
        const correctOption = currentQuestion.options.find(
          opt => opt.id === currentQuestion.correctAnswer
        );
        const patternTested = correctOption ? correctOption.pattern : '';
        
        setAnswerResult({
          isCorrect,
          explanation: currentQuestion.explanation,
          patternTested
        });
        
        // Update session stats (local only)
        setSessionStats(prev => {
          const newStats = { ...prev };
          
          if (isCorrect) {
            newStats.correct += 1;
            setScore(score + 1);
          } else {
            newStats.incorrect += 1;
          }
          
          if (patternTested) {
            if (!newStats.patternStats[patternTested]) {
              newStats.patternStats[patternTested] = { correct: 0, incorrect: 0 };
            }
            
            if (isCorrect) {
              newStats.patternStats[patternTested].correct += 1;
            } else {
              newStats.patternStats[patternTested].incorrect += 1;
            }
          }
          
          return newStats;
        });
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
      // Fallback to local checking if API fails
      const isCorrect = selectedOption === currentQuestion.correctAnswer;
      
      // Find pattern tested
      const correctOption = currentQuestion.options.find(
        opt => opt.id === currentQuestion.correctAnswer
      );
      const patternTested = correctOption ? correctOption.pattern : '';
      
      setAnswerResult({
        isCorrect,
        explanation: currentQuestion.explanation,
        patternTested
      });
      
      if (isCorrect) {
        setScore(score + 1);
        setSessionStats(prev => ({
          ...prev,
          correct: prev.correct + 1
        }));
      } else {
        setSessionStats(prev => ({
          ...prev,
          incorrect: prev.incorrect + 1
        }));
      }
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setShowAnswer(false);
    setAnswerResult(null);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setScore(0);
    setQuizCompleted(false);
    setAnswerResult(null);
    // Reset session stats
    setSessionStats({
      correct: 0,
      incorrect: 0,
      patternStats: {}
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tiger-orange"></div>
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
      </div>
    );
  }

  if (quizCompleted) {
    // Calculate stats for completed quiz
    const totalAnswered = sessionStats.correct + sessionStats.incorrect;
    const accuracy = totalAnswered > 0 ? Math.round((sessionStats.correct / totalAnswered) * 100) : 0;
    
    // Get pattern performance sorted by accuracy (highest first)
    const patternPerformance = Object.entries(sessionStats.patternStats).map(([pattern, stats]) => {
      const total = stats.correct + stats.incorrect;
      const accuracy = total > 0 ? (stats.correct / total) * 100 : 0;
      return {
        pattern,
        correct: stats.correct,
        incorrect: stats.incorrect,
        total,
        accuracy
      };
    }).sort((a, b) => b.accuracy - a.accuracy);
    
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-tiger-orange mb-6 text-center">Quiz Completed!</h1>
          
          <div className="mb-8 text-center">
            <p className="text-2xl mb-2">Your Score: <span className="font-bold">{score}/{questions.length}</span></p>
            <p className="text-gray-600">Accuracy: {accuracy}%</p>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div 
                className={`h-3 rounded-full ${
                  accuracy >= 70 ? 'bg-green-500' :
                  accuracy >= 40 ? 'bg-tiger-orange' :
                  'bg-red-500'
                }`}
                style={{ width: `${accuracy}%` }}
              ></div>
            </div>
          </div>
          
          {patternPerformance.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Performance by Pattern</h2>
              <div className="space-y-4">
                {patternPerformance.map(pattern => (
                  <div key={pattern.pattern} className="border-b pb-3">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">
                        {pattern.pattern.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                      <span className="text-gray-600">{Math.round(pattern.accuracy)}% correct</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          pattern.accuracy >= 70 ? 'bg-green-500' :
                          pattern.accuracy >= 40 ? 'bg-tiger-orange' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${pattern.accuracy}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {pattern.correct} correct, {pattern.incorrect} incorrect
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-center">
            <p className="mb-6 text-gray-600">
              {accuracy === 100 
                ? 'Perfect score! You\'re a pattern recognition master!' 
                : accuracy >= 70 
                  ? 'Great job! You\'re getting the hang of pattern recognition.' 
                  : 'Keep practicing! Pattern recognition takes time to master.'}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={handleRestartQuiz}
                className="bg-tiger-orange text-black px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
              >
                Restart Quiz
              </button>
              
              <Link 
                to="/dashboard"
                className="bg-white text-tiger-orange border border-tiger-orange px-6 py-3 rounded-lg font-semibold hover:bg-tiger-orange hover:text-white transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-tiger-orange mb-6">No Questions Available</h1>
          <p className="mb-4">We couldn't find any quiz questions. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-tiger-orange">Pattern Recognition Quiz</h1>
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
              
              {answerResult.patternTested && (
                <Link 
                  to={`/patterns/${answerResult.patternTested}`}
                  className="text-tiger-orange hover:underline"
                >
                  Learn more about {answerResult.patternTested.split('-').map(
                    word => word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Link>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-tiger-orange mb-2">Explanation</h3>
            <p className="text-gray-700">{answerResult.explanation}</p>
          </div>
        )}

        <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
          <div className="text-gray-600">
            Current score: {score}/{currentQuestionIndex + (showAnswer ? 1 : 0)}
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
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          )}
        </div>
      </div>
      
      {currentQuestionIndex > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-gray-600">
            Session progress: {sessionStats.correct} correct, {sessionStats.incorrect} incorrect
          </div>
          
          <button 
            onClick={handleRestartQuiz}
            className="text-tiger-orange hover:underline"
          >
            Restart Quiz
          </button>
        </div>
      )}
    </div>
  );
};