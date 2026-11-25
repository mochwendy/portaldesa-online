import React from 'react';
import { ShieldCheck, ShieldX, Building2 } from 'lucide-react';
import { formatTanggalPanjang } from '@/lib/suratTemplates';

const Baris = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 py-2 border-b border-border last:border-0">
    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground sm:text-right">{value || '-'}</span>
  </div>
);

const waktuLengkap = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  return `${formatTanggalPanjang(iso.slice(0, 10))}, ${jam} WIB`;
};

export default function VerifikasiSuratHasil({ hasil }) {
  const { valid, surat, desa } = hasil;
  const institusi = [desa?.nama_desa, desa?.kecamatan, desa?.kabupaten, desa?.provinsi].filter(Boolean).join(', ');

  if (!valid) {
    return (
      <div className="bg-card border-2 border-destructive/40 rounded-2xl p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-7 h-7 text-destructive" />
        </div>
        <h2 className="font-heading font-bold text-lg text-foreground">Kode Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Kode ini tidak terdaftar sebagai surat yang ditandatangani secara elektronik melalui SIMDESTA.
          Periksa kembali tulisan kode pada QR di surat, atau hubungi kantor desa.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-emerald-300 rounded-2xl overflow-hidden">
      <div className="bg-emerald-50 px-5 py-4 flex items-start gap-3">
        <ShieldCheck className="w-8 h-8 text-emerald-600 flex-shrink-0" />
        <div>
          <h2 className="font-heading font-bold text-emerald-800">Surat Asli & Terverifikasi</h2>
          <p className="text-sm text-emerald-700 mt-0.5">
            Surat ini resmi diterbitkan pemerintah desa dan ditandatangani secara elektronik melalui SIMDESTA.
          </p>
        </div>
      </div>

      <div className="px-5 py-4">
        <Baris label="Nomor Surat" value={surat.nomor_surat} />
        <Baris label="Jenis Surat" value={surat.jenis_surat} />
        <Baris label="Keperluan" value={surat.keperluan} />
        <Baris label="Tanggal Surat" value={surat.tanggal_surat ? formatTanggalPanjang(surat.tanggal_surat) : '-'} />
        <Baris label="Pemohon" value={surat.nama_pemohon} />
        <Baris
          label="Ditandatangani Oleh"
          value={[surat.atas_nama ? 'a.n' : '', surat.pejabat_jabatan, surat.pejabat_nama].filter(Boolean).join(' — ')}
        />
        <Baris label="Waktu Tanda Tangan" value={waktuLengkap(surat.waktu_ttd)} />
        <Baris label="Status Surat" value={surat.status} />
        <Baris label="Kode Verifikasi" value={hasil.kode} />
      </div>

      <div className="bg-muted/50 px-5 py-3 flex items-start gap-2">
        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">{institusi || 'Pemerintah Desa'} — diterbitkan melalui SIMDESTA.</p>
      </div>
    </div>
  );
}