import { useState, useEffect } from 'react';
import { getQuizQuestions, QuizQuestion } from '../services/dataService';

export const Quiz = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    setTimeout(() => {
      const quizQuestions = getQuizQuestions();
      setQuestions(quizQuestions);
      setLoading(false);
    }, 300);
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleCheckAnswer = () => {
    setShowAnswer(true);
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setShowAnswer(false);
    
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
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tiger-orange"></div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-tiger-orange mb-6">Quiz Completed!</h1>
          <p className="text-2xl mb-4">Your Score: <span className="font-bold">{score}/{questions.length}</span></p>
          <p className="mb-8 text-gray-600">
            {score === questions.length 
              ? 'Perfect score! You\'re a pattern recognition master!' 
              : score >= questions.length / 2 
                ? 'Good job! You\'re getting the hang of pattern recognition.' 
                : 'Keep practicing! Pattern recognition takes time to master.'}
          </p>
          <button 
            onClick={handleRestartQuiz}
            className="bg-tiger-orange text-black px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
          >
            Restart Quiz
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

        {showAnswer && (
          <div className="p-6 bg-gray-50 border-t">
            <h3 className="text-lg font-semibold text-tiger-orange mb-2">Explanation</h3>
            <p className="text-gray-700">{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="p-6 bg-gray-50 border-t flex justify-end">
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
    </div>
  );
};
