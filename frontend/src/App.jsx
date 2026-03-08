import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import api from './utils/api';
import Layout from './components/Layout';

import MenuPage from './pages/MenuPage';
import CommunityPage from './pages/CommunityPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import TrackPage from './pages/TrackPage';
import DeliveryPage from './pages/DeliveryPage';
import AdminPage from './pages/AdminPage';
import RegisterPage from './pages/RegisterPage';

function Authenticator() {
  const { setUser, user, token, setTempTgUser, logout } = useAppStore();
  const navigate = useNavigate();
  const [authAttempted, setAuthAttempted] = useState(false);

  useEffect(() => {
    if (authAttempted || user) return;

    const authenticate = async () => {
      // Step 1: If token exists, try to restore session
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.id) {
            setUser(res.data, token);
            setAuthAttempted(true);
            return; // Success — session restored
          }
        } catch (err) {
          console.warn('Token expired or invalid, clearing...');
          logout(); // Clear stale token
        }
      }

      // Step 2: Try Telegram WebApp login (only if no valid session)
      const tg = window.Telegram?.WebApp;
      if (tg && tg.initData) {
        tg.ready();
        tg.expand();

        try {
          const res = await api.post('/auth/login', { initData: tg.initData });
          if (res.data.requiresRegistration) {
            setTempTgUser(res.data.tgUser);
            if (window.location.pathname !== '/register') {
              navigate('/register');
            }
          } else if (res.data.token) {
            setUser(res.data.user, res.data.token);
          }
        } catch (err) {
          console.error('Telegram auth error:', err);
        }
      }

      setAuthAttempted(true);
    };

    authenticate();
  }, [authAttempted, user, token, setUser, setTempTgUser, logout, navigate]);

  return null;
}

function App() {
  const { user } = useAppStore();

  return (
    <Router>
      <Authenticator />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MenuPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="track" element={<TrackPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route path="delivery" element={
            user && (user.role === 'delivery' || user.role === 'admin') ? <DeliveryPage /> : <Navigate to="/" />
          } />

          <Route path="admin" element={
            user && user.role === 'admin' ? <AdminPage /> : <Navigate to="/" />
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
