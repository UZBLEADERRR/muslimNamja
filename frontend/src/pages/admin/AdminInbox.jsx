import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import DirectChat from '../../components/DirectChat';

const AdminInbox = () => {
    const [inbox, setInbox] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchInbox = async () => {
        try {
            const res = await api.get('/inbox');
            setInbox(res.data || []);
        } catch (err) {
            console.error('Failed to load admin inbox', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInbox();
        const interval = setInterval(() => {
            if (!selectedChat) fetchInbox();
        }, 15000);
        return () => clearInterval(interval);
    }, [selectedChat]);

    if (selectedChat) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <DirectChat 
                    conversation={selectedChat} 
                    onBack={() => { setSelectedChat(null); fetchInbox(); }} 
                />
            </div>
        );
    }

    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Yuklanmoqda...</div>;
    }

    return (
        <div style={{ padding: '0', flex: 1, overflowY: 'auto' }}>
            {inbox.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                    <div>Hozircha xabarlar yo'q</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {inbox.map(conv => (
                        <div 
                            key={conv.id} 
                            onClick={() => setSelectedChat(conv)} 
                            style={{ 
                                display: 'flex', gap: 14, padding: '16px', 
                                borderBottom: '1px solid var(--card-border)', 
                                cursor: 'pointer', alignItems: 'center',
                                background: 'transparent', transition: 'background 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ 
                                width: 50, height: 50, borderRadius: '50%', 
                                background: 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                fontSize: 24, flexShrink: 0 
                            }}>
                                👤
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {conv.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>
                                        {new Date(conv.updatedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div style={{ fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {conv.lastMessage || 'Yangi suhbat'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminInbox;
