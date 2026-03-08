import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import api from './utils/api';
import Layout from './components/Layout';

// Placeholder Pages
import MenuPage from './pages/MenuPage';
import CommunityPage from './pages/CommunityPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import TrackPage from './pages/TrackPage';
import DeliveryPage from './pages/DeliveryPage';
import AdminPage from './pages/AdminPage';
import RegisterPage from './pages/RegisterPage';

function Authenticator() {
  const { setUser, user, token, setTempTgUser } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Restore session if token exists
    if (token && !user) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data, token);
        })
        .catch(err => console.error('Token auth error:', err));
    }

    // 2. Telegram WebApp Init
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initData) {
      tg.ready();
      tg.expand();

      // Only attempt Telegram login if we don't have a user yet
      if (!user && !token) {
        api.post('/auth/login', { initData: tg.initData })
          .then(res => {
            if (res.data.requiresRegistration) {
              setTempTgUser(res.data.tgUser);
              if (window.location.pathname !== '/register') {
                navigate('/register');
              }
            } else {
              setUser(res.data.user, res.data.token);
            }
          })
          .catch(err => {
            console.error('TG Auth error:', err);
          });
      }
    }
  }, [setUser, user, token, setTempTgUser, navigate]);

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
            user && user.role === 'delivery' ? <DeliveryPage /> : <Navigate to="/" />
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
