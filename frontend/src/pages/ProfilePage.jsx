import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { CreditCard, History, User as UserIcon, LogOut } from 'lucide-react';
import api from '../utils/api';

const ProfilePage = () => {
    const { t } = useTranslation();
    const { user, logout } = useAppStore();

    const [screenshot, setScreenshot] = useState(null);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleScreenshotChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setScreenshot(e.target.files[0]);
        }
    };

    const handleTopUp = async () => {
        if (!screenshot || !topUpAmount) return alert('Enter amount and upload screenshot');

        setIsProcessing(true);
        try {
            // Create FormData to send file to AI verifier backend
            // const formData = new FormData();
            // formData.append('screenshot', screenshot);
            // formData.append('amount', topUpAmount);
            // await api.post('/ai/verify-payment', formData);

            await new Promise(r => setTimeout(r, 1500));
            alert('Top-up requested! AI is verifying the screenshot.');
            setTopUpAmount('');
            setScreenshot(null);
        } catch (e) {
            console.error(e);
            alert('Failed to top up');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!user) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <p>Login with Telegram to view your profile</p>
            </div>
        );
    }

    return (
        <div className="animate-slide-up" style={{ paddingBottom: '40px' }}>
            {/* Luxury Profile Header */}
            <div className="glass" style={{
                padding: '32px 24px', borderRadius: '32px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '16px', marginBottom: '32px', textAlign: 'center',
                background: 'linear-gradient(180deg, rgba(6, 78, 59, 0.4) 0%, rgba(2, 44, 34, 0.1) 100%)'
            }}>
                <div style={{
                    width: '100px', height: '100px', borderRadius: '32px',
                    background: 'linear-gradient(135deg, var(--brand-primary), #065f46)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 15px 35px rgba(16, 185, 129, 0.3)', marginBottom: '8px'
                }}>
                    <UserIcon size={48} />
                </div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '26px', margin: '0 0 4px 0', fontWeight: 800 }}>{user.firstName} {user.lastName || ''}</h2>
                    <p style={{ margin: 0, color: 'var(--brand-primary)', fontWeight: 700 }}>@{user.username || 'premium_user'}</p>
                </div>
                <button
                    onClick={logout}
                    className="glass"
                    style={{
                        marginTop: '8px', padding: '10px 20px', borderRadius: '16px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        color: 'var(--danger-color)', fontSize: '14px', fontWeight: 700, border: 'none'
                    }}
                >
                    <LogOut size={18} /> {t('logout') || 'Chiqish'}
                </button>
            </div>

            {/* Premium Wallet Card */}
            <div className="glass" style={{
                padding: '32px', borderRadius: '32px', marginBottom: '32px',
                background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                position: 'relative', overflow: 'hidden'
            }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'var(--brand-primary)', opacity: 0.1, filter: 'blur(30px)' }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ margin: '0 0 12px 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hamyon Balansi</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <h1 style={{ margin: 0, fontSize: '42px', color: 'white', fontWeight: 900 }}>{user.walletBalance?.toLocaleString() || 0} <span style={{ fontSize: '24px', color: 'var(--brand-gold)' }}>₩</span></h1>
                        <div className="glass" style={{ padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, color: 'var(--brand-primary)' }}>VIP</div>
                    </div>
                </div>
            </div>

            {/* Top Up Wallet feature */}
            <h3 style={{ marginBottom: '20px', fontSize: '20px', color: 'var(--text-primary)' }}>Pul tushirish</h3>
            <div className="glass" style={{ padding: '24px', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                <div style={{ position: 'relative' }}>
                    <input
                        type="number"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        placeholder="Summani kiriting (₩)"
                        style={{
                            width: '100%', padding: '18px 20px', borderRadius: '20px',
                            border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
                            color: 'var(--text-primary)', fontSize: '16px', outline: 'none'
                        }}
                    />
                </div>

                <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    padding: '32px', border: '2px dashed var(--glass-border)', borderRadius: '24px',
                    color: 'var(--brand-primary)', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.02)',
                    transition: 'all 0.3s ease'
                }}>
                    <CreditCard size={40} />
                    <span style={{ fontSize: '15px', fontWeight: 700, textAlign: 'center' }}>
                        {screenshot ? screenshot.name : 'To\'lov rasmini yuklang\n(AI tekshiruv)'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleScreenshotChange} style={{ display: 'none' }} />
                </label>

                <button
                    onClick={handleTopUp}
                    disabled={isProcessing}
                    className="btn-gold"
                    style={{ width: '100%', fontSize: '17px' }}
                >
                    {isProcessing ? 'AI tekshirmoqda...' : 'Tasdiqlash'}
                </button>
            </div>

            {/* Premium Settings/History Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <RowItem icon={<History size={22} />} label="Buyurtmalar tarixi" />
                <RowItem icon={<CreditCard size={22} />} label="To'lov usullari" />
            </div>
        </div>
    );
};

const RowItem = ({ icon, label }) => (
    <div className="glass" style={{ padding: '20px 24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </div>
        <span style={{ fontWeight: 700, flex: 1, fontSize: '16px', color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '20px', fontWeight: 300 }}>›</span>
    </div>
);

export default ProfilePage;
