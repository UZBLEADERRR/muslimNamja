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
import DeliveryPage from './pages/DeliveryPage';
import AdminPage from './pages/AdminPage';
import RegisterPage from './pages/RegisterPage';

function Authenticator() {
  const { setUser, user, setTempTgUser, tempTgUser } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Check Telegram WebApp Init
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      const initData = tg.initData;

      if (initData && !user) {
        // Clear any stale local data if initData is fresh
        api.post('/auth/login', { initData })
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
            console.error('Auth error:', err);
          });
      }
    }
  }, [setUser, user, setTempTgUser, navigate]);

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
