import React from 'react';

const colorThemes = {
  blue: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    iconColor: '#2563eb'
  },
  amber: {
    bg: '#fffbeb',
    border: '#fde68a',
    iconColor: '#d97706'
  },
  green: {
    bg: '#ecfdf5',
    border: '#a7f3d0',
    iconColor: '#059669'
  },
  purple: {
    bg: '#f5f3ff',
    border: '#ddd6fe',
    iconColor: '#7c3aed'
  }
};

const StatCard = ({ title, value, description, icon: Icon, color = 'blue' }) => {
  const theme = colorThemes[color] || colorThemes.blue;

  return (
    <div className="card stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
          {title}
        </span>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '4px',
            backgroundColor: theme.bg,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.iconColor
          }}
        >
          {Icon && <Icon size={22} />}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          {value !== undefined && value !== null ? value : '—'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {description}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
