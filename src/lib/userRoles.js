// Tingkat kewenangan akun SIMDESTA.
// Administrator berada di atas seluruh grup; Pengguna mengikuti hak akses grupnya.
export const USER_ROLES = [
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'Pengguna / Staf' },
  ];
  
  export const ROLE_LABELS = {
    admin: 'Administrator',
    user: 'Pengguna / Staf',
    kepala_desa: 'Kepala Desa',
    sekretaris: 'Sekretaris Desa',
    operator: 'Staff / Operator',
  };
  
  export const ROLE_STYLES = {
    admin: 'bg-red-50 text-red-700 border-red-200',
    kepala_desa: 'bg-purple-50 text-purple-700 border-purple-200',
    sekretaris: 'bg-blue-50 text-blue-700 border-blue-200',
    operator: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    user: 'bg-slate-50 text-slate-600 border-slate-200',
  };