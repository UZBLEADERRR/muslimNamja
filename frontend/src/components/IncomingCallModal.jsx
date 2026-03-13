import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';

const IncomingCallModal = ({ callerName, callerAvatar, onAccept, onReject }) => {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(5, 10, 20, 0.4)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '320px',
                background: 'rgba(20, 25, 35, 0.85)',
                backdropFilter: 'blur(20px)',
                borderRadius: '32px',
                padding: '30px 20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                animation: 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                <div style={{ position: 'relative', marginBottom: 20 }}>
                    <div style={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--brand-accent, #FF6B35), #FF3CAC)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 0 30px rgba(255,107,53,0.3)',
                        border: '4px solid rgba(255,255,255,0.1)'
                    }}>
                        {callerAvatar ? (
                            <img src={callerAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: 40 }}>👤</span>
                        )}
                    </div>
                    <div style={{
                        position: 'absolute',
                        inset: -8,
                        borderRadius: '50%',
                        border: '2px solid rgba(255,107,53,0.3)',
                        animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                    }} />
                </div>

                <div style={{ marginBottom: 30 }}>
                    <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 900, marginBottom: 6, letterSpacing: '-0.5px' }}>
                        {callerName}
                    </h3>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', animation: 'blink 1.5s infinite' }}>
                        Incoming Call...
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 30, width: '100%', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <button
                            onClick={onReject}
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                border: 'none',
                                background: '#FF3B30',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 8px 20px rgba(255,59,48,0.3)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <PhoneOff size={28} />
                        </button>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700 }}>REJECT</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <button
                            onClick={onAccept}
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                border: 'none',
                                background: '#34C759',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 8px 20px rgba(52,199,89,0.3)',
                                transition: 'transform 0.2s',
                                animation: 'pulse-btn 2s infinite'
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Phone size={28} />
                        </button>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700 }}>ACCEPT</span>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes ping { 75%, 100% { transform: scale(1.8); opacity: 0; } }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                @keyframes pulse-btn { 0% { box-shadow: 0 0 0 0 rgba(52,199,89, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(52,199,89, 0); } 100% { box-shadow: 0 0 0 0 rgba(52,199,89, 0); } }
            `}</style>
        </div>
    );
};

export default IncomingCallModal;
