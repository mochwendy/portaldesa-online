import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  FONT_OPTIONS,
  HERO_OPTIONS,
  DEFAULT_PRIMARY_HEX,
  DEFAULT_ACCENT_HEX,
} from '@/lib/websiteSettings';

function ColorField({ id, label, value, fallback, onChange, onReset }) {
  const current = value || fallback;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={current}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded-md border border-input bg-transparent p-0.5 cursor-pointer"
        />
        <Input value={current} onChange={(e) => onChange(e.target.value)} className="max-w-[130px] font-mono text-xs" />
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>Bawaan</Button>
        ) : (
          <span className="text-xs text-muted-foreground">Warna bawaan</span>
        )}
      </div>
    </div>
  );
}

export default function TampilanTab({ form, onChange }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <ColorField
          id="warna-primary"
          label="Warna Utama (header, tombol, sidebar)"
          value={form.warna_primary}
          fallback={DEFAULT_PRIMARY_HEX}
          onChange={(v) => onChange('warna_primary', v)}
          onReset={() => onChange('warna_primary', '')}
        />
        <ColorField
          id="warna-accent"
          label="Warna Aksen (sorotan & tombol utama)"
          value={form.warna_accent}
          fallback={DEFAULT_ACCENT_HEX}
          onChange={(v) => onChange('warna_accent', v)}
          onReset={() => onChange('warna_accent', '')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Font Judul</Label>
          <Select value={form.font_judul || FONT_OPTIONS[0]} onValueChange={(v) => onChange('font_judul', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Font Isi Teks</Label>
          <Select value={form.font_isi || FONT_OPTIONS[0]} onValueChange={(v) => onChange('font_isi', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <Label>Layout Header Beranda</Label>
        <Select value={form.gaya_hero || 'tengah'} onValueChange={(v) => onChange('gaya_hero', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {HERO_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Mengatur posisi teks sambutan pada header portal. Pilihan “polos” menghilangkan foto latar.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-xs text-muted-foreground mb-2">Pratinjau kombinasi warna</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: form.warna_primary || DEFAULT_PRIMARY_HEX, color: '#fff' }}>
            Warna Utama
          </span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: form.warna_accent || DEFAULT_ACCENT_HEX, color: '#1a1a1a' }}>
            Warna Aksen
          </span>
        </div>
      </div>
    </div>
  );
}