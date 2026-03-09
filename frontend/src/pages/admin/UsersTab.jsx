import React, { useState } from 'react';
import { colors, cardStyle, chipStyle, inputStyle, btnPrimary, btnDanger, badge, sectionTitle, subText, mainText, bigNum } from './adminStyles';

const UsersTab = ({ usersData, paymentRequests, onRoleChange, onPaymentAction, onBalanceChange, onFreezeUser, fullStats }) => {
    const [segment, setSegment] = useState('list');
    const [userFilter, setUserFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [balanceAmount, setBalanceAmount] = useState('');
    const [payFilter, setPayFilter] = useState('pending');
    const [imageModal, setImageModal] = useState(null);

    const users = usersData?.users || [];
    const filtered = users.filter(u => {
        if (search && !`${u.firstName} ${u.lastName} ${u.username}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (userFilter === 'admin') return u.role === 'admin';
        if (userFilter === 'delivery') return u.role === 'delivery';
        return true;
    });

    const filteredPayments = (paymentRequests || []).filter(r => payFilter === 'all' || r.status === payFilter);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
                {[['list', '👥 Ro\'yxat'], ['wallets', '💳 To\'lovlar'], ['top', '🏆 Top Users']].map(([id, label]) => (
                    <button key={id} onClick={() => setSegment(id)} style={chipStyle(segment === id)}>{label}</button>
                ))}
            </div>

            {/* USER LIST */}
            {segment === 'list' && (
                <>
                    {fullStats && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                            <div style={{ ...cardStyle, textAlign: 'center', padding: 12 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: colors.subtext }}>JAMI</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: colors.text, fontFamily: "'Fraunces',serif" }}>{usersData?.total || 0}</div>
                            </div>
                            <div style={{ ...cardStyle, textAlign: 'center', padding: 12, background: `${colors.accent}10` }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#2980B9' }}>👨 ERKAK</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#2980B9', fontFamily: "'Fraunces',serif" }}>{fullStats.demographics?.male || 0}</div>
                            </div>
                            <div style={{ ...cardStyle, textAlign: 'center', padding: 12, background: `${colors.pink}10` }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: colors.pink }}>👩 AYOL</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: colors.pink, fontFamily: "'Fraunces',serif" }}>{fullStats.demographics?.female || 0}</div>
                            </div>
                        </div>
                    )}
                    <input placeholder="🔍 Qidirish..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle} />
                    <div style={{ display: 'flex', gap: 6 }} className="hide-scrollbar">
                        {[['all', 'Hammasi'], ['admin', '🛡 Admin'], ['delivery', '🛵 Kuryer']].map(([v, l]) => (
                            <button key={v} onClick={() => setUserFilter(v)} style={chipStyle(userFilter === v)}>{l}</button>
                        ))}
                    </div>
                    {filtered.map((u, i) => (
                        <div key={u.id} style={{ ...cardStyle, animation: `fadeIn 0.3s ease ${i * 30}ms both` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={mainText}>{u.firstName} {u.lastName || ''}</span>
                                        {u.gender === 'male' && <span style={{ fontSize: 12 }}>👨</span>}
                                        {u.gender === 'female' && <span style={{ fontSize: 12 }}>👩</span>}
                                    </div>
                                    <div style={subText}>{u.phone || u.username || 'N/A'}</div>
                                    <div style={{ color: colors.accent, fontSize: 12, fontWeight: 800, marginTop: 2 }}>₩{(u.walletBalance || 0).toLocaleString()}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                                    <select value={u.role} onChange={e => onRoleChange?.(u.id, e.target.value)} style={{
                                        background: u.role === 'admin' ? colors.accent : u.role === 'delivery' ? colors.purple : colors.surface,
                                        color: u.role !== 'user' ? '#fff' : colors.text,
                                        border: `1px solid ${colors.border}`, borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700, outline: 'none'
                                    }}>
                                        <option value="user">User</option><option value="admin">Admin</option><option value="delivery">Delivery</option>
                                    </select>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => { setSelectedUser(selectedUser?.id === u.id ? null : u); setBalanceAmount(''); }} style={{ background: `${colors.accent}15`, color: colors.accent, border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>💰</button>
                                    </div>
                                </div>
                            </div>
                            {selectedUser?.id === u.id && (
                                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${colors.border}`, display: 'flex', gap: 6 }}>
                                    <input type="number" placeholder="₩ Summa (+/-)" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: 12 }} />
                                    <button onClick={() => { if (balanceAmount) { onBalanceChange?.(u.id, parseInt(balanceAmount)); setSelectedUser(null); setBalanceAmount(''); } }} style={{ ...btnPrimary, padding: '8px 14px', fontSize: 11 }}>Tasdiqlash</button>
                                </div>
                            )}
                        </div>
                    ))}
                </>
            )}

            {/* WALLETS / PAYMENT REQUESTS */}
            {segment === 'wallets' && (
                <>
                    <div style={sectionTitle}>💳 To'lov So'rovlari</div>
                    {fullStats && (
                        <div style={{ ...cardStyle, background: `linear-gradient(135deg, ${colors.accent}10, ${colors.profit}10)` }}>
                            <div style={subText}>USERLAR HAMYONIDAGI JAMI PUL</div>
                            <div style={{ ...bigNum, color: colors.accent, fontSize: 22 }}>₩{(fullStats.totalWalletPool || 0).toLocaleString()}</div>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 6 }} className="hide-scrollbar">
                        {[['pending', '⏳ Kutilmoqda'], ['approved', '✅ Tasdiqlangan'], ['rejected', '❌ Rad'], ['all', 'Hammasi']].map(([v, l]) => (
                            <button key={v} onClick={() => setPayFilter(v)} style={chipStyle(payFilter === v)}>{l}</button>
                        ))}
                    </div>
                    {filteredPayments.length === 0 && <div style={{ ...cardStyle, textAlign: 'center', color: colors.subtext, padding: 24 }}>To'lov so'rovlari yo'q</div>}
                    {filteredPayments.map((req, i) => (
                        <div key={req.id} style={{ ...cardStyle, animation: `fadeIn 0.3s ease ${i * 40}ms both`, borderLeft: `3px solid ${req.status === 'pending' ? colors.warning : req.status === 'approved' ? colors.profit : colors.danger}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div>
                                    <div style={mainText}>{req.User?.firstName || '?'} {req.User?.lastName || ''}</div>
                                    <div style={subText}>@{req.User?.username || '?'} · {new Date(req.createdAt).toLocaleString()}</div>
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: colors.accent, fontFamily: "'Fraunces',serif" }}>₩{(req.amount || 0).toLocaleString()}</div>
                            </div>
                            {/* Screenshot */}
                            <div onClick={() => setImageModal(req.imageUrl)} style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${colors.border}`, background: '#000', cursor: 'pointer', marginBottom: 8 }}>
                                <img src={req.imageUrl} alt="Screenshot" style={{ width: '100%', maxHeight: 250, objectFit: 'contain' }} />
                            </div>
                            {req.status === 'pending' ? (
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button onClick={() => onPaymentAction?.(req.id, 'approve')} style={{ ...btnPrimary, flex: 1, background: colors.profit, color: '#000', padding: 12 }}>✅ Tasdiqlash</button>
                                    <button onClick={() => onPaymentAction?.(req.id, 'reject')} style={{ ...btnDanger, flex: 1, padding: 12 }}>❌ Rad etish</button>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 10, borderRadius: 12, background: colors.surface, fontWeight: 700, fontSize: 13, color: req.status === 'approved' ? colors.profit : colors.danger, textTransform: 'uppercase' }}>
                                    {req.status === 'approved' ? '✅ Tasdiqlangan' : '❌ Rad etilgan'}
                                </div>
                            )}
                        </div>
                    ))}
                </>
            )}

            {/* TOP USERS */}
            {segment === 'top' && (
                <>
                    <div style={sectionTitle}>🏆 Top Mijozlar (Sarflash bo'yicha)</div>
                    {users.sort((a, b) => (b.walletBalance || 0) - (a.walletBalance || 0)).slice(0, 10).map((u, i) => {
                        const medals = ['🥇', '🥈', '🥉'];
                        return (
                            <div key={u.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12, animation: `fadeIn 0.3s ease ${i * 50}ms both` }}>
                                <div style={{ fontSize: 20, width: 30, textAlign: 'center' }}>{medals[i] || `${i + 1}.`}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={mainText}>{u.firstName} {u.lastName || ''}</div>
                                    <div style={subText}>@{u.username || 'N/A'}</div>
                                </div>
                                <div style={{ color: colors.accent, fontWeight: 800, fontSize: 14 }}>₩{(u.walletBalance || 0).toLocaleString()}</div>
                            </div>
                        );
                    })}
                </>
            )}

            {/* Image Modal */}
            {imageModal && (
                <div onClick={() => setImageModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <img src={imageModal} alt="Full" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12 }} />
                </div>
            )}
        </div>
    );
};

export default UsersTab;
