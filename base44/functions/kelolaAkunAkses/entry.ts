import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Pengelolaan akun pengguna (AkunAkses) dijalankan dengan service role agar anggota grup
// yang berhak mengelola akun (mis. Admin Desa) tetap dapat menambah/mengubah akun.
// Hak akses diverifikasi di sini memakai aturan yang sama dengan menu aplikasi.

const USERNAME_PATTERN = /^[a-z0-9._-]{3,}$/;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

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

async function listUsers(base44: any) {
  const res = await base44.asServiceRole.entities.User.list().catch(() => []);
  return Array.isArray(res) ? res : (res?.items || []);
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = String(user.email || '').trim().toLowerCase();
    const akunRes = email
      ? await base44.asServiceRole.entities.AkunAkses.filter({ email }, { limit: 1 })
      : { items: [] };
    const akun = akunRes?.items?.[0] || null;
    const record = await base44.asServiceRole.entities.User
      .get(user.id)
      .catch((e: any) => (e.status === 404 ? null : Promise.reject(e)));

    const role = akun?.role || record?.role || user.role || 'user';
    const kode = akun?.grup_kode || record?.grup_pengguna || '';
    let group = null;
    if (kode) {
      const g = await base44.asServiceRole.entities.UserGroup.filter({ kode }, { limit: 1 });
      group = g?.items?.[0] || null;
    }

    const isAdmin = Boolean(group?.is_admin);
    const perms = group ? parsePermissions(group.permissions) : {};
    const can = (action: string) => isAdmin || Boolean(perms?.pengguna_akun?.[action]);

    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'list';

    // Akun bergrup Super Admin hanya boleh dilihat & dikelola oleh Super Admin.
    const groupsRes = await base44.asServiceRole.entities.UserGroup.list({ limit: 200 }).catch(() => ({ items: [] }));
    const allGroups: any[] = Array.isArray(groupsRes) ? groupsRes : (groupsRes?.items || []);
    const adminCodes = allGroups.filter((g: any) => g.is_admin).map((g: any) => String(g.kode));
    const isSuperAdmin = Boolean(group?.is_admin);
    const isProtected = (a: any) => Boolean(a) && adminCodes.includes(String(a?.grup_kode || ''));

    if (action === 'list') {
      if (!can('view')) {
        return Response.json({ error: 'Anda tidak memiliki hak akses pengaturan akun.' }, { status: 403 });
      }
      const [{ items }, users] = await Promise.all([
        base44.asServiceRole.entities.AkunAkses.list({ sort: 'nama', limit: 500 }),
        listUsers(base44),
      ]);
      const byEmail: Record<string, any> = {};
      users.forEach((u: any) => {
        byEmail[String(u.email || '').toLowerCase()] = { id: u.id, email: u.email };
      });
      const visible = (items || []).filter((a: any) => isSuperAdmin || !isProtected(a));
      return Response.json({
        is_super_admin: isSuperAdmin,
        items: visible.map((a: any) => ({
          ...a,
          akun_login: byEmail[String(a.email || '').toLowerCase()] || null,
        })),
      });
    }

    if (action === 'save') {
      const id = body?.id ? String(body.id) : '';
      const isCreate = !id;

      const target = isCreate
        ? null
        : await base44.asServiceRole.entities.AkunAkses
          .get(id)
          .catch((e: any) => (e.status === 404 ? null : Promise.reject(e)));
      if (!isCreate && !target) {
        return Response.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
      }
      if (target && isProtected(target) && !isSuperAdmin) {
        return Response.json({
          error: 'Akun Super Admin hanya dapat dikelola oleh Super Admin.',
        }, { status: 403 });
      }

      if (isCreate && !can('create')) {
        return Response.json({ error: 'Anda tidak memiliki hak menambah akun pengguna.' }, { status: 403 });
      }
      if (!isCreate && !can('view')) {
        return Response.json({ error: 'Anda tidak memiliki hak mengubah akun pengguna.' }, { status: 403 });
      }

      const nama = String(body.nama || '').trim();
      const mail = String(body.email || '').trim().toLowerCase();
      const username = String(body.username || '').trim().toLowerCase();
      const grupKode = String(body.grup_kode || '').trim();

      if (!nama) return Response.json({ error: 'Nama lengkap wajib diisi.' }, { status: 400 });
      if (!EMAIL_PATTERN.test(mail)) {
        return Response.json({ error: 'Email tidak valid. Gunakan email aktif pengguna.' }, { status: 400 });
      }
      if (!USERNAME_PATTERN.test(username)) {
        return Response.json({
          error: 'Username minimal 3 karakter, tanpa spasi (huruf, angka, titik, garis bawah, strip).',
        }, { status: 400 });
      }
      if (!grupKode) {
        return Response.json({
          error: 'Pilih grup pengguna agar hak akses modul dan menunya mengikuti pengaturan grup.',
        }, { status: 400 });
      }

      // Kewenangan akun diturunkan dari grup: hanya grup Super Admin yang berhak penuh.
      const targetGroupRes = await base44.asServiceRole.entities.UserGroup
        .filter({ kode: grupKode }, { limit: 1 });
      const targetGroup = targetGroupRes?.items?.[0] || null;
      if (!targetGroup) {
        return Response.json({ error: 'Grup pengguna tidak ditemukan.' }, { status: 400 });
      }
      const nextRole = targetGroup.is_admin ? 'admin' : 'user';
      if (adminCodes.includes(grupKode) && !isSuperAdmin) {
        return Response.json({
          error: 'Grup Super Admin hanya dapat diberikan oleh Super Admin.',
        }, { status: 403 });
      }

      const [dupeUsername, dupeEmail] = await Promise.all([
        base44.asServiceRole.entities.AkunAkses.filter({ username }, { limit: 5 }),
        base44.asServiceRole.entities.AkunAkses.filter({ email: mail }, { limit: 5 }),
      ]);
      if ((dupeUsername.items || []).some((a: any) => a.id !== id)) {
        return Response.json({ error: 'Username sudah dipakai akun lain.' }, { status: 400 });
      }
      if ((dupeEmail.items || []).some((a: any) => a.id !== id)) {
        return Response.json({ error: 'Email ini sudah terdaftar sebagai akun pengguna.' }, { status: 400 });
      }

      const payload = {
        nama,
        email: mail,
        username,
        role: nextRole,
        grup_kode: grupKode,
        jabatan: String(body.jabatan || '').trim(),
        status: body.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
      };

      const saved = isCreate
        ? await base44.asServiceRole.entities.AkunAkses.create(payload)
        : await base44.asServiceRole.entities.AkunAkses.update(id, payload);

      const linked = (await listUsers(base44)).find(
        (u: any) => String(u.email || '').toLowerCase() === mail,
      );
      if (linked) {
        await base44.asServiceRole.entities.User.update(linked.id, {
          full_name: payload.nama,
          role: payload.role,
          grup_pengguna: payload.grup_kode,
          jabatan: payload.jabatan,
          status_akun: payload.status,
        }).catch(() => {});
      }

      return Response.json({
        item: {
          ...saved,
          akun_login: linked ? { id: linked.id, email: linked.email } : null,
        },
      });
    }

    if (action === 'set-group') {
      if (!can('view')) {
        return Response.json({ error: 'Anda tidak memiliki hak mengubah grup pengguna.' }, { status: 403 });
      }
      const id = String(body?.id || '');
      if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
      const grupKode = String(body?.grup_kode || '').trim();

      const target = await base44.asServiceRole.entities.AkunAkses
        .get(id)
        .catch((e: any) => (e.status === 404 ? null : Promise.reject(e)));
      if (!target) return Response.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
      if (!isSuperAdmin && (isProtected(target) || adminCodes.includes(grupKode))) {
        return Response.json({
          error: 'Akun Super Admin hanya dapat dikelola oleh Super Admin.',
        }, { status: 403 });
      }

      // Kewenangan mengikuti grup tujuan: hanya grup Super Admin yang berhak penuh.
      const targetGroupRes = grupKode
        ? await base44.asServiceRole.entities.UserGroup.filter({ kode: grupKode }, { limit: 1 })
        : { items: [] };
      const nextRole = targetGroupRes?.items?.[0]?.is_admin ? 'admin' : 'user';

      await base44.asServiceRole.entities.AkunAkses.update(id, { grup_kode: grupKode, role: nextRole });

      const linked = (await listUsers(base44)).find(
        (u: any) => String(u.email || '').toLowerCase() === String(target.email || '').toLowerCase(),
      );
      if (linked) {
        await base44.asServiceRole.entities.User.update(linked.id, { grup_pengguna: grupKode }).catch(() => {});
      }
      return Response.json({ ok: true, grup_kode: grupKode, role: nextRole });
    }

    if (action === 'delete') {
      if (!can('delete')) {
        return Response.json({ error: 'Anda tidak memiliki hak menghapus akun pengguna.' }, { status: 403 });
      }
      const id = String(body?.id || '');
      if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
      if (akun && akun.id === id) {
        return Response.json({ error: 'Tidak dapat menghapus akun sendiri.' }, { status: 400 });
      }

      const target = await base44.asServiceRole.entities.AkunAkses
        .get(id)
        .catch((e: any) => (e.status === 404 ? null : Promise.reject(e)));
      if (!target) return Response.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
      if (isProtected(target) && !isSuperAdmin) {
        return Response.json({
          error: 'Akun Super Admin hanya dapat dikelola oleh Super Admin.',
        }, { status: 403 });
      }

      await base44.asServiceRole.entities.AkunAkses.delete(id);

      const linked = (await listUsers(base44)).find(
        (u: any) => String(u.email || '').toLowerCase() === String(target.email || '').toLowerCase(),
      );
      if (linked && linked.id !== user.id) {
        await base44.asServiceRole.entities.User.delete(linked.id).catch(() => {});
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}