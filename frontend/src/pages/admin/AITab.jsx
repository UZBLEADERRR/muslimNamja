import React, { useState } from 'react';
import { colors, cardStyle, chipStyle, inputStyle, btnPrimary, sectionTitle, subText, mainText, bigNum, badge } from './adminStyles';

const AITab = ({ products, aiInventory, onFetchAiInventory, loading, profitData, fullStats }) => {
    const [segment, setSegment] = useState('cost');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
                {[['cost', '💰 Cost Engine'], ['inventory', '📦 Inventar'], ['forecast', '📊 Bashorat'], ['alerts', '⚠️ Alertlar']].map(([id, label]) => (
                    <button key={id} onClick={() => setSegment(id)} style={chipStyle(segment === id)}>{label}</button>
                ))}
            </div>

            {/* Cost Engine */}
            {segment === 'cost' && (
                <>
                    <div style={sectionTitle}>💰 Mahsulot Tannarx Tahlili</div>
                    {(products || []).filter(p => p.ingredientCost > 0).map((p, i) => {
                        const cost = p.ingredientCost || 0;
                        const price = p.price || 0;
                        const profit = price - cost;
                        const margin = price > 0 ? ((profit / price) * 100).toFixed(1) : 0;
                        const getName = (pr) => typeof pr.name === 'object' ? (pr.name.uz || pr.name.en || Object.values(pr.name)[0]) : pr.name;
                        return (
                            <div key={p.id} style={{ ...cardStyle, animation: `fadeIn 0.3s ease ${i * 40}ms both` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={mainText}>{p.imageUrl && !p.imageUrl.startsWith('data:') ? p.imageUrl + ' ' : ''}{getName(p)}</span>
                                    <span style={badge(parseFloat(margin) > 70 ? colors.profit : parseFloat(margin) > 50 ? colors.warning : colors.danger)}>{margin}%</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                    <div><div style={subText}>Tannarx</div><div style={{ color: colors.danger, fontWeight: 700 }}>₩{cost.toLocaleString()}</div></div>
                                    <div><div style={subText}>Sotish</div><div style={{ color: colors.text, fontWeight: 700 }}>₩{price.toLocaleString()}</div></div>
                                    <div><div style={subText}>Foyda</div><div style={{ color: colors.profit, fontWeight: 700 }}>₩{profit.toLocaleString()}</div></div>
                                </div>
                            </div>
                        );
                    })}
                    {(products || []).filter(p => p.ingredientCost > 0).length === 0 && (
                        <div style={{ ...cardStyle, textAlign: 'center', color: colors.subtext, padding: 30 }}>
                            Mahsulotlarga tannarx kiritilmagan. Oshxona bo'limidan tannarx qo'shing.
                        </div>
                    )}

                    {/* AI Profit Summary */}
                    {profitData && (
                        <div style={{ ...cardStyle, background: `linear-gradient(135deg, ${colors.accent}10, ${colors.profit}10)`, border: `1px solid ${colors.accent}40` }}>
                            <div style={{ ...mainText, marginBottom: 8 }}>🧠 AI Moliya Tahlili</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div><div style={subText}>Jami Daromad</div><div style={{ color: colors.profit, fontWeight: 800, fontSize: 16 }}>₩{(profitData.totalRevenue || 0).toLocaleString()}</div></div>
                                <div><div style={subText}>Sof Foyda</div><div style={{ color: colors.accent, fontWeight: 800, fontSize: 16 }}>₩{(profitData.netProfit || 0).toLocaleString()}</div></div>
                                <div><div style={subText}>Masalliq Xarajat</div><div style={{ color: colors.danger, fontWeight: 700 }}>₩{(profitData.totalIngredientCost || 0).toLocaleString()}</div></div>
                                <div><div style={subText}>Yetkazish Haqi</div><div style={{ color: colors.warning, fontWeight: 700 }}>₩{(profitData.totalDeliveryPay || 0).toLocaleString()}</div></div>
                            </div>
                            {profitData.aiSummary && <div style={{ ...subText, marginTop: 10, lineHeight: 1.5 }}>{profitData.aiSummary}</div>}
                        </div>
                    )}
                </>
            )}

            {/* Inventory AI */}
            {segment === 'inventory' && (
                <>
                    <div style={{ ...cardStyle, textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>🧠</div>
                        <div style={mainText}>Sun'iy Intelekt Zaxira Nazorati</div>
                        <div style={{ ...subText, margin: '8px 0 16px' }}>Sotilgan buyurtmalar asosida kerak bo'ladigan mahsulotlar hisobotini oling.</div>
                        <button onClick={onFetchAiInventory} disabled={loading} style={{ ...btnPrimary, width: '100%' }}>
                            {loading ? '⏳ AI tahlil qilmoqda...' : '🔍 Tahlilni Boshlash'}
                        </button>
                    </div>
                    {aiInventory?.aiAnalysis?.ingredients && (
                        <div style={{ ...cardStyle, border: `1px solid ${colors.accent}40` }}>
                            <div style={{ ...mainText, marginBottom: 12 }}>🛒 AI Taxminiy Iste'mol</div>
                            {aiInventory.aiAnalysis.ingredients.map((ing, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${colors.border}`, paddingBottom: 8, marginBottom: 8 }}>
                                    <span style={mainText}>{ing.name}</span>
                                    <span style={{ color: colors.accent, fontWeight: 800 }}>{ing.estimated_amount}</span>
                                </div>
                            ))}
                            {aiInventory.aiAnalysis.restock_suggestions?.length > 0 && (
                                <div style={{ marginTop: 12, padding: 12, background: `${colors.accent}10`, borderRadius: 12 }}>
                                    <div style={{ ...mainText, fontSize: 13, marginBottom: 6 }}>💡 AI Maslahatlari:</div>
                                    <ul style={{ margin: 0, paddingLeft: 18, ...subText, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {aiInventory.aiAnalysis.restock_suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Forecast */}
            {segment === 'forecast' && (
                <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                    <div style={mainText}>Talab Bashorat (Demand Prediction)</div>
                    <div style={{ ...subText, marginTop: 8 }}>ML asosidagi talab bashorat moduli tez orada qo'shiladi. Buning uchun kamida 30 kunlik sotuv ma'lumotlari kerak.</div>
                </div>
            )}

            {/* Alerts */}
            {segment === 'alerts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={sectionTitle}>⚠️ Alertlar Markazi</div>
                    {/* Stock alerts from products */}
                    {(products || []).filter(p => p.stock !== null && p.stock <= 5).map(p => {
                        const getName = (pr) => typeof pr.name === 'object' ? (pr.name.uz || Object.values(pr.name)[0]) : pr.name;
                        return (
                            <div key={p.id} style={{ ...cardStyle, borderLeft: `3px solid ${p.stock <= 0 ? colors.danger : colors.warning}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={mainText}>{p.stock <= 0 ? '🔴' : '🟡'} {getName(p)}</span>
                                    <span style={badge(p.stock <= 0 ? colors.danger : colors.warning)}>{p.stock} qoldi</span>
                                </div>
                                <div style={{ ...subText, marginTop: 4 }}>{p.stock <= 0 ? 'Tugadi — ZUDLIK xarid kerak!' : 'Kam qoldi. Tez orada xarid qiling.'}</div>
                            </div>
                        );
                    })}
                    {(products || []).filter(p => p.stock !== null && p.stock <= 5).length === 0 && (
                        <div style={{ ...cardStyle, textAlign: 'center', color: colors.profit, padding: 20 }}>
                            ✅ Hozircha kritik alertlar yo'q
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AITab;
