import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { Send, Tag } from 'lucide-react';

const CommunityPage = () => {
    const { t, lang } = useTranslation();
    const { user, addToCart } = useAppStore();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Mock initial load for UI demonstration
    useEffect(() => {
        const mockMessages = [
            { _id: '1', text: 'Hello everyone! The spicy chicken today is amazing.', sender: { firstName: 'Sardor', role: 'user' }, createdAt: new Date(Date.now() - 10000).toISOString() },
            {
                _id: '2',
                text: 'Special offer! First 3 people get Cola for 1000₩!',
                sender: { firstName: 'Admin', role: 'admin' },
                isSystem: true,
                offerData: {
                    productId: { _id: '3', name: { en: 'Cola 500ml', ko: '콜라 500ml' }, price: 2000 },
                    specialPrice: 1000,
                    maxUses: 3,
                    currentUses: 1
                },
                createdAt: new Date().toISOString()
            }
        ];
        setMessages(mockMessages);
        setLoading(false);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // Mock API call
        const msg = {
            _id: Date.now().toString(),
            text: newMessage,
            sender: user || { firstName: 'Guest', role: 'user' },
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, msg]);
        setNewMessage('');
    };

    const claimOffer = async (msgId, offerData) => {
        // Mock claim
        alert(`Claimed offer! Added ${offerData.productId.name[lang] || offerData.productId.name.en} to cart for ${offerData.specialPrice.toLocaleString()}₩`);
        // In real app, we call API to increment uses securely
        addToCart({ ...offerData.productId, price: offerData.specialPrice });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', position: 'relative' }} className="animate-slide-up">
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '22px', margin: 0 }}>{t('community')}</h2>
                <div style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 700 }}>{messages.length} messages</div>
            </div>

            {/* Telegram-style Messages List */}
            <div className="hide-scrollbar" style={{
                flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px',
                padding: '0 4px'
            }}>
                {messages.map((msg, index) => {
                    const isOwn = user ? msg.sender._id === user._id : false;
                    const nextMsg = messages[index + 1];
                    const isLastInGroup = !nextMsg || nextMsg.sender._id !== msg.sender._id;
                    const prevMsg = messages[index - 1];
                    const isFirstInGroup = !prevMsg || prevMsg.sender._id !== msg.sender._id;

                    return (
                        <div key={msg._id} style={{
                            alignSelf: isOwn ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            display: 'flex',
                            flexDirection: 'column',
                            marginBottom: isLastInGroup ? '8px' : '2px'
                        }}>
                            {!isOwn && isFirstInGroup && (
                                <span style={{
                                    fontSize: '12px', fontWeight: 700,
                                    color: msg.sender.role === 'admin' ? 'var(--brand-gold)' : 'var(--brand-primary)',
                                    marginBottom: '2px', marginLeft: '12px'
                                }}>
                                    {msg.sender.firstName} {msg.sender.role === 'admin' && '🛡️'}
                                </span>
                            )}

                            <div style={{
                                padding: '10px 14px',
                                borderRadius: '18px',
                                borderTopLeftRadius: isOwn || !isFirstInGroup ? '18px' : '4px',
                                borderTopRightRadius: !isOwn || !isFirstInGroup ? '18px' : '4px',
                                background: isOwn ? 'var(--brand-primary)' : 'var(--bg-secondary)',
                                color: isOwn ? 'white' : 'var(--text-primary)',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                position: 'relative',
                                display: 'inline-block'
                            }}>
                                <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.4 }}>{msg.text}</p>

                                {msg.isSystem && msg.offerData && (
                                    <div style={{
                                        marginTop: '10px', padding: '12px',
                                        background: 'rgba(255,255,255,0.1)', borderRadius: '14px',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                            <span style={{ fontWeight: 700 }}>{msg.offerData.productId.name[lang] || msg.offerData.productId.name.en}</span>
                                            <span style={{ color: 'var(--brand-gold)' }}>{msg.offerData.specialPrice.toLocaleString()}₩</span>
                                        </div>
                                        <button
                                            onClick={() => claimOffer(msg._id, msg.offerData)}
                                            style={{
                                                width: '100%', padding: '8px', borderRadius: '10px',
                                                background: 'white', color: 'var(--brand-primary)',
                                                fontWeight: 800, fontSize: '12px', border: 'none'
                                            }}
                                        >
                                            Claim Offer
                                        </button>
                                    </div>
                                )}

                                <div style={{
                                    fontSize: '9px', opacity: 0.7, textAlign: 'right',
                                    marginTop: '4px', fontWeight: 600,
                                    color: isOwn ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'
                                }}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Telegram-style Input */}
            <form onSubmit={handleSendMessage} style={{
                marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center',
                padding: '8px 4px'
            }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Message"
                        style={{
                            width: '100%', padding: '14px 20px', borderRadius: '25px',
                            border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
                            color: 'var(--text-primary)', outline: 'none', fontSize: '15px'
                        }}
                    />
                </div>
                <button
                    type="submit"
                    style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: 'var(--brand-primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                        border: 'none'
                    }}
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default CommunityPage;
