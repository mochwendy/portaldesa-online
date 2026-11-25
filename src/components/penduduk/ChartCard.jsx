import React from 'react';

export default function ChartCard({ title, subtitle, height = 240, children }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
      <div style={{ height }}>{children}</div>
    </div>
  );
}