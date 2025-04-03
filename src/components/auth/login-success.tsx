// LoginSuccess.tsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import type { AuthResponse } from '../../types/api';

export default function LoginSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      setToken(token);
      // Fetch user data based on token
      fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data: AuthResponse) => {
          setUser(data.user);
          navigate('/dashboard');
        })
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  }, [location, navigate, setToken, setUser]);

  return <div>Logging you in, please wait...</div>;
}
