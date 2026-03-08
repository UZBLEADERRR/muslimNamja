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
        <div className="animate-fade-in">
            {/* Profile Header */}
            <div className="glass" style={{ padding: '24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserIcon size={32} />
                </div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '20px', margin: '0 0 4px 0' }}>{user.firstName} {user.lastName || ''}</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>@{user.username || 'user'}</p>
                </div>
                <button onClick={logout} style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)' }}>
                    <LogOut size={24} />
                </button>
            </div>

            {/* Wallet Balance */}
            <div style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-hover))', color: 'white', padding: '24px', borderRadius: '24px', marginBottom: '24px', boxShadow: 'var(--shadow-md)' }}>
                <p style={{ margin: '0 0 8px 0', opacity: 0.9, fontSize: '14px' }}>Wallet Balance</p>
                <h1 style={{ margin: 0, fontSize: '32px' }}>{user.walletBalance?.toLocaleString() || 0} ₩</h1>
            </div>

            {/* Top Up Wallet feature */}
            <h3 style={{ marginBottom: '16px' }}>{t('topup_wallet')}</h3>
            <div className="glass" style={{ padding: '20px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Enter Amount to Top-Up (₩)"
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />

                <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '24px', border: '2px dashed var(--brand-primary)', borderRadius: '16px',
                    color: 'var(--brand-primary)', cursor: 'pointer', background: 'var(--bg-primary)'
                }}>
                    <CreditCard size={32} />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>
                        {screenshot ? screenshot.name : 'Upload Transfer Receipt (AI Verify)'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleScreenshotChange} style={{ display: 'none' }} />
                </label>

                <button onClick={handleTopUp} disabled={isProcessing} className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                    {isProcessing ? 'Verifying with AI...' : 'Submit Top-Up'}
                </button>
            </div>

            {/* Order History link mock */}
            <div className="glass" style={{ padding: '16px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                    <History size={24} />
                </div>
                <span style={{ fontWeight: 600, flex: 1 }}>Order History</span>
                <span style={{ color: 'var(--text-muted)' }}>{'>'}</span>
            </div>

        </div>
    );
};

export default ProfilePage;
