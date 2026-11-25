import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Tautan sementara untuk foto/dokumen yang memang dipublikasikan di portal.
// Hanya berkas yang tercatat pada konten publik (realisasi pembangunan & dokumen pembangunan)
// yang boleh ditandatangani, sehingga berkas privat lain tetap aman.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { file_uri } = await req.json().catch(() => ({}));

    if (!file_uri || typeof file_uri !== 'string') {
      return Response.json({ error: 'file_uri wajib diisi' }, { status: 400 });
    }

    const publicEntities = base44.asServiceRole.entities;
    const [foto, dokumen] = await Promise.all([
      publicEntities.RealisasiPembangunan.filter(
        { $or: [{ foto_0_uri: file_uri }, { foto_50_uri: file_uri }, { foto_100_uri: file_uri }] },
        { limit: 1 },
      ),
      publicEntities.DokumenPembangunan.filter({ file_uri }, { limit: 1 }),
    ]);

    const terdaftar = (foto.items || []).length > 0 || (dokumen.items || []).length > 0;
    if (!terdaftar) {
      return Response.json({ error: 'Berkas tidak tersedia untuk publik' }, { status: 404 });
    }

    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 3600,
    });

    return Response.json({ signed_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}