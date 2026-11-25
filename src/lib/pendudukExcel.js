import * as XLSX from 'xlsx';
import { base44 } from '@/api/base44Client';

const text = (v) => (v === null || v === undefined ? '' : String(v).replace(/\s+/g, ' ').trim());
const upper = (v) => text(v).toUpperCase();
const pad2 = (n) => String(n).padStart(2, '0');

const includesAny = (value, list) => list.some((k) => value.includes(k));

export const PENDIDIKAN_OPTIONS = [
  'Tidak/Belum Sekolah', 'Belum Tamat SD', 'SD', 'SMP', 'SMA/SMK', 'Diploma', 'S1', 'S2/S3', 'Lainnya',
];
export const AGAMA_OPTIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya', 'Tidak Diisi'];
export const PERKAWINAN_OPTIONS = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati', 'Tidak Diisi'];
export const KELUARGA_OPTIONS = ['Kepala Keluarga', 'Istri', 'Anak', 'Menantu', 'Cucu', 'Orang Tua', 'Mertua', 'Famili Lain', 'Lainnya'];
export const USIA_OPTIONS = ['0-5 Tahun', '6-14 Tahun', '15-24 Tahun', '25-44 Tahun', '45-64 Tahun', '65+ Tahun', 'Tidak Diketahui'];

function normalizeGender(value) {
  if (value.startsWith('LAKI') || value === 'L') return 'Laki-laki';
  if (value.startsWith('PEREMPUA')) return 'Perempuan';
  return 'Tidak Diisi';
}

function normalizeAgama(value) {
  const v = upper(value);
  if (!v) return 'Tidak Diisi';
  if (v.startsWith('ISLAM')) return 'Islam';
  if (v.startsWith('KRISTEN') || v.startsWith('PROTESTAN')) return 'Kristen';
  if (v.startsWith('KATOLIK')) return 'Katolik';
  if (v.startsWith('HINDU')) return 'Hindu';
  if (v.startsWith('BUDDHA') || v.startsWith('BUDHA')) return 'Buddha';
  if (v.startsWith('KONGHUCU')) return 'Konghucu';
  return 'Lainnya';
}

function normalizePendidikan(value) {
  const v = upper(value);
  if (!v) return 'Lainnya';
  if (includesAny(v, ['STRATA II', 'STRATA-II', 'STRATA III', 'S2', 'S3'])) return 'S2/S3';
  if (includesAny(v, ['DIPLOMA IV/STRATA I', 'DIPLOMA IB/STARTA I', 'STRATA I', 'SARJANA'])) return 'S1';
  if (includesAny(v, ['DIPLOMA', 'AKADEMI'])) return 'Diploma';
  if (includesAny(v, ['SLTA', 'SLTTA', 'SMA', 'SMK', 'SEKOLAH MENENGAH ATAS'])) return 'SMA/SMK';
  if (includesAny(v, ['SLTP', 'SLYP', 'SMP'])) return 'SMP';
  if (includesAny(v, ['TAMAT SD', 'TAMAT D', 'SEKOLAH DASAR'])) return 'SD';
  if (includesAny(v, ['BELUM TAMAT SD'])) return 'Belum Tamat SD';
  if (includesAny(v, ['TIDAK/BELUM SEKOLAH', 'TIDAK/BLM SEKOLAH'])) return 'Tidak/Belum Sekolah';
  return 'Lainnya';
}

function normalizePerkawinan(value) {
  const v = upper(value);
  if (!v) return 'Tidak Diisi';
  if (includesAny(v, ['CERAI MATI'])) return 'Cerai Mati';
  if (includesAny(v, ['CERAI'])) return 'Cerai Hidup';
  if (includesAny(v, ['BELUM KAWIN', 'BELUM KAWIN'])) return 'Belum Kawin';
  if (includesAny(v, ['KAWIN', 'KAWIIN', 'KAWKIN', 'KAIWN'])) return 'Kawin';
  if (v === 'B') return 'Belum Kawin';
  return 'Tidak Diisi';
}

function normalizeKeluarga(value) {
  const v = upper(value);
  if (!v) return 'Lainnya';
  if (v === 'KK' || v === 'K' || v.startsWith('KEPALA KELUARGA')) return 'Kepala Keluarga';
  if (v === 'I' || v.startsWith('ISTRI') || v === 'ISTR' || v === 'ISRTI') return 'Istri';
  if (v === 'A' || v.startsWith('ANAK')) return 'Anak';
  if (v.startsWith('CUCU')) return 'Cucu';
  if (v.startsWith('MENANTU')) return 'Menantu';
  if (v.startsWith('MERTUA')) return 'Mertua';
  if (v.startsWith('ORANG TUA')) return 'Orang Tua';
  if (v.startsWith('FAMILI')) return 'Famili Lain';
  return 'Lainnya';
}

// RW disimpan 3 digit (002, 010, ...). Nilai kolom yang tidak valid diabaikan.
function normalizeRw(value, fallback = '') {
  const digits = text(value).replace(/\D/g, '');
  if (digits.length >= 1 && digits.length <= 3) return digits.padStart(3, '0');
  const fb = text(fallback).replace(/\D/g, '');
  return fb ? fb.padStart(3, '0') : '';
}

function toDateString(tgl, bln, thn) {
  const d = parseInt(text(tgl).replace(/\D/g, ''), 10);
  const m = parseInt(text(bln).replace(/\D/g, ''), 10);
  const y = parseInt(text(thn).replace(/\D/g, ''), 10);
  if (!y || y < 1900 || y > 2100 || !m || m > 12 || !d || d > 31) return '';
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function hitungKelompokUsia(tanggalLahir) {
  if (!tanggalLahir) return 'Tidak Diketahui';
  const birth = new Date(tanggalLahir);
  if (Number.isNaN(birth.getTime())) return 'Tidak Diketahui';
  const now = new Date();
  let usia = now.getFullYear() - birth.getFullYear();
  const bulan = now.getMonth() - birth.getMonth();
  if (bulan < 0 || (bulan === 0 && now.getDate() < birth.getDate())) usia -= 1;
  if (usia < 0) return 'Tidak Diketahui';
  if (usia <= 5) return '0-5 Tahun';
  if (usia <= 14) return '6-14 Tahun';
  if (usia <= 24) return '15-24 Tahun';
  if (usia <= 44) return '25-44 Tahun';
  if (usia <= 64) return '45-64 Tahun';
  return '65+ Tahun';
}

// Kolom mengikuti format Data KK Desa Tagog Apu:
// [0] NO, [1] NAMA, [2] NO KK, [3] NIK, [4] JENIS KELAMIN, [5] TEMPAT LAHIR,
// [6-8] TGL/BLN/THN, [9] AGAMA, [10] PENDIDIKAN, [11] PEKERJAAN, [12] PERKAWINAN,
// [13] KELUARGA, [14] RUMAH, [15] DISABILITAS, [16] LISTRIK, [17] ALAMAT, [18] RT, [19] RW
export function normalizePendudukRow(row, fallbackRw = '') {
  if (!row) return null;
  const nama = text(row[1]);
  const nik = text(row[3]).replace(/\s/g, '');
  if (!nama || !nik) return null;
  const tanggalLahir = toDateString(row[6], row[7], row[8]);
  const rw = normalizeRw(row[19], fallbackRw);
  return {
    nik,
    no_kk: text(row[2]).replace(/\s/g, ''),
    nama_lengkap: nama,
    jenis_kelamin: normalizeGender(upper(row[4])),
    tempat_lahir: text(row[5]),
    tanggal_lahir: tanggalLahir,
    kelompok_usia: hitungKelompokUsia(tanggalLahir),
    agama: normalizeAgama(row[9]),
    pendidikan: normalizePendidikan(row[10]),
    pekerjaan: upper(row[11]),
    status_perkawinan: normalizePerkawinan(row[12]),
    status_keluarga: normalizeKeluarga(row[13]),
    status_rumah: text(row[14]),
    disabilitas: text(row[15]),
    listrik: text(row[16]),
    alamat: text(row[17]),
    rt: text(row[18]),
    rw,
    status_kependudukan: 'Aktif',
    sumber_data: 'Data KK Desa Tagog Apu',
  };
}

export async function parsePendudukFile(file) {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const rows = [];
  wb.SheetNames.forEach((name) => {
    const sheetRows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null });
    const rwMatch = name.match(/RW\s*(\d{1,3})/i);
    const fallbackRw = rwMatch ? rwMatch[1].padStart(3, '0') : '';
    for (let i = 3; i < sheetRows.length; i += 1) {
      const normalized = normalizePendudukRow(sheetRows[i], fallbackRw);
      if (normalized) rows.push(normalized);
    }
  });

  const seen = new Set();
  return rows.filter((row) => {
    if (seen.has(row.nik)) return false;
    seen.add(row.nik);
    return true;
  });
}

// Mengambil seluruh NIK yang sudah tersimpan (per halaman) agar impor tidak membuat duplikat.
export async function fetchExistingNik() {
  const niks = new Set();
  let cursor;
  for (let page = 0; page < 60; page += 1) {
    const result = await base44.entities.Penduduk.filter(
      {},
      { sort: 'created_date', limit: 500, ...(cursor ? { cursor } : {}) },
    );
    (result.items || []).forEach((item) => { if (item.nik) niks.add(item.nik); });
    if (!result.has_more || !result.next_cursor) break;
    cursor = result.next_cursor;
  }
  return niks;
}

const EXPORT_HEADER_1 = [
  'NO', 'NAMA', 'NO KK', 'NIK', 'JENIS KELAMIN', 'TEMPAT LAHIR', 'LAHIR', null, null,
  'AGAMA', 'STATUS', null, null, null, null, 'DISABILITAS', 'LISTRIK', 'ALAMAT', null, null,
];
const EXPORT_HEADER_2 = [
  null, null, null, null, null, null, 'TGL', 'BLN', 'THN', null,
  'PENDIDIKAN', 'PEKERJAAN', 'PERKAWINAN', 'KELUARGA', 'RUMAH', null, null, 'KAMPUNG', 'RT', 'RW',
];

export function buildPendudukWorkbook(records) {
  const groups = new Map();
  const sorted = records.slice().sort((a, b) => (a.nama_lengkap || '').localeCompare(b.nama_lengkap || ''));
  sorted.forEach((r) => {
    const key = r.rw ? `RW ${r.rw}` : 'TANPA RW';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  });
  if (groups.size === 0) groups.set('DATA PENDUDUK', []);

  const wb = XLSX.utils.book_new();
  [...groups.keys()].sort().forEach((key) => {
    const list = groups.get(key);
    const aoa = [EXPORT_HEADER_1, EXPORT_HEADER_2, Array.from({ length: 20 }, (_, i) => i + 1)];
    list.forEach((r, index) => {
      const [thn, bln, tgl] = r.tanggal_lahir ? r.tanggal_lahir.split('-') : ['', '', ''];
      aoa.push([
        index + 1, r.nama_lengkap || '', r.no_kk || '', r.nik || '', (r.jenis_kelamin || '').toUpperCase(),
        r.tempat_lahir || '', tgl || '', bln || '', thn || '', (r.agama || '').toUpperCase(),
        r.pendidikan || '', r.pekerjaan || '', (r.status_perkawinan || '').toUpperCase(),
        (r.status_keluarga || '').toUpperCase(), r.status_rumah || '', r.disabilitas || '',
        r.listrik || '', r.alamat || '', r.rt || '', r.rw || '',
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [
      { wch: 5 }, { wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 16 },
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 10 }, { wch: 24 }, { wch: 26 },
      { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 24 },
      { wch: 6 }, { wch: 6 },
    ];
    const sheetName = key.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'DATA';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  return wb;
}

export function downloadPendudukExcel(records) {
  const wb = buildPendudukWorkbook(records);
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `DATA_PENDUDUK_DESA_TAGOGAPU_${stamp}.xlsx`);
}