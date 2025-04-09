import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getPatternById, completePattern, getPatternProgress, Pattern } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';

export const PatternDetail = () => {
  const { patternId } = useParams<{ patternId: string }>();
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPattern = async () => {
      if (!patternId) return;
      
      try {
        setLoading(true);
        const patternData = await getPatternById(patternId);
        setPattern(patternData);
        
        // If user is logged in, check if pattern is completed
        if (user) {
          try {
            const progress = await getPatternProgress();
            const patternProgress = progress.patternsProgress.find(p => p.patternId === patternId);
            if (patternProgress) {
              setCompleted(patternProgress.completed);
            }
          } catch (err) {
            // Silently fail - we'll just show the pattern as not completed
            console.error('Failed to fetch pattern progress:', err);
          }
        }
      } catch (err) {
        setError('Failed to load pattern details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPattern();
    
    // Track view in analytics (if needed)
    const trackPatternView = async () => {
      // This is where you could add additional tracking logic if needed
      console.log(`Pattern viewed: ${patternId}`);
    };
    
    trackPatternView();
  }, [patternId, user]); // Re-run if patternId or user changes

  const handleMarkComplete = async () => {
    if (!patternId || !user) return;
    
    try {
      const result = await completePattern(patternId);
      setCompleted(result.completed);
    } catch (err) {
      console.error('Failed to mark pattern as completed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tiger-orange"></div>
      </div>
    );
  }

  if (error || !pattern) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-tiger-orange">Pattern Not Found</h1>
        <p className="mt-4">{error || "The pattern you're looking for doesn't exist."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-tiger-orange">{pattern.title}</h1>
        {user && (
          <button 
            onClick={handleMarkComplete}
            disabled={completed}
            className={`px-4 py-2 rounded-lg ${completed 
              ? 'bg-green-100 text-green-800 cursor-default' 
              : 'bg-tiger-orange text-black hover:bg-opacity-90'}`}
          >
            {completed ? 'Completed' : 'Mark as Complete'}
          </button>
        )}
      </div>
      
      {/* Pattern Description */}
      <div className="mb-10">
        <p className="text-lg mb-6">{pattern.description}</p>
      </div>
      
      {/* Use Cases */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-tiger-orange mb-4">When to Use This Pattern</h2>
        <ul className="list-disc pl-6 space-y-2">
          {pattern.useCases.map((useCase, index) => (
            <li key={index} className="text-gray-800">{useCase}</li>
          ))}
        </ul>
      </div>
      
      {/* Algorithmic Background */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-tiger-orange mb-4">Algorithmic Background</h2>
        <p className="text-gray-800">{pattern.algorithmicBackground}</p>
      </div>
      
      {/* Examples */}
      <div>
        <h2 className="text-2xl font-bold text-tiger-orange mb-6">Example Problems</h2>
        
        <div className="space-y-8">
          {pattern.examples.map((example) => (
            <div key={example.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-gray-900">{example.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    example.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    example.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {example.difficulty}
                  </span>
                </div>
                <p className="mt-3 text-gray-700">{example.description}</p>
                
                <div className="mt-6 bg-gray-50 rounded-md p-4">
                  <pre className="text-sm overflow-x-auto">
                    <code className="language-typescript">{example.code}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};