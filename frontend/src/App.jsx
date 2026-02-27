import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ClientMenu from './pages/ClientMenu';
import AdminDashboard from './pages/AdminDashboard';
import AdminMenu from './pages/AdminMenu';
import AdminLogin from './pages/AdminLogin';
import AdminStats from './pages/AdminStats';
import { STORAGE_KEYS } from './utils/constants';

// Composant de protection des routes (Private Route - Standard V2)
const ProtectedRoute = ({ children }) => {
  // On vérifie la présence d'un token JWT. Le cast (!!) convertit la chaîne en booléen.
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const isAuthenticated = !!token;
  
  if (!isAuthenticated) {
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