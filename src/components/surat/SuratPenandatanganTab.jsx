import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PenLine, Stamp, QrCode, ShieldCheck } from 'lucide-react';

export default function SuratPenandatanganTab({ s, set, pejabat, selected, ttdUrl, onUpload, uploading, kode }) {
  const pick = (id) => {
    const o = pejabat.find((x) => x.id === id);
    set({ pejabatId: id, atasNama: o ? o.jabatan !== 'Kepala Desa' : false });
  };
  return (
    <div className="space-y-4">
      <div>
        <Label>Pejabat Penandatangan</Label>
        <Select value={s.pejabatId} onValueChange={pick}>
          <SelectTrigger><SelectValue placeholder="Pilih pejabat" /></SelectTrigger>
          <SelectContent>
            {pejabat.map((o) => <SelectItem key={o.id} value={o.id}>{o.nama} — {o.jabatan}</SelectItem>)}
          </SelectContent>
        </Select>
        {pejabat.length === 0 && (
          <p className="text-xs text-destructive mt-1">Belum ada data perangkat desa. Tambahkan di menu Perangkat Desa.</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="an" checked={s.atasNama} onCheckedChange={(v) => set({ atasNama: !!v })} />
        <Label htmlFor="an">Tanda tangan "a.n Kepala Desa"</Label>
      </div>

      <div>
        <Label>Tipe Tanda Tangan</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
          {[['Manual', 'Manual (basah)', Stamp, 'Dikosongkan untuk ditandatangani langsung di atas kertas'],
            ['Digital', 'Digital', PenLine, 'Gambar tanda tangan pejabat tercetak di surat'],
            ['QR', 'QR SIMDESTA', QrCode, 'QR otomatis untuk validasi keaslian surat secara publik']].map(([v, l, Icon, d]) => (
            <button key={v} type="button" onClick={() => set({ tipeTtd: v })}
              className={`text-left p-3 rounded-lg border ${s.tipeTtd === v ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <p className="font-semibold text-sm flex items-center gap-1.5"><Icon className="w-4 h-4" /> {l}</p>
              <p className="text-xs text-muted-foreground mt-1">{d}</p>
            </button>
          ))}
        </div>
      </div>

      {s.tipeTtd === 'Digital' && selected && (
        <div className="p-3 rounded-lg border border-border space-y-2">
          <Label>Gambar tanda tangan {selected.nama}</Label>
          {ttdUrl
            ? <img src={ttdUrl} alt="Tanda tangan" className="h-20 bg-white border border-border rounded p-1" />
            : <p className="text-xs text-amber-600">Belum ada tanda tangan tersimpan. Unggah gambar (PNG latar transparan disarankan).</p>}
          <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} />
          <p className="text-xs text-muted-foreground">Disimpan privat pada data perangkat desa dan dipakai otomatis untuk surat berikutnya.</p>
        </div>
      )}

      {s.tipeTtd === 'QR' && (
        <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-emerald-900 space-y-1">
            <p className="font-semibold">QR verifikasi keaslian surat (SIMDESTA)</p>
            <p>
              QR dibuat otomatis dan tercetak pada posisi tanda tangan pejabat, menggantikan tanda tangan
              basah/digital. Siapa pun dapat memindainya untuk memastikan surat resmi diterbitkan pemerintah
              desa dan ditandatangani pejabat berwenang.
            </p>
            {kode ? <p className="font-mono tracking-wide">Kode: {kode}</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}