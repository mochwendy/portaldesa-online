import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Ringkasan notifikasi: kiriman warga melalui saluran portal
// (permohonan surat, aspirasi, dan pendaftaran UMKM mandiri).
const safe = async (fn, fallback) => {
  try {
    return await fn();
  } catch (error) {
    return fallback;
  }
};

const pick = (record, fields) =>
  fields.reduce((acc, field) => {
    acc[field] = record[field] ?? null;
    return acc;
  }, {});

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const EMPTY = { items: [] };
    const suratQuery = { channel: 'Portal', status: { $in: ['Diajukan', 'Diproses'] } };
    const aspirasiQuery = { status: { $in: ['Baru', 'Diproses'] } };
    const umkmQuery = { created_by_id: 'anonymous' };

    const [suratPage, suratCount, aspirasiPage, aspirasiCount, umkmPage, umkmCount] = await Promise.all([
      safe(() => base44.entities.SuratKeterangan.filter(suratQuery, { sort: '-created_date', limit: 5 }), EMPTY),
      safe(() => base44.entities.SuratKeterangan.count(suratQuery), 0),
      safe(() => base44.entities.Aspirasi.filter(aspirasiQuery, { sort: '-created_date', limit: 5 }), EMPTY),
      safe(() => base44.entities.Aspirasi.count(aspirasiQuery), 0),
      safe(() => base44.entities.UMKM.filter(umkmQuery, { sort: '-created_date', limit: 5 }), EMPTY),
      safe(() => base44.entities.UMKM.count(umkmQuery), 0),
    ]);

    return Response.json({
      surat: {
        count: suratCount,
        items: (suratPage.items || []).map((r) =>
          pick(r, ['id', 'nomor_surat', 'nama_pemohon', 'jenis_surat', 'status', 'created_date'])
        ),
      },
      aspirasi: {
        count: aspirasiCount,
        items: (aspirasiPage.items || []).map((r) =>
          pick(r, ['id', 'nomor_tiket', 'nama', 'judul', 'kategori', 'status', 'created_date'])
        ),
      },
      umkm: {
        count: umkmCount,
        items: (umkmPage.items || []).map((r) =>
          pick(r, ['id', 'nama_usaha', 'nama_pemilik', 'kategori', 'created_date'])
        ),
      },
      pending: suratCount + aspirasiCount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}