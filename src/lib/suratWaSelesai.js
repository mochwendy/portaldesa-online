// Notifikasi WhatsApp saat permohonan surat dinyatakan selesai.
// Surat bertanda tangan QR disertai tautan unduh PDF surat (tautan tetap ke portal desa).
import { createSupabaseEntity } from '@/api/supabaseAdapter';
import { buatPdfSuratUri } from '@/lib/suratPdf';
import { urlUnduhSurat } from '@/lib/suratVerifikasi';
import { buildWhatsAppLink, buildSuratSelesaiMessage } from '@/lib/whatsapp';

export async function kirimNotifikasiSelesai(surat, namaDesa) {
  if (!surat?.no_telepon) {
    console.error('Tidak bisa kirim notifikasi WhatsApp: tidak ada nomor telepon');
    return false;
  }

  // Tab dibuka lebih dulu agar tidak diblokir peramban saat PDF sedang dibuat.
  const tab = window.open('', '_blank');

  let pdfUrl = '';
  try {
    if (surat.tipe_ttd === 'QR' && surat.kode_verifikasi) {
      const file_uri = await buatPdfSuratUri(surat);
      if (surat.id) {
        const suratEntity = createSupabaseEntity('SuratKeterangan');
        await suratEntity.update(surat.id, { pdf_file_uri: file_uri });
      }
      pdfUrl = urlUnduhSurat(surat.kode_verifikasi);
    }
  } catch (error) {
    console.error('Gagal membuat PDF surat:', error);
    // Tetapi tetap lanjut ke kirim notifikasi, karena notifikasi tidak bergantung pada PDF
  }

  try {
    const link = buildWhatsAppLink(
      surat.no_telepon,
      buildSuratSelesaiMessage(surat, namaDesa, pdfUrl)
    );
    
    if (tab) {
      tab.location.href = link;
    } else {
      window.open(link, '_blank');
    }
    
    return true;
  } catch (error) {
    console.error('Gagal kirim notifikasi WhatsApp:', error);
    return false;
  }
}