import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Endpoint publik: menandatangani tautan unduh PDF surat berdasarkan kode verifikasi QR.
// Tautan ini tetap (permanen) di pesan WhatsApp; berkasnya sendiri tetap privat
// dan hanya dapat diunduh melalui tautan sementara yang dibuat di sini.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const kode = String(body?.kode || '').trim().toUpperCase();

    if (!kode) {
      return Response.json({ error: 'Kode verifikasi wajib diisi' }, { status: 400 });
    }

    const { items } = await base44.asServiceRole.entities.SuratKeterangan.filter(
      { kode_verifikasi: kode },
      { limit: 1 },
    );
    const surat = (items || [])[0];

    if (!surat || surat.tipe_ttd !== 'QR' || !surat.pdf_file_uri) {
      return Response.json({ error: 'Berkas PDF surat belum tersedia' }, { status: 404 });
    }

    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: surat.pdf_file_uri,
      expires_in: 3600,
    });

    return Response.json({
      signed_url,
      nomor_surat: surat.nomor_surat || '',
      jenis_surat: surat.jenis_surat || '',
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}