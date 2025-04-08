import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface DashboardData {
  totalPatternsViewed: number;
  completedPatterns: number;
  quizScore: number;
  quizAttempts: number;
  recentPatterns: string[];
  patternStats: Record<string, { correct: number; incorrect: number }>;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const response = await fetch('/api/users/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tiger-orange"></div>
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
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Stats Cards */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Patterns Viewed</h3>
          <p className="text-3xl font-bold">{data.totalPatternsViewed}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Patterns Completed</h3>
          <p className="text-3xl font-bold">{data.completedPatterns}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Quiz Score</h3>
          <p className="text-3xl font-bold">{data.quizScore}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Quiz Attempts</h3>
          <p className="text-3xl font-bold">{data.quizAttempts}</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Patterns */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-tiger-orange mb-4">Recently Viewed Patterns</h2>
          
          {data.recentPatterns.length > 0 ? (
            <ul className="space-y-3">
              {data.recentPatterns.map((patternId) => (
                <li key={patternId} className="border-b pb-2">
                  <Link 
                    to={`/patterns/${patternId}`}
                    className="text-gray-800 hover:text-tiger-orange transition-colors"
                  >
                    {patternId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No patterns viewed yet.</p>
          )}
          
          <div className="mt-4">
            <Link 
              to="/patterns"
              className="text-tiger-orange hover:underline font-medium"
            >
              View all patterns →
            </Link>
          </div>
        </div>
        
        {/* Pattern Performance */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-tiger-orange mb-4">Pattern Quiz Performance</h2>
          
          {Object.keys(data.patternStats).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(data.patternStats).map(([pattern, stats]) => {
                const total = stats.correct + stats.incorrect;
                const percentage = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
                
                return (
                  <div key={pattern} className="border-b pb-3">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{pattern}</span>
                      <span className="text-gray-600">{percentage}% correct</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-tiger-orange h-2.5 rounded-full" 
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
      </div>
    </div>
  );
};