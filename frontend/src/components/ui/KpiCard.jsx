import React from 'react';
import { Card } from './Card';

export function KpiCard({ label, value, icon: Icon }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-soft)', fontWeight: 600 }}>{label}</span>
        {Icon && (
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-card-sm)',
              background: 'var(--primary-mid)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-deep)',
              flexShrink: 0,
            }}
          >
            <Icon size={15} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
      </div>
      <span style={{ fontSize: 'var(--text-hero)', fontWeight: 600, color: 'var(--text)' }}>{value}</span>
    </Card>
  );
}
