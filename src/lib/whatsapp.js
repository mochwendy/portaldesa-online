/**
 * Utility untuk notifikasi WhatsApp otomatis.
 * Menghasilkan link wa.me (click-to-chat) dengan pesan pre-filled.
 */

/**
 * Membersihkan nomor telepon ke format internasional WhatsApp (62xxx, tanpa + atau spasi).
 */
export function normalizePhone(phone) {
    if (!phone) return '';
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('62')) return clean;
    if (clean.startsWith('0')) return '62' + clean.slice(1);
    if (clean.startsWith('8')) return '62' + clean;
    return clean;
  }
  
  /**
   * Membangun pesan notifikasi untuk surat yang selesai diproses.
   */
  export function buildSuratSelesaiMessage(surat, namaDesa = 'Tagog Apu', pdfUrl = '') {
    const pengambilan = pdfUrl
      ? `📎 Unduh surat (PDF): ${pdfUrl}
  
  Surat ditandatangani secara elektronik (QR) dan dapat diverifikasi keasliannya.`
      : `Silakan ambil surat di Kantor Desa ${namaDesa} dengan membawa berkas pendukung yang diperlukan.`;
  
    return `Yth. Bapak/Ibu ${surat.nama_pemohon},
  
  Kami informasikan bahwa pengajuan surat Anda telah *SELESAI* diproses:
  
  📄 Jenis Surat: ${surat.jenis_surat}
  🔢 Nomor Surat: ${surat.nomor_surat || '-'}
  
  ${pengambilan}
  
  Terima kasih.
  — Pemerintah Desa ${namaDesa}`;
  }
  
  /**
   * Membangun pesan jawaban resmi atas aspirasi warga (termasuk narasi tanggapan).
   */
  export function buildAspirasiTanggapanMessage(aspirasi, tanggapan, status, namaDesa = 'Tagog Apu') {
    return `Yth. Bapak/Ibu ${aspirasi?.nama || 'Warga'},
  
  Terima kasih atas ${aspirasi?.kategori || 'laporan'} yang Anda sampaikan melalui Portal Desa ${namaDesa}.
  
  🎫 Nomor Tiket: ${aspirasi?.nomor_tiket || '-'}
  📌 Judul: ${aspirasi?.judul || '-'}
  
  *Tanggapan Pemerintah Desa ${namaDesa}:*
  ${tanggapan}
  
  Status penanganan: *${status}*
  
  Terima kasih.
  — Pemerintah Desa ${namaDesa}`;
  }
  
  /**
   * Membangun link WhatsApp click-to-chat (wa.me) dengan pesan pre-filled.
   */
  export function buildWhatsAppLink(phone, message) {
    const normalized = normalizePhone(phone);
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  }