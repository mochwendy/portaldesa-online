import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Endpoint publik: hanya mengembalikan ANGKA AGREGAT layanan surat (tanpa data pribadi pemohon),
// sehingga portal publik dapat menampilkan ringkasan surat yang diproses sistem tanpa login.
const safe = async (fn, fallback) => {
  try {
    return await fn();
  } catch (error) {
    return fallback;
  }
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const S = base44.asServiceRole.entities.SuratKeterangan;

    const [total, statusRows] = await Promise.all([
      safe(() => S.count({}), 0),
      safe(() => S.aggregate({ query: {}, groupBy: 'status' }), { rows: [] }),
    ]);

    const status = statusRows.rows || [];
    const countOf = (...names) =>
      status.filter((r) => names.includes(r.status)).reduce((sum, r) => sum + (r.count || 0), 0);

    return Response.json({
      total,
      status,
      diajukan: countOf('Diajukan'),
      diproses: countOf('Diproses', 'Disetujui'),
      selesai: countOf('Selesai'),
      ditolak: countOf('Ditolak'),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}