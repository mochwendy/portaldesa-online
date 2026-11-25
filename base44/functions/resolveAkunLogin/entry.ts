import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Menerjemahkan username (atau email) menjadi email akun yang terdaftar oleh admin desa.
// Hanya akun berstatus "Aktif" yang dikenali; email akun tidak pernah dikembalikan untuk
// identitas yang tidak terdaftar.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const identitas = String(body?.identitas || '').trim().toLowerCase();

    if (!identitas) {
      return Response.json({ error: 'Email atau username wajib diisi' }, { status: 400 });
    }

    const field = identitas.includes('@') ? 'email' : 'username';
    const { items } = await base44.asServiceRole.entities.AkunAkses.filter(
      { [field]: identitas, status: 'Aktif' },
      { limit: 1 },
    );

    const akun = items?.[0];
    if (!akun) {
      return Response.json(
        { error: 'Username tidak terdaftar atau akun tidak aktif. Hubungi admin desa.' },
        { status: 404 },
      );
    }

    return Response.json({ email: akun.email, username: akun.username });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}