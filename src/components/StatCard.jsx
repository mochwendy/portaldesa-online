import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ icon: Icon, label, value, sublabel, accent = 'bg-primary/10 text-primary' }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1 tracking-tight truncate">{value}</p>
          {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', accent)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}