import React, { useState } from 'react';
import { colors, cardStyle, chipStyle, inputStyle, btnPrimary, sectionTitle, subText, mainText } from './adminStyles';

const SettingsTab = ({ bankCard, onSaveBankCard, onBankCardChange, meetupSpots, onAddSpot, onRemoveSpot,
    adBanners, onAddAd, onDeleteAd, broadcastMsg, onBroadcastChange, onBroadcast, broadcasting,
    isStoreOpen, onToggleStore, auditLog, onRoleChange }) => {
    const [segment, setSegment] = useState('announce');
    const [newSpotName, setNewSpotName] = useState('');
    const [newAdText, setNewAdText] = useState('');
    const [newAdImage, setNewAdImage] = useState(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
                {[['announce', '📢 E\'lon'], ['system', '⚙️ Tizim'], ['audit', '📋 Audit Log']].map(([id, label]) => (
                    <button key={id} onClick={() => setSegment(id)} style={chipStyle(segment === id)}>{label}</button>
                ))}
            </div>

            {/* ANNOUNCEMENTS / BROADCAST */}
            {segment === 'announce' && (
                <>
                    <div style={cardStyle}>
                        <div style={{ ...mainText, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>📢 E'lon (Broadcast)</div>
                        <div style={{ ...subText, marginBottom: 12 }}>Barcha foydalanuvchilarga Telegram orqali xabar yuborish.</div>
                        <textarea value={broadcastMsg} onChange={e => onBroadcastChange?.(e.target.value)} placeholder="E'lon matnini yozing..."
                            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
                        <button onClick={onBroadcast} disabled={broadcasting || !broadcastMsg?.trim()} style={{ ...btnPrimary, width: '100%', marginTop: 10, opacity: (!broadcastMsg?.trim() || broadcasting) ? 0.5 : 1 }}>
                            {broadcasting ? '⏳ Yuborilmoqda...' : '📤 Barchaga yuborish'}
                        </button>
                    </div>

                    {/* Ad Banners */}
                    <div style={cardStyle}>
                        <div style={{ ...mainText, marginBottom: 8 }}>📢 Bosh sahifa E'lonlari (Carousel)</div>
                        <div style={{ background: colors.surface, padding: 12, borderRadius: 12, border: `1px dashed ${colors.border}`, marginBottom: 12 }}>
                            <textarea value={newAdText} onChange={e => setNewAdText(e.target.value)} placeholder="E'lon matnini yozing..." style={{ ...inputStyle, minHeight: 50, marginBottom: 8 }} />
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input type="file" accept="image/*" onChange={e => setNewAdImage(e.target.files?.[0])} style={{ color: colors.text, fontSize: 12, flex: 1 }} />
                                <button onClick={() => { onAddAd?.(newAdText, newAdImage); setNewAdText(''); setNewAdImage(null); }} style={{ ...btnPrimary, padding: '8px 14px', fontSize: 12 }}>➕</button>
                            </div>
                        </div>
                        {(adBanners || []).map((ad, i) => (
                            <div key={ad.id || i} style={{ display: 'flex', gap: 10, padding: 10, background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}`, marginBottom: 6, alignItems: 'center' }}>
                                {ad.imageUrl && <img src={ad.imageUrl} alt="" style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />}
                                <div style={{ flex: 1, ...subText }}>{ad.text || 'Rasm'}</div>
                                <button onClick={() => onDeleteAd?.(ad.id)} style={{ background: `${colors.danger}15`, color: colors.danger, border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer' }}>🗑</button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* SYSTEM SETTINGS */}
            {segment === 'system' && (
                <>
                    {/* Store Status */}
                    <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={mainText}>🏪 Do'kon Holati</div>
                            <div style={subText}>Yopilsa buyurtma qabul qilinmaydi</div>
                        </div>
                        <button onClick={onToggleStore} style={{
                            background: isStoreOpen ? colors.profit : `${colors.danger}20`, color: isStoreOpen ? '#000' : colors.danger,
                            border: 'none', padding: '10px 16px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', minWidth: 80
                        }}>{isStoreOpen ? '✅ Ochiq' : '🔴 Yopiq'}</button>
                    </div>

                    {/* Bank Card */}
                    <div style={cardStyle}>
                        <div style={{ ...mainText, marginBottom: 8 }}>💳 To'lov Qabul Qilish Kartasi</div>
                        <div style={{ ...subText, marginBottom: 10 }}>Foydalanuvchilar shu kartaga pul o'tkazadi.</div>
                        <input value={bankCard || ''} onChange={e => onBankCardChange?.(e.target.value)} placeholder="8600 1234... yoki Toss Bank..." style={inputStyle} />
                        <button onClick={onSaveBankCard} style={{ ...btnPrimary, width: '100%', marginTop: 8, background: colors.profit, color: '#000' }}>💾 Saqlash</button>
                    </div>

                    {/* Meetup Spots */}
                    <div style={cardStyle}>
                        <div style={{ ...mainText, marginBottom: 8 }}>📍 Uchrashuv Joylari</div>
                        <form onSubmit={e => { e.preventDefault(); if (newSpotName.trim()) { onAddSpot?.(newSpotName.trim()); setNewSpotName(''); } }} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                            <input value={newSpotName} onChange={e => setNewSpotName(e.target.value)} placeholder="Masalan: Sejong GS25 oldi" style={{ ...inputStyle, flex: 1 }} />
                            <button type="submit" style={{ ...btnPrimary, padding: '10px 16px' }}>➕</button>
                        </form>
                        {(meetupSpots || []).map((spot, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}`, marginBottom: 4, alignItems: 'center' }}>
                                <span style={{ ...mainText, fontSize: 13 }}>{spot}</span>
                                <button onClick={() => onRemoveSpot?.(spot)} style={{ background: `${colors.danger}15`, color: colors.danger, border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer' }}>🗑</button>
                            </div>
                        ))}
                        {(!meetupSpots || meetupSpots.length === 0) && <div style={subText}>Hali joylar kiritilmagan.</div>}
                    </div>
                </>
            )}

            {/* AUDIT LOG */}
            {segment === 'audit' && (
                <>
                    <div style={sectionTitle}>📋 Kim Nima Qildi (Audit Log)</div>
                    {(!auditLog || auditLog.length === 0) && <div style={{ ...cardStyle, textAlign: 'center', color: colors.subtext, padding: 24 }}>Hali harakatlar loglanmagan</div>}
                    {(auditLog || []).map((log, i) => (
                        <div key={log.id} style={{ ...cardStyle, padding: '12px 14px', borderLeft: `3px solid ${colors.accent}`, animation: `fadeIn 0.3s ease ${i * 30}ms both` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ ...mainText, fontSize: 13 }}>{log.adminName || 'Admin'}</span>
                                <span style={{ ...subText, fontSize: 10 }}>{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                            <div style={{ color: colors.accent, fontSize: 13, fontWeight: 600 }}>{log.action}</div>
                            {log.details && <div style={{ ...subText, marginTop: 2 }}>{log.details}</div>}
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};

export default SettingsTab;
