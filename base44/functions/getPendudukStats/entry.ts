import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Grup bawaan per peran, dipakai bila akun belum ditetapkan ke grup tertentu.
const ROLE_GROUP: Record<string, string> = {
  admin: 'SU',
  user: 'WARGA',
};

function parsePermissions(raw: any) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = String(user.email || '').trim().toLowerCase();

    // Data akun (termasuk grup) dibaca dengan service role agar tidak terblokir aturan akses pengguna.
    const [record, akunRes] = await Promise.all([
      base44.asServiceRole.entities.User.get(user.id).catch((e: any) =>
        e.status === 404 ? null : Promise.reject(e)
      ),
      email
        ? base44.asServiceRole.entities.AkunAkses.filter({ email }, { limit: 1 })
        : Promise.resolve({ items: [] }),
    ]);

    const akun = akunRes?.items?.[0] || null;
    const statusAkun = akun?.status || 'Aktif';

    // Akses area admin hanya untuk akun yang didaftarkan admin desa dan berstatus Aktif.
    const terdaftar = Boolean(akun) && statusAkun === 'Aktif';
    const alasan = !akun ? 'tidak_terdaftar' : (statusAkun === 'Nonaktif' ? 'nonaktif' : '');

    const storedRole = akun?.role || record?.role || user.role || 'user';
    const code = akun?.grup_kode || record?.grup_pengguna || ROLE_GROUP[storedRole] || '';

    let group = null;
    if (code) {
      const { items } = await base44.asServiceRole.entities.UserGroup.filter({ kode: code }, { limit: 1 });
      group = items?.[0] || null;
    }

    // Hak akses seluruh modul dan menu hanya untuk grup Super Admin (is_admin).
    const isAdmin = Boolean(group?.is_admin);
    const role = isAdmin ? 'admin' : 'user';
    const permissions = isAdmin ? null : parsePermissions(group?.permissions);

    return Response.json({
      restricted: !terdaftar || !isAdmin,
      terdaftar,
      alasan,
      status_akun: statusAkun,
      permissions: terdaftar ? permissions : {},
      group: group ? { kode: group.kode, nama: group.nama, is_admin: Boolean(group.is_admin) } : null,
      user: {
        full_name: akun?.nama || record?.full_name || user.full_name || '',
        email: akun?.email || record?.email || user.email || '',
        role,
        username: akun?.username || '',
        jabatan: akun?.jabatan || record?.jabatan || '',
      },
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}