import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getPatternsList, PatternCard } from '../services/dataService';

export const Patterns = () => {
  const [patterns, setPatterns] = useState<PatternCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        setLoading(true);
        const patternsData = await getPatternsList();
        setPatterns(patternsData);
      } catch (err) {
        setError('Failed to load patterns. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatterns();
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-tiger-orange mb-4">Coding Patterns</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Master these fundamental patterns to tackle a wide range of coding interview questions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {patterns.map((pattern) => (
          <Link 
            key={pattern.id}
            to={`/patterns/${pattern.id}`}
            className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="text-4xl mb-4">{pattern.icon}</div>
              <h2 className="text-2xl font-bold text-tiger-orange mb-2">{pattern.title}</h2>
              <p className="text-gray-600">{pattern.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};