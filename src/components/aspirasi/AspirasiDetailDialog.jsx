import React, { useEffect, useState } from 'react';
import { createSupabaseEntity } from '@/api/supabaseAdapter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, MessageCircle } from 'lucide-react';
import AspirasiDetailInfo from '@/components/aspirasi/AspirasiDetailInfo';
import AspirasiStatusFlow from '@/components/aspirasi/AspirasiStatusFlow';
import { buildWhatsAppLink, buildAspirasiTanggapanMessage, normalizePhone } from '@/lib/whatsapp';

const FINAL_STAGES = ['Selesai', 'Ditolak'];
const WA_NOTIFY_STATUSES = ['Diterima', 'Diproses', 'Dijawab', 'Ditolak'];

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AspirasiDetailDialog({ open, onOpenChange, aspirasi, onSaved }) {
  const { toast } = useToast();
  const [tanggapan, setTanggapan] = useState('');
  const [petugas, setPetugas] = useState('');
  const [finalStage, setFinalStage] = useState('none');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [prevAspirasi, setPrevAspirasi] = useState(null);

  useEffect(() => {
    if (!aspirasi) return;
    setTanggapan(aspirasi.tanggapan || '');
    setPetugas(aspirasi.petugas || '');
    setFinalStage(FINAL_STAGES.includes(aspirasi.status) ? aspirasi.status : 'none');
    if (!aspirasi.petugas) {
      // Use localStorage auth token instead
      const userStr = localStorage.getItem('simdesta_auth_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setPetugas(user.full_name || '');
        } catch {}
      }
    }
    setPrevAspirasi(aspirasi);
  }, [aspirasi]);

  // Status mengikuti tahapan aksi: petugas → Diproses, tanggapan → Dijawab, selesai/tolak manual.
  const autoStatus = finalStage !== 'none'
    ? finalStage
    : tanggapan.trim()
      ? 'Dijawab'
      : petugas.trim()
        ? 'Diproses'
        : 'Baru';

  const persist = async (statusOverride) => {
    const status = statusOverride || autoStatus;
    const narasi = tanggapan.trim();
    const payload = { status, tanggapan: narasi, petugas: petugas.trim() };
    if (narasi && narasi !== (aspirasi.tanggapan || '')) {
      payload.tanggal_tanggapan = todayISO();
    }
    const entity = createSupabaseEntity('Aspirasi');
    await entity.update(aspirasi.id, payload);
    return status;
  };

  // Kirim notifikasi WhatsApp saat status berubah ke status yang memerlukan notifikasi.
  const sendWaNotification = async (status) => {
    if (!aspirasi) return false;
    const noTelp = aspirasi.no_telepon;
    if (!noTelp) return false;
    try {
      const message = buildAspirasiTanggapanMessage(aspirasi, tanggapan.trim() || '', status);
      const link = buildWhatsAppLink(noTelp, message);
      window.open(link, '_blank');
      return true;
    } catch (err) {
      console.error('Gagal mengirim notifikasi WhatsApp:', err);
      return false;
    }
  };

  const save = async () => {
    if (!aspirasi) return;
    setSaving(true);
    try {
      const status = await persist();
      const isNotifStatus = WA_NOTIFY_STATUSES.includes(status);

      // Cek apakah status berubah dari yang sebelumnya
      const prevStatus = prevAspirasi?.status;
      const statusChanged = prevStatus && prevStatus !== status;

      if (isNotifStatus && aspirasi.no_telepon) {
        try {
          const message = buildAspirasiTanggapanMessage(aspirasi, tanggapan.trim(), status);
          window.open(buildWhatsAppLink(aspirasi.no_telepon, message), '_blank');
        } catch (waErr) {
          console.error('Gagal mengirim notifikasi WhatsApp:', waErr);
          // Tidak menghentikan alur menyimpan, notifikasi WhatsApp adalah tambahan
        }
      }

      const msg = statusChanged
        ? `Status berubah dari ${prevStatus} menjadi ${status}. Tanggapan tersimpan.`
        : `Tanggapan tersimpan dengan status ${status}.`;
      toast({ title: 'Aspirasi diperbarui', description: msg });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast({ title: 'Gagal menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const sendWhatsApp = async () => {
    if (!aspirasi) return;
    if (!tanggapan.trim()) {
      toast({
        title: 'Tanggapan masih kosong',
        description: 'Isi narasi tanggapan pemerintah desa sebelum dikirim ke WhatsApp warga.',
        variant: 'destructive',
      });
      return;
    }
    setSending(true);
    try {
      const status = await persist(finalStage !== 'none' ? finalStage : 'Dijawab');
      const message = buildAspirasiTanggapanMessage(aspirasi, tanggapan.trim(), status);
      window.open(buildWhatsAppLink(aspirasi.no_telepon, message), '_blank');
      toast({
        title: 'Tanggapan tersimpan & WhatsApp dibuka',
        description: 'Narasi tanggapan sudah terkirim lewat WhatsApp warga.',
      });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast({ title: 'Gagal mengirim tanggapan', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const nomor = normalizePhone(aspirasi?.no_telepon);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aspirasi {aspirasi?.nomor_tiket || ''}</DialogTitle>
        </DialogHeader>

        {aspirasi && (
          <div className="space-y-5">
            <AspirasiDetailInfo aspirasi={aspirasi} />

            <AspirasiStatusFlow
              status={autoStatus}
              onFinal={setFinalStage}
              onReset={() => setFinalStage('none')}
            />

            <div>
              <Label>Petugas Penanggung Jawab</Label>
              <Input
                value={petugas}
                onChange={(e) => setPetugas(e.target.value)}
                className="mt-1.5"
                placeholder="Nama petugas"
              />
            </div>

            <div>
              <Label>Tanggapan Pemerintah Desa</Label>
              <Textarea
                rows={5}
                value={tanggapan}
                onChange={(e) => setTanggapan(e.target.value)}
                className="mt-1.5"
                placeholder="Tuliskan tindak lanjut atau jawaban atas aspirasi warga. Narasi ini tersimpan dan dikirim ke WhatsApp pelapor."
              />
              {aspirasi.tanggal_tanggapan && (
                <p className="text-xs text-muted-foreground mt-1">
                  Tanggapan terakhir: {new Date(aspirasi.tanggal_tanggapan).toLocaleDateString('id-ID')}
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {nomor && (
            <Button variant="outline" onClick={sendWhatsApp} disabled={saving || sending}>
              {sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-1" />}
              Simpan & Kirim via WhatsApp
            </Button>
          )}
          <Button onClick={save} disabled={saving || sending}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}