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
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }} className="animate-fade-in">
            <h2 style={{ marginBottom: '16px' }}>{t('community')}</h2>

            {/* Messages List */}
            <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map(msg => {
                    const isOwn = user ? msg.sender._id === user._id : false;
                    const isAdmin = msg.sender.role === 'admin';

                    return (
                        <div key={msg._id} style={{
                            alignSelf: isOwn ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {!isOwn && (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', marginLeft: '4px' }}>
                                    {msg.sender.firstName} {isAdmin && '🛡️'}
                                </span>
                            )}

                            <div className="glass" style={{
                                padding: '12px',
                                borderRadius: '16px',
                                borderBottomLeftRadius: isOwn ? '16px' : '4px',
                                borderBottomRightRadius: isOwn ? '4px' : '16px',
                                background: isAdmin && msg.isSystem ? 'var(--brand-primary)' : (isOwn ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'),
                                color: isAdmin && msg.isSystem ? 'white' : 'var(--text-primary)',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>{msg.text}</p>

                                {/* Special Offer Button */}
                                {msg.isSystem && msg.offerData && (
                                    <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 'bold' }}>{msg.offerData.productId.name[lang] || msg.offerData.productId.name.en}</span>
                                            <span style={{ textDecoration: 'line-through', fontSize: '12px', opacity: 0.8 }}>
                                                {msg.offerData.productId.price.toLocaleString()}₩
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => claimOffer(msg._id, msg.offerData)}
                                            disabled={msg.offerData.currentUses >= msg.offerData.maxUses}
                                            className="btn-primary"
                                            style={{
                                                width: '100%',
                                                background: 'white',
                                                color: 'var(--brand-primary)',
                                                opacity: msg.offerData.currentUses >= msg.offerData.maxUses ? 0.5 : 1
                                            }}
                                        >
                                            <Tag size={16} />
                                            {msg.offerData.currentUses >= msg.offerData.maxUses
                                                ? 'Sold Out'
                                                : `Claim for ${msg.offerData.specialPrice.toLocaleString()}₩ (${msg.offerData.maxUses - msg.offerData.currentUses} left)`}
                                        </button>
                                    </div>
                                )}

                                <div style={{ fontSize: '10px', opacity: 0.6, textAlign: 'right', marginTop: '4px' }}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} style={{ marginTop: '16px', display: 'flex', gap: '8px', position: 'relative' }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                        flex: 1, padding: '12px 16px', borderRadius: '24px',
                        border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)', outline: 'none',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                />
                <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%' }}
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default CommunityPage;
