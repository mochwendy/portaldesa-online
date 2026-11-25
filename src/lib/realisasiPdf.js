import { jsPDF } from 'jspdf';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

/**
 * Menghasilkan laporan PDF realisasi pembangunan untuk arsip & audit.
 * @param {Array} items - daftar kegiatan RealisasiPembangunan
 * @param {Object} profilDesa - profil desa (opsional)
 */
export function exportRealisasiPdf(items = [], profilDesa = null) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  const namaDesa = profilDesa?.nama_desa || 'Desa';
  const kecamatan = profilDesa?.kecamatan || '';
  const kabupaten = profilDesa?.kabupaten || '';
  const provinsi = profilDesa?.provinsi || '';
  const kepalaDesa = profilDesa?.kepala_desa || '';

  // === Header ===
  doc.setFillColor(22, 101, 52); // primary green
  doc.rect(0, 0, pageW, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LAPORAN REALISASI PEMBANGUNAN DESA', margin, 10);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${namaDesa.toUpperCase()}${kecamatan ? `, KEC. ${kecamatan.toUpperCase()}` : ''}`, margin, 16);
  doc.text(`${kabupaten ? `KAB. ${kabupaten.toUpperCase()}  ` : ''}${provinsi ? `PROV. ${provinsi.toUpperCase()}` : ''}`, margin, 21);

  // Info laporan (kanan atas)
  doc.setFontSize(9);
  const tglCetak = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Tanggal Cetak: ${tglCetak}`, pageW - margin, 10, { align: 'right' });
  doc.text(`Total Kegiatan: ${items.length}`, pageW - margin, 16, { align: 'right' });

  y = 30;

  // === Ringkasan Statistik ===
  const totalAnggaran = items.reduce((s, i) => s + (i.anggaran || 0), 0);
  const totalRealisasi = items.reduce((s, i) => s + (i.realisasi_anggaran || 0), 0);
  const selesai = items.filter((i) => i.status === 'Selesai').length;
  const avgProgress = items.length > 0
    ? Math.round(items.reduce((s, i) => s + (i.persentase_progress || 0), 0) / items.length)
    : 0;

  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RINGKASAN', margin, y);
  y += 5;

  const summary = [
    ['Total Kegiatan', String(items.length)],
    ['Total Anggaran', formatRupiah(totalAnggaran)],
    ['Total Realisasi Anggaran', formatRupiah(totalRealisasi)],
    ['Kegiatan Selesai', String(selesai)],
    ['Rata-rata Progress Fisik', `${avgProgress}%`],
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  summary.forEach(([label, val]) => {
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin, y);
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.text(val, margin + 60, y);
    doc.setFont('helvetica', 'normal');
    y += 5.5;
  });
  y += 4;

  // === Tabel Kegiatan ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('RINCIAN KEGIATAN', margin, y);
  y += 5;

  const colX = {
    no: margin,
    kegiatan: margin + 8,
    sumber: margin + 80,
    anggaran: margin + 105,
    realisasi: margin + 140,
    progress: margin + 175,
    status: margin + 195,
  };
  const colW = {
    no: 8,
    kegiatan: 72,
    sumber: 25,
    anggaran: 35,
    realisasi: 35,
    progress: 20,
    status: pageW - margin - colX.status,
  };

  // Header tabel
  doc.setFillColor(22, 101, 52);
  doc.rect(margin, y - 4, pageW - margin * 2, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('No', colX.no + 1, y + 1);
  doc.text('Nama Kegiatan / Lokasi', colX.kegiatan + 1, y + 1);
  doc.text('Sumber Dana', colX.sumber + 1, y + 1);
  doc.text('Anggaran', colX.anggaran + 1, y + 1);
  doc.text('Realisasi', colX.realisasi + 1, y + 1);
  doc.text('Progress', colX.progress + 1, y + 1);
  doc.text('Status', colX.status + 1, y + 1);
  y += 8;

  // Baris data
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const rowH = 7;
  items.forEach((item, idx) => {
    if (y + rowH > pageH - 20) {
      doc.addPage();
      y = margin;
      // ulang header tabel
      doc.setFillColor(22, 101, 52);
      doc.rect(margin, y - 4, pageW - margin * 2, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('No', colX.no + 1, y + 1);
      doc.text('Nama Kegiatan / Lokasi', colX.kegiatan + 1, y + 1);
      doc.text('Sumber Dana', colX.sumber + 1, y + 1);
      doc.text('Anggaran', colX.anggaran + 1, y + 1);
      doc.text('Realisasi', colX.realisasi + 1, y + 1);
      doc.text('Progress', colX.progress + 1, y + 1);
      doc.text('Status', colX.status + 1, y + 1);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    // zebra striping
    if (idx % 2 === 1) {
      doc.setFillColor(240, 245, 242);
      doc.rect(margin, y - 4, pageW - margin * 2, rowH, 'F');
    }

    doc.setTextColor(40, 40, 40);
    doc.text(String(idx + 1), colX.no + 1, y);
    const kegiatanLines = doc.splitTextToSize(
      `${item.nama_kegiatan || '-'}${item.lokasi ? `\n${item.lokasi}` : ''}`,
      colW.kegiatan - 2
    );
    doc.text(kegiatanLines, colX.kegiatan + 1, y);
    doc.text(String(item.sumber_dana || '-'), colX.sumber + 1, y);
    doc.text(formatRupiah(item.anggaran), colX.anggaran + 1, y);
    doc.text(formatRupiah(item.realisasi_anggaran), colX.realisasi + 1, y);
    doc.text(`${item.persentase_progress || 0}%`, colX.progress + 1, y);
    doc.text(String(item.status || '-'), colX.status + 1, y);

    const lines = Math.max(kegiatanLines.length, 1);
    y += rowH * Math.max(1, lines);
  });

  // === Footer tanda tangan ===
  y += 10;
  if (y > pageH - 40) { doc.addPage(); y = margin + 10; }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  const tx = pageW - margin - 70;
  doc.text(`Mengetahui,`, tx, y);
  y += 5;
  doc.text(`Kepala Desa ${namaDesa}`, tx, y);
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text(kepalaDesa || '(____________________)', tx, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Tanda tangan & stempel', tx, y);

  // Footer halaman
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Laporan Realisasi Pembangunan ${namaDesa} — ${tglCetak}`,
      margin, pageH - 8
    );
    doc.text(`Hal. ${p} / ${pageCount}`, pageW - margin, pageH - 8, { align: 'right' });
  }

  const filename = `Laporan_Realisasi_Pembangunan_${namaDesa.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}