import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Patterns } from './pages/Patterns';
import { PatternDetail } from './pages/PatternDetail';
import { Quiz } from './pages/Quiz';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/patterns" element={<Patterns />} />
          <Route path="/patterns/:patternId" element={<PatternDetail />} />
          <Route path="/quiz" element={<Quiz />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
