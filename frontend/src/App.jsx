// On remplace BrowserRouter par HashRouter
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ClientMenu from './pages/ClientMenu';
import AdminDashboard from './pages/AdminDashboard';
import AdminMenu from './pages/AdminMenu';
import AdminLogin from './pages/AdminLogin';
import AdminStats from './pages/AdminStats';

// Composant de protection des routes (Private Route)
const ProtectedRoute = ({ children }) => {
  // Petite note de Master Dev : On garde ta logique V1 pour l'instant, 
  // on la passera en JWT (V2) dès que l'écran s'affichera !
  const isAuthenticated = localStorage.getItem('mada_pos_auth') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    // Ici, le Router est maintenant un HashRouter grâce à l'import plus haut
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
