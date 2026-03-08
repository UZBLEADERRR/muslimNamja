import React, { useState } from 'react';
import { useTranslation } from '../i18n';

const TrackPage = () => {
    const { t } = useTranslation();
    const [trackStep, setTrackStep] = useState(3);

    return (
        <div className="animate-slide-up" style={{ padding: 20 }}>
            <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                Live Tracking 📍
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>Order #SEJ-2891 · Checkout Complete</p>

            {/* Map Placeholder */}
            <div style={{ background: "linear-gradient(135deg, rgba(39,174,96,0.1) 0%, rgba(39,174,96,0.02) 100%)", borderRadius: 20, height: 200, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", border: `1px solid rgba(39,174,96,0.2)` }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 30% 60%, rgba(39,174,96,0.2) 0%, transparent 60%), radial-gradient(circle at 70% 30%, rgba(39,174,96,0.1) 0%, transparent 50%)` }} />
                <div style={{ textAlign: "center", zIndex: 1, padding: 20, background: "var(--glass-header)", borderRadius: 20, backdropFilter: "blur(10px)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-main)" }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🛵</div>
                    <div style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 700 }}>Courier 850m away</div>
                    <div style={{ color: "var(--brand-accent2)", fontSize: 13, fontWeight: 800 }}>ETA: ~8 minutes</div>
                </div>
                <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", background: "var(--brand-accent)", borderRadius: 20, padding: "6px 14px", color: "#fff", fontSize: 11, fontWeight: 700, boxShadow: "0 4px 12px rgba(255,107,53,0.4)" }}>📍 Your location</div>
            </div>

            {/* Steps */}
            <div style={{ background: "var(--card-bg)", borderRadius: 18, padding: 18, border: `1px solid var(--card-border)`, boxShadow: "var(--shadow-main)", marginBottom: 14 }}>
                {[
                    { step: 1, icon: "👨‍🍳", label: "Preparing", done: true },
                    { step: 2, icon: "📦", label: "Picked Up", done: true },
                    { step: 3, icon: "🛵", label: "On the Way", done: trackStep >= 3, active: trackStep === 3 },
                    { step: 4, icon: "🏠", label: "Arrived", done: false },
                ].map((s, i) => (
                    <div key={s.step} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: i < 3 ? 16 : 0 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: s.done ? 'var(--brand-accent)' : s.active ? `rgba(255,107,53,0.2)` : 'rgba(255,255,255,0.05)', display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, border: s.active ? `2px solid var(--brand-accent)` : "none", color: s.done ? '#fff' : 'inherit' }}>
                            {s.done ? "✓" : s.icon}
                        </div>
                        <div>
                            <div style={{ color: s.done || s.active ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: s.active ? 700 : 500, fontSize: 14 }}>{s.label}</div>
                            {s.active && <div style={{ color: "var(--brand-accent)", fontSize: 11, fontWeight: 600 }}>In progress...</div>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Courier Info */}
            <div style={{ background: "var(--card-bg)", borderRadius: 18, padding: 16, border: `1px solid var(--card-border)`, boxShadow: "var(--shadow-main)", display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: `linear-gradient(135deg, var(--brand-accent), #FF3CAC)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 4px 12px rgba(255,107,53,0.3)" }}>🛵</div>
                <div style={{ flex: 1 }}>
                    <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14 }}>Khasan (Courier)</div>
                    <div style={{ color: "#F5A623", fontSize: 11, margin: "2px 0 4px" }}>★★★★★</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>98% on-time delivery</div>
                </div>
                <button style={{ background: "var(--brand-accent)", color: "#fff", border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(255,107,53,0.3)" }}>💬 Chat</button>
            </div>
        </div>
    );
};

export default TrackPage;
