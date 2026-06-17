import React from 'react';

export default function ModuleCard({ title, description, icon, checked, onChange, accentColor }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        borderRadius: '16px',
        border: `2px solid ${checked ? (accentColor || 'var(--kb-purple)') : 'rgba(0, 0, 0, 0.08)'}`,
        background: checked ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.4)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: checked ? '0 8px 20px rgba(0,0,0,0.06)' : 'none',
        marginBottom: '16px',
        userSelect: 'none',
      }}
      className="module-card"
    >
      <div style={{ fontSize: '32px', marginRight: '16px' }}>{icon}</div>
      <div style={{ flex: 1, marginRight: '16px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: 'var(--kb-text, #333)' }}>
          {title}
        </h4>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--kb-text-muted, #666)', lineHeight: '1.4' }}>
          {description}
        </p>
      </div>
      <div
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          background: checked ? (accentColor || 'var(--kb-purple)') : '#e0e0e0',
          position: 'relative',
          padding: '2px',
          transition: 'background-color 0.2s',
          flexShrink: 0
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#ffffff',
            position: 'absolute',
            left: checked ? '22px' : '2px',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        />
      </div>
    </div>
  );
}
