import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Discovery } from './views/Discovery';
import Favorites from './views/Favorites';
import PantryManager from './components/PantryManager';
import { RecipeDetail } from './views/RecipeDetail';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 p-4 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="text-xl font-black text-orange-600 tracking-tighter">
              FRIDGE2PLATE
            </Link>
            <div className="flex gap-6">
              <Link to="/pantry" className="text-gray-600 font-semibold hover:text-orange-500 transition-colors">
                🛒 My Pantry
              </Link>
              <Link to="/discovery" className="text-gray-600 font-semibold hover:text-orange-500 transition-colors">
                🔍 Find Recipes
              </Link>
              <Link to="/favorites" className="text-gray-600 font-semibold hover:text-red-500 transition-colors">
                ❤️ Favorites
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto">
          <Routes>
            {/* Set Pantry as the default landing page */}
            <Route path="/" element={<PantryManager />} />
            <Route path="/pantry" element={<PantryManager />} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/recipe/:slug" element={<RecipeDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;