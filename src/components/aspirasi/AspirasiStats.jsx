import React from 'react';
import { MessageSquare, Inbox, Loader2, CheckCircle2 } from 'lucide-react';

const CARDS = [
  { key: 'total', label: 'Total Aspirasi', icon: MessageSquare, tone: 'bg-primary/10 text-primary' },
  { key: 'baru', label: 'Belum Ditangani', icon: Inbox, tone: 'bg-blue-100 text-blue-700' },
  { key: 'diproses', label: 'Sedang Diproses', icon: Loader2, tone: 'bg-amber-100 text-amber-700' },
  { key: 'selesai', label: 'Selesai', icon: CheckCircle2, tone: 'bg-emerald-100 text-emerald-700' },
];

export default function AspirasiStats({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {CARDS.map((card) => (
        <div key={card.key} className="bg-card border border-border rounded-2xl p-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.tone}`}>
            <card.icon className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold mt-3 tracking-tight">{(stats?.[card.key] || 0).toLocaleString('id-ID')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
        </div>
      ))}
    </div>
  );
}