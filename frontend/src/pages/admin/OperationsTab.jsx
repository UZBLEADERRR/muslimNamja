import React, { useState } from 'react';
import { colors, cardStyle, chipStyle, inputStyle, btnPrimary, btnDanger, badge, sectionTitle, subText, mainText } from './adminStyles';

const OperationsTab = ({ orders, products, onUpdateOrderStatus, onDeleteProduct, onAddProduct, onSeed, onUpdateExpense, lang }) => {
    const [segment, setSegment] = useState('orders');
    const [orderFilter, setOrderFilter] = useState('all');
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({ nameUz: '', nameKo: '', descUz: '', descKo: '', price: '', category: 'uzbek', stock: '', minOrderQuantity: '1', ingredientCost: '' });
    const [productImage, setProductImage] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editVal, setEditVal] = useState('');

    const statusColors = { pending: colors.warning, accepted: colors.profit, preparing: colors.accent, ready_for_pickup: '#F39C12', delivering: colors.purple, delivered_awaiting_review: '#27AE60', completed: colors.profit, cancelled: colors.danger };
    const statusLabels = { pending: '⏳ Kutilmoqda', accepted: '✅ Qabul qilindi', preparing: '🍳 Tayyorlanmoqda', ready_for_pickup: '🥡 Kuryer kutilmoqda', delivering: '🛵 Yo\'lda', delivered_awaiting_review: '📸 Tasdiq kutmoqda', completed: '🏁 Bajarildi', cancelled: '❌ Bekor' };

    const filteredOrders = (orders?.orders || []).filter(o => orderFilter === 'all' || o.status === orderFilter);

    const getName = (p) => {
        if (typeof p.name === 'object') return p.name[lang] || p.name.uz || p.name.en || Object.values(p.name)[0];
        return p.name;
    };

    const handleSubmitProduct = (e) => {
        e.preventDefault();
        onAddProduct?.({ ...newProduct, image: productImage });
        setShowAddProduct(false);
        setNewProduct({ nameUz: '', nameKo: '', descUz: '', descKo: '', price: '', category: 'uzbek', stock: '', minOrderQuantity: '1', ingredientCost: '' });
        setProductImage(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Segment chips */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
                {[['orders', '📦 Buyurtmalar'], ['kitchen', '🍳 Oshxona'], ['couriers', '🛵 Kuryer']].map(([id, label]) => (
                    <button key={id} onClick={() => setSegment(id)} style={chipStyle(segment === id)}>{label}</button>
                ))}
            </div>

            {/* ORDERS */}
            {segment === 'orders' && (
                <>
                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
                        {[['all', 'Hammasi'], ['pending', '⏳ Yangi'], ['accepted', '✅ Qabul Qilingan'], ['preparing', '🍳 Oshxonada'], ['ready_for_pickup', '🥡 Tayyor'], ['delivering', '🛵 Yo\'lda'], ['delivered_awaiting_review', '📸 Tasdiqda'], ['completed', '🏁 Bajarildi'], ['cancelled', '❌ Bekor']].map(([v, l]) => (
                            <button key={v} onClick={() => setOrderFilter(v)} style={chipStyle(orderFilter === v)}>{l}</button>
                        ))}
                    </div>
                    {filteredOrders.length === 0 && <div style={{ ...cardStyle, textAlign: 'center', color: colors.subtext, padding: 24 }}>Buyurtmalar yo'q</div>}
                    {filteredOrders.map((order, i) => (
                        <div key={order.id} style={{ ...cardStyle, borderLeft: `3px solid ${statusColors[order.status] || colors.accent}`, animation: `fadeIn 0.3s ease ${i * 40}ms both` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ ...mainText, fontSize: 13 }}>#{(order.id || '').slice(0, 8)}</span>
                                <span style={badge(statusColors[order.status] || colors.accent)}>{statusLabels[order.status] || order.status}</span>
                            </div>

                            {/* Customer Info */}
                            {order.user && (
                                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                                    <div style={{ ...mainText, fontSize: 13, marginBottom: 4 }}>👤 {order.user.firstName}</div>
                                    <div style={{ ...subText, fontSize: 12 }}>📞 {order.user.phone}</div>
                                    <div style={{ ...subText, fontSize: 12 }}>📍 {order.user.address}</div>
                                    <div style={{ ...subText, fontSize: 12, marginTop: 4, color: order.paymentMethod === 'wallet' ? colors.profit : colors.warning }}>
                                        💳 {order.paymentMethod === 'wallet' ? 'Hamyon (Deposit)' : 'Naqd (Cash)'}
                                    </div>
                                </div>
                            )}

                            <div style={subText}>
                                {order.items?.map(it => `${it.productName || 'Item'} ×${it.quantity}`).join(' · ') || 'Buyurtma'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                                <span style={{ ...mainText, color: colors.accent, fontSize: 15 }}>₩{(order.totalAmount || 0).toLocaleString()}</span>
                                <span style={subText}>{new Date(order.createdAt).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                {order.status === 'pending' && <>
                                    <button onClick={() => onUpdateOrderStatus?.(order.id, 'accepted')} style={{ ...btnPrimary, flex: 1, padding: '10px', fontSize: 12, background: colors.profit, color: '#000' }}>✅ Qabul qilish</button>
                                    <button onClick={() => onUpdateOrderStatus?.(order.id, 'cancelled')} style={{ ...btnDanger, flex: 1, padding: '10px', fontSize: 12 }}>❌ Rad etish</button>
                                </>}
                                {order.status === 'accepted' && <button onClick={() => onUpdateOrderStatus?.(order.id, 'preparing')} style={{ ...btnPrimary, width: '100%', padding: '10px', fontSize: 12, background: colors.accent }}>🍳 Oshxonaga berish</button>}
                                {order.status === 'preparing' && <button onClick={() => onUpdateOrderStatus?.(order.id, 'ready_for_pickup')} style={{ ...btnPrimary, width: '100%', padding: '10px', fontSize: 12, background: '#F39C12' }}>🥡 Tayyor (Kuryerga uzatish)</button>}
                                {order.status === 'ready_for_pickup' && <div style={{ fontSize: 12, color: colors.warning, textAlign: 'center', width: '100%' }}>Kuryer o'zi olib ketganda knopka bosadi...</div>}
                                {order.status === 'delivering' && <div style={{ fontSize: 12, color: colors.purple, textAlign: 'center', width: '100%' }}>Kuryer yo'lda, yetkazganda tizim yangilaydi...</div>}
                                {order.status === 'delivered_awaiting_review' && <div style={{ fontSize: 12, color: colors.profit, textAlign: 'center', width: '100%' }}>Mijoz baholashini kutmoqda...</div>}
                            </div>
                        </div>
                    ))}
                </>
            )}

            {/* KITCHEN / Products */}
            {segment === 'kitchen' && (
                <>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={onSeed} style={{ ...btnPrimary, flex: 1, background: colors.surface, color: colors.text, border: `1px solid ${colors.border}` }}>🌱 Seed Menu</button>
                        <button onClick={() => setShowAddProduct(!showAddProduct)} style={{ ...btnPrimary, flex: 1 }}>➕ Yangi Qo'shish</button>
                    </div>
                    {showAddProduct && (
                        <form onSubmit={handleSubmitProduct} style={{ ...cardStyle, border: `1px solid ${colors.accent}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ ...mainText, marginBottom: 4 }}>📝 Yangi Mahsulot</div>
                            <input placeholder="Nomi (O'zbekcha)" value={newProduct.nameUz} onChange={e => setNewProduct({ ...newProduct, nameUz: e.target.value })} style={inputStyle} required />
                            <input placeholder="Nomi (Koreyscha)" value={newProduct.nameKo} onChange={e => setNewProduct({ ...newProduct, nameKo: e.target.value })} style={inputStyle} required />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input type="number" placeholder="Narxi (₩)" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} style={{ ...inputStyle, flex: 1 }} required />
                                <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                                    <option value="uzbek">Uzbek</option><option value="korean">Korean</option>
                                    <option value="fastfood">Fastfood</option><option value="drinks">Drinks</option><option value="desserts">Desserts</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input type="number" placeholder="Zaxira" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                <input type="number" placeholder="Min buyurtma" value={newProduct.minOrderQuantity} onChange={e => setNewProduct({ ...newProduct, minOrderQuantity: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                <input type="number" placeholder="Tannarx ₩" value={newProduct.ingredientCost} onChange={e => setNewProduct({ ...newProduct, ingredientCost: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                            </div>
                            <input type="file" accept="image/*" onChange={e => setProductImage(e.target.files?.[0])} style={{ color: colors.text, fontSize: 13 }} />
                            <button type="submit" style={btnPrimary}>Saqlash</button>
                        </form>
                    )}
                    {(products || []).map((p, i) => (
                        <div key={p.id} style={{ ...cardStyle, animation: `fadeIn 0.3s ease ${i * 40}ms both` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    {p.imageUrl?.startsWith('data:image')
                                        ? <img src={p.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                        : <span style={{ fontSize: 24 }}>{p.imageUrl || '🍽️'}</span>}
                                    <div>
                                        <div style={mainText}>{getName(p)}</div>
                                        <div style={{ color: colors.accent, fontSize: 12, fontWeight: 700 }}>₩{p.price?.toLocaleString()}</div>
                                        <div style={subText}>Zaxira: {p.stock === null ? '∞' : p.stock} | Min: {p.minOrderQuantity || 1}</div>
                                    </div>
                                </div>
                                <button onClick={() => onDeleteProduct?.(p.id)} style={{ background: `${colors.danger}15`, color: colors.danger, border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}>🗑</button>
                            </div>
                            <div style={{ borderTop: `1px dashed ${colors.border}`, paddingTop: 10, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={subText}>Tannarx: ₩{(p.ingredientCost || 0).toLocaleString()}</span>
                                {editingId === p.id ? (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)} style={{ ...inputStyle, width: 80, padding: '6px 8px', fontSize: 12 }} />
                                        <button onClick={() => { onUpdateExpense?.(p.id, editVal); setEditingId(null); }} style={{ ...btnPrimary, padding: '6px 12px', fontSize: 11 }}>✓</button>
                                    </div>
                                ) : (
                                    <button onClick={() => { setEditingId(p.id); setEditVal(p.ingredientCost || 0); }} style={{ background: `${colors.accent}15`, color: colors.accent, border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Tahrirlash</button>
                                )}
                            </div>
                        </div>
                    ))}
                </>
            )}

            {/* COURIERS (placeholder) */}
            {segment === 'couriers' && (
                <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🛵</div>
                    <div style={mainText}>Kuryer Boshqaruvi</div>
                    <div style={{ ...subText, marginTop: 8 }}>Kuryerlar moduli tez orada qo'shiladi. Hozircha buyurtmalarni "Yetkazishga" statusiga o'tkazing.</div>
                </div>
            )}
        </div>
    );
};

export default OperationsTab;
