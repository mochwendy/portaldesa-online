import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, Save, CheckCircle } from 'lucide-react';
import SuratPemohonTab from './SuratPemohonTab';
import SuratPenandatanganTab from './SuratPenandatanganTab';
import SuratKopTab from './SuratKopTab';
import SuratEditor from './SuratEditor';
import { findTemplate, buildVars, fillTemplate, SURAT_NAMES } from '@/lib/suratTemplates';
import { buildLetterHtml, printLetter } from '@/lib/suratDocument';
import { buatKodeVerifikasi, buatQrSurat } from '@/lib/suratVerifikasi';
import { kirimNotifikasiSelesai } from '@/lib/suratWaSelesai';
import { loadKop, saveKop } from '@/lib/suratKop';

const today = () => new Date().toISOString().split('T')[0];
const TABS = ['Pemohon & Jenis', 'Penandatangan', 'Kop & Footer', 'Editor Surat', 'Pratinjau'];

const emptyState = (nomor) => ({
  nik: '', penduduk: null, nikError: '', validating: false, jenis: SURAT_NAMES[8], extras: {},
  keperluan: '', nomor, tanggalSurat: today(), telp: '', pejabatId: '', atasNama: false, tipeTtd: 'Manual',
});

export default function SuratProsesDialog({ open, onOpenChange, record, nomorBaru, onSaved }) {
  const [s, setS] = useState(emptyState(nomorBaru));
  const [tab, setTab] = useState(0);
  const [isi, setIsi] = useState('');
  const [dirty, setDirty] = useState(false);
  const [pejabat, setPejabat] = useState([]);
  const [profil, setProfil] = useState(null);
  const [kop, setKopState] = useState({ baris1: '', baris2: '', baris3: '', alamat: '', logo: '', footer: '' });
  const [ttdUrl, setTtdUrl] = useState('');
  const [kode, setKode] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (patch) => setS((prev) => ({ ...prev, ...patch }));
  const setKop = (k) => { setKopState(k); saveKop(k); };
  const template = findTemplate(s.jenis);
  const selected = pejabat.find((o) => o.id === s.pejabatId);

  const validate = async (nik = s.nik) => {
    set({ validating: true, nikError: '' });
    const found = (await base44.entities.Penduduk.filter({ nik }))[0];
    if (!found) set({ penduduk: null, validating: false, nikError: 'NIK belum tercatat di modul Data Penduduk. Tambahkan dahulu data penduduk tersebut.' });
    else set({ penduduk: found, validating: false });
  };

  useEffect(() => {
    if (!open) return;
    setTab(0); setErr(''); setDirty(!!record?.isi_surat); setIsi(record?.isi_surat || '');
    setKode(record?.kode_verifikasi || buatKodeVerifikasi());
    const base = emptyState(record?.nomor_surat || nomorBaru);
    if (record) {
      Object.assign(base, {
        nik: record.nik_pemohon, jenis: findTemplate(record.jenis_surat)?.nama || base.jenis,
        keperluan: record.keperluan || '', telp: record.no_telepon || '', pejabatId: record.pejabat_id || '',
        atasNama: !!record.atas_nama, tipeTtd: record.tipe_ttd || 'Manual',
        tanggalSurat: record.tanggal_surat || today(),
        extras: record.extras_json ? JSON.parse(record.extras_json) : {},
      });
    }
    setS(base);
    (async () => {
      const [pj, pf] = await Promise.all([
        base44.entities.PerangkatDesa.list('urutan', 100),
        base44.entities.ProfilDesa.list('-created_date', 1),
      ]);
      setPejabat(pj); setProfil(pf[0] || null);
      setKopState(loadKop(pf[0] || null));
      if (record?.nik_pemohon) validate(record.nik_pemohon);
    })();
  }, [open, record]);

  useEffect(() => {
    setTtdUrl('');
    if (!selected?.ttd_file_uri) return;
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: selected.ttd_file_uri, expires_in: 3600 })
      .then((r) => setTtdUrl(r.signed_url));
  }, [selected?.id, selected?.ttd_file_uri]);

  useEffect(() => {
    setQrUrl('');
    if (s.tipeTtd !== 'QR' || !kode) return;
    buatQrSurat(kode).then(setQrUrl).catch(() => setQrUrl(''));
  }, [s.tipeTtd, kode]);

  useEffect(() => {
    if (dirty || !s.penduduk || !template) return;
    setIsi(fillTemplate(template.body, buildVars(s.penduduk, profil, s.extras, s.keperluan)));
  }, [s.penduduk, s.jenis, s.extras, s.keperluan, profil, dirty]);

  const uploadTtd = async (file) => {
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.PerangkatDesa.update(selected.id, { ttd_file_uri: file_uri });
      setPejabat((prev) => prev.map((o) => (o.id === selected.id ? { ...o, ttd_file_uri: file_uri } : o)));
    } finally { setUploading(false); }
  };

  const html = useMemo(() => buildLetterHtml({
    kop, judul: s.jenis, nomor: s.nomor, isi, tanggal: s.tanggalSurat,
    kota: (profil?.nama_desa || '').replace(/^desa\s+/i, '').toUpperCase(),
    ttd: {
      tipe: s.tipeTtd, atasNama: s.atasNama, url: ttdUrl, qr: qrUrl, kode, nama: selected?.nama, nip: selected?.nip,
      jabatan: selected ? (selected.jabatan === 'Kepala Desa' ? 'KEPALA DESA' : `${selected.jabatan} DESA`) : '',
      desa: (profil?.nama_desa || '').replace(/^desa\s+/i, '').toUpperCase(),
    },
  }), [kop, s, isi, ttdUrl, qrUrl, kode, selected, profil]);

  const save = async (status) => {
    setErr('');
    if (!s.penduduk) { setErr('Validasi NIK terlebih dahulu. NIK harus terdaftar di Data Penduduk.'); setTab(0); return; }
    if (!selected) { setErr('Pilih pejabat penandatangan.'); setTab(1); return; }
    if (s.tipeTtd === 'Digital' && !ttdUrl) { setErr('Tanda tangan digital pejabat belum diunggah.'); setTab(1); return; }
    setSaving(true);
    const data = {
      nomor_surat: s.nomor, nik_pemohon: s.penduduk.nik, nama_pemohon: s.penduduk.nama_lengkap,
      no_telepon: s.telp, jenis_surat: s.jenis, keperluan: s.keperluan,
      tanggal_pengajuan: record?.tanggal_pengajuan || today(), tanggal_surat: s.tanggalSurat,
      isi_surat: isi, extras_json: JSON.stringify(s.extras), pejabat_id: selected.id,
      pejabat_nama: selected.nama, pejabat_jabatan: selected.jabatan, atas_nama: s.atasNama,
      tipe_ttd: s.tipeTtd, status, ...(status === 'Selesai' ? { tanggal_selesai: today() } : {}),
      ...(s.tipeTtd === 'QR'
        ? { kode_verifikasi: kode, waktu_ttd: record?.waktu_ttd || new Date().toISOString() }
        : { kode_verifikasi: '', waktu_ttd: null }),
    };
    try {
      const saved = record
        ? (await base44.entities.SuratKeterangan.update(record.id, data), { ...data, id: record.id })
        : await base44.entities.SuratKeterangan.create({ ...data, channel: 'Loket Desa' });
      if (status === 'Selesai' && s.telp) await kirimNotifikasiSelesai(saved);
      onSaved(); onOpenChange(false);
    } catch (e) { setErr(e?.message || 'Gagal menyimpan surat'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{record ? 'Proses Permohonan Surat' : 'Buat Surat Baru (Loket Desa)'}</DialogTitle></DialogHeader>
        <div className="flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 ${tab === i ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground'}`}>
              {i + 1}. {t}
            </button>
          ))}
        </div>
        <div className="min-h-[320px]">
          {tab === 0 && <SuratPemohonTab s={s} set={set} onValidate={() => validate()} template={template} />}
          {tab === 1 && <SuratPenandatanganTab s={s} set={set} pejabat={pejabat} selected={selected} ttdUrl={ttdUrl} onUpload={uploadTtd} uploading={uploading} kode={kode} />}
          {tab === 2 && <SuratKopTab kop={kop} setKop={setKop} />}
          {tab === 3 && (s.penduduk
            ? <SuratEditor value={isi} onChange={(v) => { setIsi(v); setDirty(true); }} onReset={() => setDirty(false)} />
            : <p className="text-sm text-muted-foreground py-10 text-center">Validasi NIK pemohon terlebih dahulu agar isi surat terisi otomatis.</p>)}
          {tab === 4 && (
            <div className="bg-slate-100 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
              <div className="bg-white mx-auto max-w-[680px] p-8 shadow" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          )}
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => printLetter(html)} disabled={!s.penduduk}><Printer className="w-4 h-4" /> Cetak</Button>
          <Button variant="secondary" onClick={() => save('Diproses')} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Draft
          </Button>
          <Button onClick={() => save('Selesai')} disabled={saving}><CheckCircle className="w-4 h-4" /> Simpan & Selesai</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}