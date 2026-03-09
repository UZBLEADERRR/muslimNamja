// Admin Panel Design Tokens & Shared Styles
export const colors = {
    bg: '#080C14', surface: '#0D1421', card: '#111827', border: '#1E2A3A',
    accent: '#00D4FF', profit: '#00F5A0', danger: '#FF4560', warning: '#FFB800',
    purple: '#A855F7', pink: '#FF3CAC', text: '#E8F0FE', subtext: '#6B7E99',
    cardGrad: 'linear-gradient(135deg, #111827, #0D1421)',
};

export const cardStyle = {
    background: colors.card, borderRadius: 16, padding: 16,
    border: `1px solid ${colors.border}`, marginBottom: 12,
};

export const inputStyle = {
    padding: '12px 14px', borderRadius: 12, border: `1px solid ${colors.border}`,
    background: colors.surface, color: colors.text, fontSize: 14,
    outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
};

export const btnPrimary = {
    background: colors.accent, color: '#fff', border: 'none', borderRadius: 12,
    padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
};

export const btnDanger = { ...btnPrimary, background: colors.danger };
export const btnSuccess = { ...btnPrimary, background: colors.profit, color: '#000' };

export const chipStyle = (active) => ({
    padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
    border: active ? 'none' : `1px solid ${colors.border}`,
    background: active ? colors.accent : colors.surface,
    color: active ? '#fff' : colors.subtext, cursor: 'pointer',
    transition: 'all 0.2s', whiteSpace: 'nowrap',
});

export const kpiCard = (color) => ({
    ...cardStyle, textAlign: 'center', flex: 1, minWidth: 0,
    background: `linear-gradient(135deg, ${color}15, ${colors.card})`,
    border: `1px solid ${color}30`,
});

export const badge = (color) => ({
    display: 'inline-block', padding: '4px 10px', borderRadius: 8,
    fontSize: 11, fontWeight: 800, background: `${color}20`, color,
    textTransform: 'uppercase',
});

export const sectionTitle = {
    fontSize: 16, fontWeight: 800, color: colors.text, marginBottom: 12, marginTop: 8,
};

export const subText = { fontSize: 12, color: colors.subtext, fontWeight: 500 };
export const mainText = { fontSize: 14, color: colors.text, fontWeight: 700 };
export const bigNum = { fontSize: 28, fontWeight: 900, fontFamily: "'Fraunces', serif" };
