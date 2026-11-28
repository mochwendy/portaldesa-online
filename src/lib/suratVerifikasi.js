// Kode verifikasi & QR keaslian surat yang diterbitkan melalui SIMDESTA.
import QRCode from 'qrcode';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function buatKodeVerifikasi() {
  let acak = '';
  for (let i = 0; i < 8; i += 1) acak += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `SMD-${acak.slice(0, 4)}-${acak.slice(4)}`;
}

// Get the base URL for verification links - uses app's own origin
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for SSR/build time
  return import.meta.env.VITE_APP_URL || 'http://localhost:5173';
}

export function urlVerifikasi(kode) {
  return `${getBaseUrl()}/verifikasi-surat?kode=${encodeURIComponent(kode)}`;
}

// Tautan tetap untuk mengunduh PDF surat (dibagikan melalui WhatsApp warga).
export function urlUnduhSurat(kode) {
  return `${getBaseUrl()}/unduh-surat?kode=${encodeURIComponent(kode)}`;
}

export function buatQrSurat(kode) {
  // Resolusi tinggi agar tajam saat dicetak, dengan quiet zone cukup untuk pemindaian.
  return QRCode.toDataURL(urlVerifikasi(kode), {
    margin: 2,
    width: 600,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  });
}