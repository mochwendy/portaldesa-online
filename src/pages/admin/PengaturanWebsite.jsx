import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';
import { DEFAULT_SETTINGS, setSettingsCache } from '@/lib/websiteSettings';
import IdentitasTab from '@/components/website/IdentitasTab';
import TampilanTab from '@/components/website/TampilanTab';
import HeaderTab from '@/components/website/HeaderTab';
import FooterTab from '@/components/website/FooterTab';

export default function PengaturanWebsite() {
  const { toast } = useToast();
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.WebsiteSetting.list('-updated_date', 1);
        if (list[0]) {
          setRecordId(list[0].id);
          setForm({ ...DEFAULT_SETTINGS, ...list[0] });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      Object.keys(DEFAULT_SETTINGS).forEach((key) => {
        payload[key] = form[key] ?? '';
      });
      const saved = recordId
        ? await base44.entities.WebsiteSetting.update(recordId, payload)
        : await base44.entities.WebsiteSetting.create(payload);
      const next = { ...DEFAULT_SETTINGS, ...saved };
      setRecordId(saved.id);
      setForm(next);
      setSettingsCache(next);
      toast({ title: 'Pengaturan aplikasi disimpan', description: 'Perubahan langsung tampil di portal smart desa.' });
    } catch (err) {
      toast({ title: 'Gagal menyimpan pengaturan', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Pengaturan Aplikasi" subtitle="Atur tampilan, logo, narasi header, kontak, dan tautan footer portal smart desa">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Pengaturan
        </Button>
      </PageHeader>

      <Tabs defaultValue="tampilan" className="mt-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="tampilan">Tampilan &amp; Warna</TabsTrigger>
          <TabsTrigger value="identitas">Logo Website</TabsTrigger>
          <TabsTrigger value="header">Header Beranda</TabsTrigger>
          <TabsTrigger value="footer">Footer, Kontak &amp; Tautan</TabsTrigger>
        </TabsList>

        <TabsContent value="tampilan" className="mt-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <TampilanTab form={form} onChange={onChange} />
          </div>
        </TabsContent>

        <TabsContent value="identitas" className="mt-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <IdentitasTab form={form} onChange={onChange} />
          </div>
        </TabsContent>

        <TabsContent value="header" className="mt-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <HeaderTab form={form} onChange={onChange} />
          </div>
        </TabsContent>

        <TabsContent value="footer" className="mt-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <FooterTab form={form} onChange={onChange} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}