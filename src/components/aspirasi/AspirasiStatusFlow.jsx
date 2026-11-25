import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STATUS_STYLES } from '@/components/aspirasi/AspirasiTable';

const STEPS = ['Baru', 'Diproses', 'Dijawab', 'Selesai'];

export default function AspirasiStatusFlow({ status, onFinal, onReset }) {
  const isFinal = status === 'Selesai' || status === 'Ditolak';
  const activeIndex = status === 'Ditolak' ? -1 : STEPS.indexOf(status);

  return (
    <div className="rounded-xl border border-border p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status Otomatis</p>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status] || 'bg-muted text-muted-foreground'}`}>
          {status}
        </span>
      </div>

      <div className="flex items-start gap-1">
        {STEPS.map((step, index) => (
          <div key={step} className="flex-1">
            <div className={`h-1.5 rounded-full ${index <= activeIndex ? 'bg-primary' : 'bg-muted'}`} />
            <p className={`text-[10px] mt-1 leading-tight ${index === activeIndex ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
              {step}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isFinal ? (
          <button type="button" onClick={onReset} className="text-xs font-medium text-primary hover:underline">
            Batalkan status {status.toLowerCase()} (kembali ke tahap tanggapan)
          </button>
        ) : (
          <>
            <Button type="button" size="sm" variant="outline" onClick={() => onFinal('Selesai')}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Tandai Selesai
            </Button>
            <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={() => onFinal('Ditolak')}>
              <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
            </Button>
          </>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Status mengikuti tindakan yang dilakukan: petugas ditetapkan → <span className="font-medium text-foreground">Diproses</span>,
        tanggapan disimpan atau dikirim via WhatsApp → <span className="font-medium text-foreground">Dijawab</span>.
        Tekan Simpan untuk menerapkan.
      </p>
    </div>
  );
}