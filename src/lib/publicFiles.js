import { base44 } from '@/api/base44Client';

// Tautan berkas publik (foto realisasi, dokumen pembangunan) yang bisa dibuka tanpa login.
export async function fetchPublicFileUrl(fileUri) {
  if (!fileUri) return '';
  const response = await base44.functions.invoke('getPublicFileUrl', { file_uri: fileUri });
  return response?.data?.signed_url || '';
}