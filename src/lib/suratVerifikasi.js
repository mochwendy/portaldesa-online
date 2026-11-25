// Kode verifikasi & QR keaslian surat yang diterbitkan melalui SIMDESTA.
import QRCode from 'qrcode';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function buatKodeVerifikasi() {
  let acak = '';
  for (let i = 0; i < 8; i += 1) acak += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `SMD-${acak.slice(0, 4)}-${acak.slice(4)}`;
}

// Tautan QR selalu menunjuk ke domain resmi portal desa (bukan domain default aplikasi).
export const DOMAIN_VERIFIKASI = 'https://tagogapu.portaldesa.online';

export function urlVerifikasi(kode) {
  return `${DOMAIN_VERIFIKASI}/verifikasi-surat?kode=${encodeURIComponent(kode)}`;
}

// Tautan tetap untuk mengunduh PDF surat (dibagikan melalui WhatsApp warga).
export function urlUnduhSurat(kode) {
  return `${DOMAIN_VERIFIKASI}/unduh-surat?kode=${encodeURIComponent(kode)}`;
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