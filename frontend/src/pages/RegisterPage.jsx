import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { MapPin, Phone, Home, Loader } from 'lucide-react';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { tempTgUser, setUser, setLocation: setGlobalLocation } = useAppStore();

    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState(null);

    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // If we have no temp user and we aren't at least trying to authenticate (Authenticator in App.jsx)
        // give it a small grace period or check session storage
        const isRegistering = sessionStorage.getItem('is_registering');
        
        if (!tempTgUser && !isRegistering) {
            navigate('/');
        }
        
        if (tempTgUser) {
            sessionStorage.setItem('is_registering', 'true');
        }
    }, [tempTgUser, navigate]);

    const handleGetLocation = () => {
        setGettingLocation(true);
        setError('');

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setGettingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setLocation(coords);
                setGlobalLocation(coords);
                setGettingLocation(false);
            },
            (err) => {
                console.error(err);
                setError('Manzilni aniqlab bo\'lmadi. Iltimos, ruxsat bering.');
                setGettingLocation(false);
            }
        );
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!phone || !address || !location) {
            setError('Iltimos, barcha maydonlarni to\'ldiring va manzilni aniqlang.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const tg = window.Telegram?.WebApp;
            const initData = tg?.initData;

            const response = await api.post('/auth/login', {
                initData,
                phone,
                address,
                location
            });

            sessionStorage.removeItem('is_registering');
            setUser(response.data.user, response.data.token);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Ro\'yxatdan o\'tishda xatolik yuz berdi.');
        } finally {
            setLoading(false);
        }
    };

    // If we're reloading and Authenticator hasn't filled tempTgUser yet, show a loader or wait
    if (!tempTgUser && sessionStorage.getItem('is_registering')) {
        return (
            <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <Loader className="animate-spin" size={32} />
            </div>
        );
    }

    if (!tempTgUser) return null;

    return (
        <div className="animate-fade-in" style={{ padding: '20px' }}>
            <div className="glass" style={{ padding: '24px', borderRadius: '32px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🍱</div>
                <h2 style={{ marginBottom: '8px', color: 'var(--text-primary)', fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900 }}>Xush kelibsiz!</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                    Iltimos, buyurtma berishdan oldin ro'yxatdan o'ting.
                </p>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Phone size={18} color="var(--brand-accent)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="tel"
                            placeholder="Telefon raqami (masalan: +8210...)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{
                                width: '100%', padding: '14px 14px 14px 44px', borderRadius: '16px',
                                border: '1px solid var(--card-border)', background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)', outline: 'none', fontSize: 15
                            }}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Home size={18} color="var(--brand-accent)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="To'liq manzil (uy raqami, ko'cha...)"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            style={{
                                width: '100%', padding: '14px 14px 14px 44px', borderRadius: '16px',
                                border: '1px solid var(--card-border)', background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)', outline: 'none', fontSize: 15
                            }}
                            required
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={gettingLocation}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '14px', borderRadius: '16px', border: 'none',
                            color: '#fff',
                            background: location ? 'linear-gradient(135deg, #27AE60, #2ECC71)' : 'var(--bg-secondary)',
                            color: location ? '#fff' : 'var(--text-secondary)',
                            boxShadow: location ? '0 4px 12px rgba(39, 174, 96, 0.3)' : 'none',
                            cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s'
                        }}
                    >
                        {gettingLocation ? <Loader className="animate-spin" size={18} /> : <MapPin size={18} />}
                        {location ? 'Manzil aniqlandi ✓' : 'Hozirgi manzilni aniqlash'}
                    </button>

                    {error && (
                        <p style={{ color: '#ff4d4f', fontSize: '13px', marginTop: '8px' }}>{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !location}
                        style={{
                            marginTop: '12px', padding: '16px', borderRadius: '18px',
                            background: (loading || !location) ? '#95a5a6' : 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)',
                            color: 'white', border: 'none', fontWeight: 800, fontSize: '17px',
                            cursor: (loading || !location) ? 'not-allowed' : 'pointer',
                            opacity: (loading || !location) ? 0.6 : 1,
                            boxShadow: (loading || !location) ? 'none' : '0 8px 24px rgba(255, 107, 53, 0.4)',
                            transition: 'all 0.3s transform',
                            transform: loading ? 'scale(0.98)' : 'none'
                        }}
                    >
                        {loading ? 'Yuborilmoqda...' : 'Ro\'yxatdan o\'tish'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
