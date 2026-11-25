import React from 'react';
import { ClipboardList, Search, CheckCircle2, Wallet, ArrowRight } from 'lucide-react';

const FLOW = [
  { status: 'Diajukan', label: 'Diajukan', icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { status: 'Diverifikasi', label: 'Diverifikasi', icon: Search, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { status: 'Disetujui', label: 'Disetujui', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { status: 'Masuk Anggaran', label: 'Masuk Anggaran', icon: Wallet, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
];

export default function UsulanStatusFlow({ usulan }) {
  const counts = FLOW.map(f => ({ ...f, count: usulan.filter(u => u.status === f.status).length }));
  const total = usulan.length;
  const completed = usulan.filter(u => u.status === 'Masuk Anggaran').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm">Alur Status Usulan</h3>
          <p className="text-xs text-muted-foreground">Pipeline pemrosesan usulan pembangunan</p>
        </div>
        <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">{progress}% tuntas</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {counts.map((step, i) => (
          <React.Fragment key={step.status}>
            <div className={`flex-1 min-w-[140px] rounded-lg border ${step.border} ${step.bg} p-3`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg bg-white ${step.color} flex items-center justify-center`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Tahap {i + 1}</span>
              </div>
              <p className="text-xl font-extrabold text-foreground">{step.count}</p>
              <p className="text-xs font-medium text-foreground">{step.label}</p>
            </div>
            {i < counts.length - 1 && (
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}