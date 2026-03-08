import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const { setUser, user, setLocationBlocked } = useAppStore();

  useEffect(() => {
    // Check Telegram WebApp Init
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      const initData = tg.initData;

      // Request location implicitly or just auth if available
      // For this skeleton, we'll try to auth without location first.
      // Real app: prompt for location if 400 requiresRegistration
      if (initData && !user) {
        api.post('/auth/login', { initData })
          .then(res => setUser(res.data.user, res.data.token))
          .catch(err => {
            if (err.response?.data?.distance) {
              setLocationBlocked(true);
            }
          });
      }
    }
  }, [setUser, user, setLocationBlocked]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MenuPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="profile" element={<ProfilePage />} />

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
