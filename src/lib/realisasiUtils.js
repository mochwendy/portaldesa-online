import { supabase } from './supabaseClient';

/**
 * Resolves a realisasi photo URI to a valid public URL.
 * Supports:
 * - Full URLs (http/https) - returns as-is
 * - Data URIs (data:image/...) - returns as-is
 * - Supabase storage paths (with or without 'realisasi/' prefix) - converts to public URL
 *
 * @param {string|null|undefined} uri - The URI/path to resolve
 * @returns {string|null} - Public URL or null if invalid
 */
export function resolveRealisasiPhotoUrl(uri) {
  if (!uri) return null;

  // Already a full URL or data URI - return as-is
  if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:')) {
    return uri;
  }

  // Clean Supabase storage path - remove 'realisasi/' prefix if present
  let cleanPath = uri;
  if (cleanPath.startsWith('realisasi/')) {
    cleanPath = cleanPath.slice('realisasi/'.length);
  }

  // Validate path is not empty
  if (!cleanPath || cleanPath === '') return null;

  try {
    const { data } = supabase.storage.from('realisasi').getPublicUrl(cleanPath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error resolving realisasi photo URL:', error);
    return null;
  }
}