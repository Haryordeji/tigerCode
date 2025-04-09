import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, googleLogin, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    if (!error) {
      navigate('/');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen pt-16">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-tiger-orange mb-6 text-center">Login to TigerCode</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-tiger-orange"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-tiger-orange"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tiger-orange text-black py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-gray-600">Or login with</p>
          <button
            onClick={googleLogin}
            className="mt-3 w-full border border-gray-300 bg-white text-gray-700 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account? <Link to="/register" className="text-tiger-orange hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};