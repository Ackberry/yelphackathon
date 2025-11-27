import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import ProtectedRoute from './components/auth/ProtectedRoute';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
        <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
