// Notifikasi WhatsApp saat permohonan surat dinyatakan selesai.
// Surat bertanda tangan QR disertai tautan unduh PDF surat (tautan tetap ke portal desa).
import { base44 } from '@/api/base44Client';
import { buatPdfSuratUri } from '@/lib/suratPdf';
import { urlUnduhSurat } from '@/lib/suratVerifikasi';
import { buildWhatsAppLink, buildSuratSelesaiMessage } from '@/lib/whatsapp';

export async function kirimNotifikasiSelesai(surat, namaDesa) {
  if (!surat?.no_telepon) return false;

  // Tab dibuka lebih dulu agar tidak diblokir peramban saat PDF sedang dibuat.
  const tab = window.open('', '_blank');

  let pdfUrl = '';
  if (surat.tipe_ttd === 'QR' && surat.kode_verifikasi) {
    try {
      const file_uri = await buatPdfSuratUri(surat);
      if (surat.id) {
        await base44.entities.SuratKeterangan.update(surat.id, { pdf_file_uri: file_uri });
      }
      pdfUrl = urlUnduhSurat(surat.kode_verifikasi);
    } catch (e) {
      console.error('Gagal membuat PDF surat:', e);
    }
  }

  const link = buildWhatsAppLink(
    surat.no_telepon,
    buildSuratSelesaiMessage(surat, namaDesa, pdfUrl)
  );
  if (tab) tab.location.href = link;
  else window.open(link, '_blank');
  return true;
}