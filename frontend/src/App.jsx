import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ClientMenu from './pages/ClientMenu';
import AdminDashboard from './pages/AdminDashboard';
import AdminMenu from './pages/AdminMenu';
import AdminLogin from './pages/AdminLogin';
// En haut, ajoutez cette ligne avec les autres imports :
import AdminStats from './pages/AdminStats';

// Composant de protection des routes (Private Route)
// Il vérifie la présence du token dans le localStorage
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('mada_pos_auth') === 'true';
  
  if (!isAuthenticated) {
    // Redirection vers la page de login si non autorisé
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes Publiques */}
        <Route path="/" element={<ClientMenu />} />
        <Route path="/login" element={<AdminLogin />} />
        
        {/* Routes Protégées (Administration) */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/menu" 
          element={
            <ProtectedRoute>
              <AdminMenu />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/stats" 
          element={
            <ProtectedRoute>
              <AdminStats />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;