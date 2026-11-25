import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ListRestart } from 'lucide-react';
import { DEFAULT_FOOTER_LINKS, parseFooterLinks } from '@/lib/websiteSettings';

export default function FooterTab({ form, onChange }) {
  // Daftar tautan dipegang dalam state lokal agar baris baru yang masih kosong tetap tampil.
  const [links, setLinksState] = useState(() => parseFooterLinks(form.footer_links));
  const setLinks = (next) => {
    setLinksState(next);
    onChange('footer_links', JSON.stringify(next));
  };

  const updateLink = (index, field, value) => {
    setLinks(links.map((link, i) => (i === index ? { ...link, [field]: value } : link)));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="footer-narasi">Narasi Footer</Label>
        <Textarea
          id="footer-narasi"
          rows={3}
          placeholder="Website resmi Pemerintah Desa …"
          value={form.footer_narasi || ''}
          onChange={(e) => onChange('footer_narasi', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Kosongkan untuk memakai narasi bawaan.</p>
      </div>

      <div className="space-y-3 pt-4 border-t border-border">
        <Label>Informasi Kontak Footer</Label>
        <div className="space-y-2">
          <Label htmlFor="footer-alamat" className="text-xs text-muted-foreground font-normal">Alamat Kantor Desa</Label>
          <Textarea
            id="footer-alamat"
            rows={2}
            value={form.footer_alamat || ''}
            onChange={(e) => onChange('footer_alamat', e.target.value)}
            placeholder="Jl. Raya Tagog Apu No. 1, Padalarang, Bandung Barat"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="footer-telepon" className="text-xs text-muted-foreground font-normal">Telepon / WhatsApp</Label>
            <Input
              id="footer-telepon"
              value={form.footer_telepon || ''}
              onChange={(e) => onChange('footer_telepon', e.target.value)}
              placeholder="(022) 1234-5678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footer-email" className="text-xs text-muted-foreground font-normal">Email Resmi Desa</Label>
            <Input
              id="footer-email"
              type="email"
              value={form.footer_email || ''}
              onChange={(e) => onChange('footer_email', e.target.value)}
              placeholder="desa.tagogapu@bandungbarat.go.id"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Kosongkan kolom untuk menyembunyikan baris kontak tersebut di footer.</p>
      </div>

      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Tautan Footer</Label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setLinks(DEFAULT_FOOTER_LINKS)}>
              <ListRestart className="w-4 h-4" /> Tautan bawaan
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setLinks([...links, { label: '', url: '' }])}>
              <Plus className="w-4 h-4" /> Tambah Tautan
            </Button>
          </div>
        </div>

        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-4">
            Belum ada tautan khusus, footer memakai tautan bawaan.
          </p>
        ) : (
          <div className="space-y-2">
            {links.map((link, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2 bg-muted/40 border border-border rounded-xl p-2">
                <Input
                  value={link.label}
                  onChange={(e) => updateLink(index, 'label', e.target.value)}
                  placeholder="Label tautan"
                  className="flex-1 min-w-[140px] bg-card"
                />
                <Input
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                  placeholder="/profil-desa atau https://..."
                  className="flex-1 min-w-[160px] bg-card text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => setLinks(links.filter((_, i) => i !== index))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Gunakan tautan internal (contoh /profil-desa) atau alamat lengkap https:// untuk situs lain.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="footer-copyright">Teks Hak Cipta</Label>
        <Input
          id="footer-copyright"
          placeholder="© 2026 Pemerintah Desa Tagog Apu. Dikelola oleh SIMDESTA."
          value={form.footer_copyright || ''}
          onChange={(e) => onChange('footer_copyright', e.target.value)}
        />
      </div>
    </div>
  );
}