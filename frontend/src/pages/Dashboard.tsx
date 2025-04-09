import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getUserDashboard, getQuizSummary, getDiagnosticProgress, DashboardData, QuizSummary, DiagnosticProgressData } from '../services/dataService';

export const Dashboard = () => {
  const { user, diagnosticCompleted, checkingDiagnostic } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [quizSummary, setQuizSummary] = useState<QuizSummary | null>(null);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        // Check diagnostic status
        try {
          const diagProgress = await getDiagnosticProgress();
          setDiagnosticData(diagProgress);
          
          // If diagnostic is not completed, redirect to diagnostic page
          if (!diagProgress.diagnosticCompleted && !checkingDiagnostic) {
            // refresh page
            window.location.reload();
            navigate('/diagnostic');
            return;
          }
        } catch (err) {
          console.error('Failed to load diagnostic progress:', err);
        }
        
        // Fetch dashboard data
        const dashboardData = await getUserDashboard();
        setData(dashboardData);
        
        // Fetch quiz summary
        try {
          const summary = await getQuizSummary();
          setQuizSummary(summary);
        } catch (err) {
          console.error('Failed to load quiz summary:', err);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, checkingDiagnostic]);

  if (loading || checkingDiagnostic) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tiger-orange"></div>
      </div>
    );
  }

  if (!diagnosticCompleted && !checkingDiagnostic) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h1 className="text-3xl font-bold text-tiger-orange mb-4">Diagnostic Quiz Required</h1>
          <p className="mb-8">Before you can access your dashboard, please complete the diagnostic quiz to help us understand your current skill level.</p>
          <Link to="/diagnostic">
            <button className="bg-tiger-orange text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-colors">
              Take Diagnostic Quiz
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
      <h1 className="text-3xl font-bold text-tiger-orange mb-8">Your Dashboard</h1>
      
      {/* Summary Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 mx-auto max-w-5xl">
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Patterns Completed</h3>
          <p className="text-3xl font-bold">{data.completedPatterns}</p>
          {data.totalPatternsViewed > 0 && (
            <p className="text-sm text-gray-500">
              {((data.completedPatterns / data.totalPatternsViewed) * 100).toFixed(1)}% of viewed patterns
            </p>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Quiz Score</h3>
          <p className="text-3xl font-bold">{data.quizScore}</p>
          <p className="text-sm text-gray-500">
            {data.accuracy.toFixed(1)}% accuracy rate
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Quiz Attempts</h3>
          <p className="text-3xl font-bold">{data.totalQuizAttempts}</p>
          <p className="text-sm text-gray-500">
            {data.correctQuizCount} correct answers
          </p>
        </div>
      </div>
  
        {/* Diagnostic Results Summary */}
        {diagnosticData && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-tiger-orange mb-4">Diagnostic Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Score</h3>
              <p className="text-3xl font-bold">{diagnosticData.diagnosticScore}/{diagnosticData.totalQuestions}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Accuracy</h3>
              <p className="text-3xl font-bold">{diagnosticData.accuracy.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Date Completed</h3>
              <p className="text-lg">
                {diagnosticData.lastDiagnosticAttempt 
                  ? new Date(diagnosticData.lastDiagnosticAttempt).toLocaleDateString() 
                  : 'Not completed'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Pattern Quiz Performance */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-tiger-orange mb-4">Pattern Quiz Performance</h2>
          
          {data.patternStats && Object.keys(data.patternStats).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(data.patternStats).map(([pattern, stats]) => {
                const total = stats.correct + stats.incorrect;
                const percentage = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
                
                return (
                  <div key={pattern} className="border-b pb-3">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">
                        {pattern.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                      <span className="text-gray-600">{percentage}% correct</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          percentage >= 70 ? 'bg-green-500' :
                          percentage >= 40 ? 'bg-tiger-orange' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {stats.correct} correct, {stats.incorrect} incorrect
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No quiz attempts yet.</p>
          )}
          
          <div className="mt-4">
            <Link 
              to="/quiz"
              className="text-tiger-orange hover:underline font-medium"
            >
              Take the quiz →
            </Link>
          </div>
        </div>
        
        {/* Top Performing Patterns */}
        {quizSummary && quizSummary.topPatterns.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-tiger-orange mb-4">Your Top Patterns</h2>
            
            <div className="space-y-4">
              {quizSummary.topPatterns.map((pattern) => (
                <div key={pattern.pattern} className="border-b pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {pattern.pattern.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pattern.attempts} quiz attempts
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium">
                      {pattern.accuracy.toFixed(0)}% accuracy
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-gray-600">
                Continue practicing to improve your pattern recognition skills!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};