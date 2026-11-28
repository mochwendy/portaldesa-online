// Menyusun dokumen surat lengkap: kop (header) - isi (body) - tanda tangan & footer.
import { formatTanggalPanjang } from '@/lib/suratTemplates';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function buildLetterHtml({ kop, judul, nomor, isi, kota, tanggal, ttd }) {
  const logo = kop.logo ? `<img src="${esc(kop.logo)}" style="width:74px;height:auto;display:block" />` : '';
  const kopLine = (text, size, spacing) =>
    `<div class="kop-line" style="font-weight:bold;letter-spacing:${spacing};font-size:${size}pt;line-height:1.15;margin:0;white-space:nowrap">${esc(text)}</div>`;
  const header = `
<div style="display:grid;grid-template-columns:80px 1fr 80px;align-items:center;padding-bottom:12px;margin-bottom:16px;border-bottom:3px solid #000">
<div style="text-align:center">${logo}</div>
<div style="text-align:center">
${kopLine(kop.baris1, 14, '1.5px')}
${kopLine(kop.baris2, 13, '1.5px')}
${kopLine(kop.baris3, 17, '2.5px')}
<div class="kop-line" style="font-size:9.5pt;line-height:1.3;margin:2px 0 0;white-space:nowrap">${esc(kop.alamat)}</div>
</div>
<div style="text-align:center"></div></div>`;

  const title = `
<div style="text-align:center;margin:10px 0 14px">
<div style="font-weight:bold;text-decoration:underline">${esc(judul.toUpperCase())}</div>
<div>Nomor: ${esc(nomor)}</div></div>`;

  const digital = ttd.tipe === 'Digital';
  const pakaiQr = ttd.tipe === 'QR';
  const ketTtd = pakaiQr
    ? 'Ditandatangani secara elektronik melalui SIMDESTA'
    : digital ? 'Ditandatangani secara elektronik' : '';
  // QR menempati posisi tanda tangan pejabat (menggantikan tanda tangan basah/digital).
  const qrTtd = pakaiQr
    ? (ttd.qr
      ? `<img src="${esc(ttd.qr)}" alt="QR verifikasi surat" style="width:84px;height:84px;display:block" />`
      : '<div style="width:84px;height:84px;border:1px dashed #bbb"></div>')
    : '';

  const signBody = `
<div>${esc(kota)}, ${esc(formatTanggalPanjang(tanggal))}</div>
${ttd.atasNama ? `<div>a.n KEPALA DESA ${esc(ttd.desa)}</div>` : ''}
<div>${esc((ttd.jabatan || '').toUpperCase())}</div>
<div style="height:${pakaiQr ? '94px' : '80px'};display:flex;align-items:center;justify-content:center">
${pakaiQr ? qrTtd : digital && ttd.url ? `<img src="${esc(ttd.url)}" style="max-height:75px" />` : ''}
</div>
<div style="font-weight:bold;text-decoration:underline">${esc((ttd.nama || '').toUpperCase())}</div>
${ttd.nip ? `<div>NIP. ${esc(ttd.nip)}</div>` : ''}
${ketTtd ? `<div style="font-size:8pt;color:#444;margin-top:8px">${esc(ketTtd)}</div>` : ''}
${pakaiQr ? `<div style="font-size:6.5pt;color:#444;line-height:1.35;margin-top:1px">Pindai QR untuk validasi surat resmi<br/>Kode: ${esc(ttd.kode || '')}</div>` : ''}`;

  const sign = `<div style="margin:28px 0 0 50%;text-align:center">${signBody}</div>`;

  const footer = `<div class="letter-footer" style="margin-top:auto;border-top:1px solid #bbb;padding-top:6px;text-align:center;font-size:8pt;color:#444">${esc(kop.footer)}</div>`;

  return `<div class="letter-page" style="font-family:Arial,Helvetica,sans-serif;font-size:12pt;color:#000;line-height:1.4">${header}${title}${isi}${sign}${footer}</div>`;
}

export function printLetter(html) {
  const w = window.open('', '_blank');
  if (!w) { alert('Pop-up diblokir. Izinkan pop-up untuk mencetak surat.'); return; }
  // Kertas F4 (215 x 330 mm): footer dikunci di dasar halaman pertama.
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Surat</title>
<style>
@page{size:215mm 330mm;margin:12mm}
html,body{margin:0;padding:0}
.letter-page{display:flex;flex-direction:column;min-height:306mm}
.letter-footer{margin-top:auto !important}
.kop-line{white-space:nowrap !important;overflow:hidden;text-overflow:clip}
</style></head><body>${html}</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 600);
}