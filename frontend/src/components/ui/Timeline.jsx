import React from 'react';
import { Check } from 'lucide-react';

export function Timeline({ children }) {
  return <div className="ui-timeline">{children}</div>;
}

/**
 * status: 'concluido' (círculo verde + check), 'atual' (círculo --primary),
 * 'futuro' (contorno cinza). `last` remove a linha vertical do último item.
 */
export function TimelineItem({ status = 'futuro', title, subtitle, last = false, onClick }) {
  const circleStyle = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (status === 'concluido') {
    Object.assign(circleStyle, { background: 'var(--risk-low)', color: '#fff' });
  } else if (status === 'atual') {
    Object.assign(circleStyle, { background: 'var(--primary)', color: '#fff' });
  } else {
    Object.assign(circleStyle, { background: 'var(--surface)', border: '1px solid var(--border)' });
  }

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={circleStyle} aria-hidden="true">
          {status === 'concluido' && <Check size={13} strokeWidth={3} />}
        </div>
        {!last && <div style={{ width: 2, flex: 1, minHeight: 24, background: 'var(--border)' }} />}
      </div>
      <Wrapper
        onClick={onClick}
        className={onClick ? 'ui-timeline-item-button' : undefined}
        style={{
          textAlign: 'left',
          background: status === 'atual' ? 'var(--primary-soft)' : 'transparent',
          border: 0,
          borderRadius: 'var(--radius-card-sm)',
          padding: status === 'atual' ? 'var(--space-2) var(--space-3)' : '0 0 var(--space-1) 0',
          marginBottom: 'var(--space-3)',
          width: '100%',
          cursor: onClick ? 'pointer' : 'default',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-soft)', marginTop: 2 }}>{subtitle}</div>
        )}
      </Wrapper>
    </div>
  );
}
