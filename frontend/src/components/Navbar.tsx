import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black bg-opacity-95 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-tiger-orange">
            TigerCode
          </Link>
          <div className="flex items-center gap-8">
            <Link to="/patterns" className="text-white hover:text-tiger-orange transition-colors">
              Patterns
            </Link>
            <Link to="/quiz" className="text-white hover:text-tiger-orange transition-colors">
              Quiz
            </Link>
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="text-white hover:text-tiger-orange transition-colors">
                  Dashboard
                </Link>
                <button 
                  onClick={logout}
                  className="bg-tiger-orange text-black px-6 py-2 rounded-full font-medium hover:bg-opacity-90 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login">
                <button className="bg-tiger-orange text-black px-6 py-2 rounded-full font-medium hover:bg-opacity-90 transition-colors">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};