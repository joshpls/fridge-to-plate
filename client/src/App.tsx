import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import Discovery from './views/Discovery';
import RecipeDetail from './views/RecipeDetail';
import ShoppingList from './views/ShoppingList';
import Favorites from './views/Favorites';
import Pantry from './views/Pantry';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Toaster />
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="container mx-auto py-8">
          <Routes>
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/recipe/:slug" element={<RecipeDetail />} />
            <Route path="/shopping-list" element={<ShoppingList />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/pantry" element={<Pantry />} />
            
            {/* Redirect root to discovery */}
            <Route path="/" element={<Navigate to="/discovery" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;