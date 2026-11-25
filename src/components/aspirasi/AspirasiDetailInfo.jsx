import React from 'react';

export default function AspirasiDetailInfo({ aspirasi }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Pelapor</p>
          <p className="font-medium">{aspirasi.nama}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">NIK</p>
          <p className="font-mono">{aspirasi.nik}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Nomor WhatsApp</p>
          <p className="font-medium">{aspirasi.no_telepon || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Kategori</p>
          <p className="font-medium">{aspirasi.kategori}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-muted-foreground">Alamat</p>
          <p className="font-medium">{aspirasi.alamat || '-'}</p>
        </div>
      </div>

      <div className="rounded-xl bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">Judul</p>
        <p className="font-semibold">{aspirasi.judul || '-'}</p>
        <p className="text-xs text-muted-foreground mt-3">Uraian</p>
        <p className="text-sm whitespace-pre-line mt-0.5">{aspirasi.isi}</p>
      </div>
    </>
  );
}