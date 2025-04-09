export const Home = () => {
  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <div className="bg-black text-white py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6">
            <span className="text-tiger-orange">Bridge</span> The Gap<br />

          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-12">
            Use our platform to develop pattern recogntion skills needed to get you started with interview-style questions.
          </p>
          <button className="bg-tiger-orange text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-colors"
          onClick={() => window.location.href = '/patterns'}>
            Start Learning Now
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-black rounded-2xl p-6 mb-4">
                <h3 className="text-xl font-semibold text-tiger-orange">Pattern Recognition</h3>
                <p className="text-gray-300 mt-2">Master common algorithmic patterns for technical interviews</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-black rounded-2xl p-6 mb-4">
                <h3 className="text-xl font-semibold text-tiger-orange">Interactive Learning</h3>
                <p className="text-gray-300 mt-2">Practice with hands-on quizes and real-time feedback</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-black rounded-2xl p-6 mb-4">
                <h3 className="text-xl font-semibold text-tiger-orange">AI Guidance</h3>
                <p className="text-gray-300 mt-2">Detailed real time feedback from AI after each question</p>
              </div>
            </div>
          </div>
          
          {/* Developer Attribution */}
          <div className="text-center mt-16">
            <div className="inline-block py-2 px-4 bg-black text-white rounded-lg">
              <p className="text-sm">
                <span className="opacity-75">Developed by</span> <span className="font-medium text-tiger-orange">Brandon Ambetsa and Ayo Olusanya</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};