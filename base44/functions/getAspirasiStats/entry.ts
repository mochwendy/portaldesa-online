import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Endpoint publik: hanya mengembalikan ANGKA AGREGAT aspirasi warga (tanpa data pribadi),
// sehingga portal publik dapat menampilkan ringkasan aspirasi tanpa login.
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
    const A = base44.asServiceRole.entities.Aspirasi;

    const [total, statusRows, kategoriRows] = await Promise.all([
      safe(() => A.count({}), 0),
      safe(() => A.aggregate({ query: {}, groupBy: 'status' }), { rows: [] }),
      safe(() => A.aggregate({ query: {}, groupBy: 'kategori' }), { rows: [] }),
    ]);

    const status = statusRows.rows || [];
    const countOf = (...names) =>
      status.filter((r) => names.includes(r.status)).reduce((sum, r) => sum + (r.count || 0), 0);

    return Response.json({
      total,
      status,
      kategori: kategoriRows.rows || [],
      baru: countOf('Baru'),
      diproses: countOf('Diproses', 'Dijawab'),
      selesai: countOf('Selesai'),
      ditolak: countOf('Ditolak'),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}