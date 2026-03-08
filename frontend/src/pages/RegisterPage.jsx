import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { MapPin, Phone, Home, Loader } from 'lucide-react';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { tempTgUser, setUser } = useAppStore();

    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!tempTgUser) {
            navigate('/');
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
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
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

            setUser(response.data.user, response.data.token);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Ro\'yxatdan o\'tishda xatolik yuz berdi.');
        } finally {
            setLoading(false);
        }
    };

    if (!tempTgUser) return null;

    return (
        <div className="animate-fade-in" style={{ padding: '20px' }}>
            <div className="glass" style={{ padding: '24px', borderRadius: '24px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Xush kelibsiz!</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                    Iltimos, buyurtma berishdan oldin ro'yxatdan o'ting.
                </p>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Phone size={18} color="var(--brand-primary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="tel"
                            placeholder="Telefon raqami (masalan: +8210...)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px',
                                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)', outline: 'none'
                            }}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Home size={18} color="var(--brand-primary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="To'liq manzil (uy raqami, ko'cha...)"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px',
                                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)', outline: 'none'
                            }}
                            required
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={gettingLocation}
                        className="glass"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '12px', borderRadius: '12px', border: '1px solid var(--brand-primary)',
                            color: location ? 'var(--brand-primary)' : 'var(--text-primary)',
                            background: location ? 'rgba(255, 64, 129, 0.1)' : 'transparent',
                            cursor: 'pointer', fontWeight: 600
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
                            marginTop: '12px', padding: '14px', borderRadius: '12px',
                            background: 'var(--brand-primary)', color: 'white',
                            border: 'none', fontWeight: 700, fontSize: '16px',
                            cursor: (loading || !location) ? 'not-allowed' : 'pointer',
                            opacity: (loading || !location) ? 0.6 : 1,
                            boxShadow: '0 4px 14px 0 rgba(255, 64, 129, 0.39)'
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
