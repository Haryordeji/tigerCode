export const Footer = () => {
  return (
    <footer className="bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col text-sm text-gray-400">
            <div className="mt-1">Developed by <span className="text-tiger-orange">Ayo Olusanya</span> and <span className="text-tiger-orange">Brandon Ambetsa</span></div>
            <div>{new Date().getFullYear()} TigerCode. All rights reserved.</div>
          </div>
          <div className="flex gap-8">
            <a href="/patterns" className="text-white hover:text-tiger-orange transition-colors">
              Patterns
            </a>
            <a href="/quiz" className="text-white hover:text-tiger-orange transition-colors">
              Quiz
            </a>
            <a 
              href="https://www.princeton.edu" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-tiger-orange transition-colors"
            >
              Princeton University
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};