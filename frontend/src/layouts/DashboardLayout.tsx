import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-4">Doc Manager</h2>
        <nav className="flex flex-col space-y-2">
          <Link to="/dashboard" className="hover:bg-gray-200 p-2 rounded">
            Dashboard
          </Link>
          <Link to="/documents" className="hover:bg-gray-200 p-2 rounded">
            Documents
          </Link>

          {/* Admin-only links */}
          {user?.role === 'admin' && (
            <>
              <Link to="/users" className="hover:bg-gray-200 p-2 rounded">
                Manage Users
              </Link>
              <Link to="/ingestion" className="hover:bg-gray-200 p-2 rounded">
                Ingestion Management
              </Link>
            </>
          )}

          {/* Editor with ingestion rights */}
          {user?.role === 'editor' && user?.canTriggerIngestion && (
            <Link to="/ingestion" className="hover:bg-gray-200 p-2 rounded">
              Ingestion
            </Link>
          )}
        </nav>
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <span>Welcome, {user?.email}</span>
        </header>

        <div className="p-6 flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}