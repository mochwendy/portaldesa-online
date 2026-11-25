import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { parsePendudukFile, fetchExistingNik } from '@/lib/pendudukExcel';

const BATCH_SIZE = 250;

export default function PendudukImportDialog({ open, onOpenChange, onImported }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const reset = () => {
    setRows([]); setFileName(''); setResult(null); setError('');
    setProgress({ done: 0, total: 0 });
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(''); setResult(null); setParsing(true); setFileName(file.name);
    try {
      const parsed = await parsePendudukFile(file);
      setRows(parsed);
      if (parsed.length === 0) setError('Tidak ada baris data yang terbaca. Pastikan format kolom sama dengan contoh Data KK.');
    } catch (e) {
      setError(e.message || 'Gagal membaca file Excel.');
    } finally {
      setParsing(false);
    }
  };

  const runImport = async () => {
    if (rows.length === 0) return;
    setImporting(true); setError(''); setResult(null);
    try {
      const existingNik = await fetchExistingNik();
      const fresh = rows.filter((row) => !existingNik.has(row.nik));
      setProgress({ done: 0, total: fresh.length });

      let inserted = 0;
      for (let i = 0; i < fresh.length; i += BATCH_SIZE) {
        const batch = fresh.slice(i, i + BATCH_SIZE);
        await base44.entities.Penduduk.bulkCreate(batch);
        inserted += batch.length;
        setProgress({ done: inserted, total: fresh.length });
      }
      setResult({ inserted, skipped: rows.length - fresh.length });
      onImported();
    } catch (e) {
      setError(e.message || 'Impor gagal di tengah proses.');
    } finally {
      setImporting(false);
    }
  };

  const close = (next) => {
    if (importing) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Impor Data Penduduk (Excel)</DialogTitle>
          <DialogDescription>
            Unggah file Data KK dengan format yang sama seperti contoh desa (kolom NAMA, NO KK, NIK, dan seterusnya).
            Data warga dengan NIK yang sudah ada otomatis dilewati.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

          {!result && (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/40 transition-colors">
              <FileSpreadsheet className="w-8 h-8 text-primary" />
              <span className="text-sm font-medium">{fileName || 'Pilih file .xlsx / .xls'}</span>
              <span className="text-xs text-muted-foreground">Format Data Kartu Keluarga Desa Tagog Apu</span>
              <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={parsing || importing} />
            </label>
          )}

          {parsing && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Membaca data Excel...
            </p>
          )}

          {!parsing && rows.length > 0 && !result && (
            <div className="rounded-xl bg-muted/50 p-4 text-sm space-y-1">
              <p><span className="font-semibold">{rows.length.toLocaleString('id-ID')}</span> baris warga terbaca</p>
              <p className="text-muted-foreground">
                {new Set(rows.map((r) => r.rw).filter(Boolean)).size} wilayah RW terdeteksi
              </p>
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                Menyimpan {progress.done.toLocaleString('id-ID')} dari {progress.total.toLocaleString('id-ID')} data ({percent}%)
              </p>
            </div>
          )}

          {result && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 space-y-1">
              <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="w-4 h-4" /> Impor selesai</p>
              <p>{result.inserted.toLocaleString('id-ID')} data baru tersimpan</p>
              {result.skipped > 0 && <p>{result.skipped.toLocaleString('id-ID')} data dilewati karena NIK sudah terdaftar</p>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={importing}>
            {result ? 'Tutup' : 'Batal'}
          </Button>
          {!result && (
            <Button onClick={runImport} disabled={importing || parsing || rows.length === 0}>
              {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengimpor...</> : <><Upload className="w-4 h-4 mr-2" /> Impor Sekarang</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}