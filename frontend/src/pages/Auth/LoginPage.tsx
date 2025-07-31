import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

type JwtPayload = {
  sub: string;
  email?: string;
  role: 'admin' | 'editor' | 'viewer';
  canTriggerIngestion?: boolean;
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ✅ Call backend login API
      const res = await api.post('/auth/login', { email, password });

      const token = res.data.access_token;
      if (!token) throw new Error('Invalid token received');

      // ✅ Decode JWT to extract user details
      const decoded: JwtPayload = jwtDecode(token);

      const userData = {
        id: decoded.sub,
        email: decoded.email || email,
        role: decoded.role,
        canTriggerIngestion: decoded.canTriggerIngestion ?? false,
      };

      // ✅ Save data to AuthContext and localStorage for persistence
      login(token, userData);

      // Store both token and user in localStorage explicitly
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      // ✅ Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded shadow-md w-80 space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">Login</h1>
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}