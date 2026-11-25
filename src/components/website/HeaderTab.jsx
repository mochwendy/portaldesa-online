import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function HeaderTab({ form, onChange }) {
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="hero-badge">Sapaan Pembuka</Label>
        <Input
          id="hero-badge"
          placeholder="Selamat Datang di Portal Smart Villages"
          value={form.hero_badge || ''}
          onChange={(e) => onChange('hero_badge', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Teks kecil di atas judul header.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hero-judul">Judul Header</Label>
        <Input
          id="hero-judul"
          placeholder="Desa Tagog Apu"
          value={form.hero_judul || ''}
          onChange={(e) => onChange('hero_judul', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hero-deskripsi">Narasi Selamat Datang</Label>
        <Textarea
          id="hero-deskripsi"
          rows={4}
          placeholder="Mewujudkan desa mandiri, transparan, dan berdaya saing berbasis teknologi digital."
          value={form.hero_deskripsi || ''}
          onChange={(e) => onChange('hero_deskripsi', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Biarkan kosong untuk memakai teks bawaan (judul mengikuti nama desa, narasi mengikuti visi pada Profil Desa).
        </p>
      </div>
    </div>
  );
}