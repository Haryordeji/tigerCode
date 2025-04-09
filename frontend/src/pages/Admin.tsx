import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { downloadDiagnosticResults } from '../services/dataService';
import { useNavigate } from 'react-router-dom';

export const Admin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Access Denied:</strong>
          <span className="block sm:inline"> You don't have permission to access this page.</span>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 bg-tiger-orange text-black px-4 py-2 rounded font-medium hover:bg-opacity-90 transition"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const handleDownloadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const blob = await downloadDiagnosticResults();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a download link and click it
      const link = document.createElement('a');
      link.href = url;
      link.download = 'tigercode-user-performance.csv';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to download results. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
      <h1 className="text-3xl font-bold text-tiger-orange mb-8">Admin Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-tiger-orange mb-4">User Performance Data</h2>
        <p className="mb-4 text-gray-700">
          Download user performance data for both diagnostic quiz and regular quizzes as a CSV file.
          This includes user information, scores, and pattern-specific performance metrics.
        </p>
        
        <button 
          onClick={handleDownloadResults}
          disabled={loading}
          className="bg-tiger-orange text-black px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black mr-2"></span>
              Downloading...
            </>
          ) : 'Download Performance Data'}
        </button>
      </div>
    </div>
  );
};