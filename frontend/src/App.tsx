import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DocumentsPage from './pages/Documents/DocumentsPage';
import UsersPage from './pages/Users/UsersPage';
import IngestionPage from './pages/Ingestion/IngestionPage';
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/ingestion" element={<IngestionPage />} />
      </Route>

      {/* Admin-only */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/users" element={<UsersPage />} />
      </Route>

      <Route path="*" element={`<h1>404 - Not Found</h1>`} />
    </Routes>
  );
}