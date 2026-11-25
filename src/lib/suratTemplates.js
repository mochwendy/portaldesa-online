// Pustaka template surat desa (pengantar, keterangan, pernyataan) dengan pengisian otomatis dari data Penduduk.

export const KATEGORI = ['Surat Pengantar', 'Surat Keterangan', 'Surat Pernyataan'];

const P = (t) => `<p style="text-align:justify;margin:6px 0">${t}</p>`;
const row = (l, v) =>
  `<tr><td style="width:190px;vertical-align:top">${l}</td><td style="width:14px;vertical-align:top">:</td><td>${v}</td></tr>`;

const IDENT = `<table style="margin:6px 0 6px 20px;border-collapse:collapse">${[
  ['Nama', '{{NAMA}}'],
  ['NIK', '{{nik}}'],
  ['Jenis Kelamin', '{{jk}}'],
  ['Tempat, Tanggal Lahir', '{{ttl}}'],
  ['Warganegara / Agama', '{{wn}} / {{agama}}'],
  ['Pekerjaan', '{{pekerjaan}}'],
  ['Status Pernikahan', '{{status_kawin}}'],
  ['Alamat', '{{alamat}}<br>DESA {{DESA}}, KECAMATAN {{KECAMATAN}}<br>{{KABUPATEN}}'],
].map(([l, v]) => row(l, v)).join('')}</table>`;

const OPEN_KET = P('Yang bertanda tangan dibawah ini Kepala Desa {{desa}}, Kecamatan {{kecamatan}}, Kabupaten {{kabupaten}} menerangkan dengan sebenarnya, bahwa:');
const OPEN_PENG = P('Yang bertanda tangan dibawah ini Kepala Desa {{desa}}, Kecamatan {{kecamatan}}, Kabupaten {{kabupaten}} memberikan pengantar kepada:');
const CLOSE_KET = P('Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya, atas perhatian dan kerjasamanya kami ucapkan terima kasih.');
const CLOSE_PENG = P('Demikian surat pengantar ini dibuat untuk dipergunakan sebagaimana mestinya.');
const CLOSE_PERN = P('Demikian surat pernyataan ini saya buat dengan sebenar-benarnya dan penuh tanggung jawab tanpa paksaan dari pihak manapun.')
  + '<p style="margin:14px 0 0 55%">Yang membuat pernyataan,<br><br><br><br><b>{{NAMA}}</b></p>';

const ket = (nama, extras, isi) => ({ nama, kategori: 'Surat Keterangan', extras, body: OPEN_KET + IDENT + isi + CLOSE_KET });
const peng = (nama, isi, extras = []) => ({ nama, kategori: 'Surat Pengantar', extras, body: OPEN_PENG + IDENT + isi + CLOSE_PENG });
const pern = (nama, extras, isi) => ({ nama, kategori: 'Surat Pernyataan', extras, body: P('Yang bertanda tangan di bawah ini:') + IDENT + isi + CLOSE_PERN });

const PINDAH_EXTRAS = [
  { key: 'tujuan', label: 'Alamat / wilayah tujuan pindah' },
  { key: 'alasan_pindah', label: 'Alasan pindah' },
];
const pindah = (nama, wilayah) =>
  peng(nama, P(`Bermaksud pindah ${wilayah} ke alamat: <b>{{tujuan}}</b>, dengan alasan {{alasan_pindah}}.`), PINDAH_EXTRAS);

export const SURAT_TEMPLATES = [
  pindah('Surat Pengantar Pindah Dalam Satu Desa', 'dalam satu desa'),
  pindah('Surat Pengantar Pindah Antar Desa', 'antar desa'),
  pindah('Surat Pengantar Pindah Antar Kecamatan', 'antar kecamatan'),
  pindah('Surat Pengantar Pindah Antar Kabupaten/Kota', 'antar kabupaten/kota'),
  peng('Surat Pengantar Pembuatan Kartu Keluarga', P('Yang bersangkutan bermaksud mengajukan pembuatan / perubahan Kartu Keluarga (KK) ke Dinas Kependudukan dan Pencatatan Sipil. Keperluan: {{keperluan}}.')),
  peng('Surat Pengantar Pembuatan KTP', P('Yang bersangkutan bermaksud mengajukan pembuatan / perubahan Kartu Tanda Penduduk elektronik (KTP-el). Keperluan: {{keperluan}}.')),
  peng('Surat Pengantar Biodata Penduduk', P('Yang bersangkutan bermaksud mengurus pencatatan / pembaruan biodata penduduk. Keperluan: {{keperluan}}.')),
  peng('Surat Pengantar SKCK', P('Yang bersangkutan berkelakuan baik dan bermaksud mengurus Surat Keterangan Catatan Kepolisian (SKCK) di Kepolisian setempat untuk keperluan {{keperluan}}.')),
  ket('Surat Keterangan Domisili', [], P('Dengan ini menerangkan bahwa benar yang bersangkutan berdomisili sesuai dengan alamat sebagaimana tersebut di atas.') + P('Surat Keterangan ini dibuat untuk {{keperluan}}.')),
  ket('Surat Keterangan Usaha', [
    { key: 'nama_usaha', label: 'Nama usaha' },
    { key: 'jenis_usaha', label: 'Jenis usaha' },
    { key: 'alamat_usaha', label: 'Alamat usaha' },
    { key: 'lama_usaha', label: 'Lama usaha (mis. 3 tahun)' },
  ], P('Bahwa benar yang bersangkutan memiliki usaha <b>{{nama_usaha}}</b> bergerak di bidang {{jenis_usaha}}, beralamat di {{alamat_usaha}}, dan telah berjalan selama {{lama_usaha}}.') + P('Surat Keterangan ini dibuat untuk {{keperluan}}.')),
  ket('Surat Keterangan Tidak Mampu', [], P('Bahwa berdasarkan pengetahuan kami, yang bersangkutan benar termasuk keluarga kurang mampu secara ekonomi.') + P('Surat Keterangan ini dibuat untuk {{keperluan}}.')),
  ket('Surat Keterangan Penghasilan', [{ key: 'penghasilan', label: 'Penghasilan per bulan (Rp)' }],
    P('Bahwa yang bersangkutan memiliki penghasilan rata-rata sebesar <b>Rp {{penghasilan}}</b> per bulan.') + P('Surat Keterangan ini dibuat untuk {{keperluan}}.')),
  ket('Surat Keterangan Belum Menikah', [], P('Bahwa berdasarkan data yang ada pada kami, yang bersangkutan sampai saat ini belum pernah menikah.') + P('Surat Keterangan ini dibuat untuk {{keperluan}}.')),
  ket('Surat Keterangan Kelakuan Baik', [], P('Bahwa yang bersangkutan selama bertempat tinggal di wilayah kami berkelakuan baik dan tidak pernah tersangkut perkara pidana.') + P('Surat Keterangan ini dibuat untuk {{keperluan}}.')),
  ket('Surat Keterangan Lainnya', [], P('Surat Keterangan ini dibuat untuk {{keperluan}}.')),
  pern('Surat Pernyataan Tanggung Jawab Mutlak', [{ key: 'isi_pernyataan', label: 'Hal yang dinyatakan' }],
    P('Dengan ini menyatakan bahwa saya bertanggung jawab penuh atas hal berikut: {{isi_pernyataan}}.') + P('Pernyataan ini dibuat untuk {{keperluan}}.')),
  pern('Surat Pernyataan Umum', [{ key: 'isi_pernyataan', label: 'Isi pernyataan' }],
    P('Dengan ini menyatakan bahwa {{isi_pernyataan}}.') + P('Pernyataan ini dibuat untuk {{keperluan}}.')),
];

export const SURAT_NAMES = SURAT_TEMPLATES.map((t) => t.nama);

const ALIAS = {
  'Surat Keterangan Pengantar': 'Surat Keterangan Lainnya',
  'Surat Keterangan Catatan Kepolisian': 'Surat Pengantar SKCK',
};

export const findTemplate = (nama) =>
  SURAT_TEMPLATES.find((t) => t.nama === nama) ||
  SURAT_TEMPLATES.find((t) => t.nama === ALIAS[nama]) ||
  null;

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stripPrefix = (s, re) => (s || '').replace(re, '').trim();

export const formatTanggalPanjang = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

export function buildVars(p, profil, extras = {}, keperluan = '') {
  const desa = stripPrefix(profil?.nama_desa, /^desa\s+/i);
  const kec = stripPrefix(profil?.kecamatan, /^kecamatan\s+/i);
  const kab = stripPrefix(profil?.kabupaten, /^kabupaten\s+/i);
  const tglLahir = p?.tanggal_lahir ? p.tanggal_lahir.split('-').reverse().join('-') : '-';
  const vars = {
    NAMA: (p?.nama_lengkap || '').toUpperCase(),
    nik: p?.nik || '',
    jk: (p?.jenis_kelamin || '').toUpperCase(),
    ttl: `${(p?.tempat_lahir || '').toUpperCase()}, ${tglLahir}`,
    wn: 'WNI',
    agama: (p?.agama || '').toUpperCase(),
    pekerjaan: (p?.pekerjaan || '-').toUpperCase(),
    status_kawin: (p?.status_perkawinan || '-').toUpperCase(),
    alamat: `${(p?.alamat || '').toUpperCase()}${p?.rt ? ` RT.${p.rt}` : ''}${p?.rw ? ` RW.${p.rw}` : ''}`,
    desa, kecamatan: kec, kabupaten: kab,
    DESA: desa.toUpperCase(), KECAMATAN: kec.toUpperCase(), KABUPATEN: kab.toUpperCase(),
    keperluan: keperluan || '........',
  };
  Object.entries(extras).forEach(([k, v]) => { vars[k] = v; });
  return vars;
}

export function fillTemplate(body, vars) {
  return body.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ? esc(vars[k]) : '........'));
}