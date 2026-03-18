import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Toaster } from 'react-hot-toast';
import Discovery from './views/Discovery';
import RecipeDetail from './views/RecipeDetail';
import ShoppingList from './views/ShoppingList';
import Favorites from './views/Favorites';
import Pantry from './views/Pantry';
import AddRecipe from './views/AddRecipe';
import Auth from './views/Auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import AdminDashboard from './views/AdminDashboard';
import Profile from './views/Profile';

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
            <Route path="/recipe/add" element={<AddRecipe />} />
            <Route path="/edit-recipe/:slug" element={<AddRecipe />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Redirect root to discovery */}
            <Route path="/" element={<Navigate to="/discovery" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;