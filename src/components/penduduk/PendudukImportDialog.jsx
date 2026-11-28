import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { parsePendudukFile, upsertPendudukBatch } from '@/lib/pendudukExcel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const BATCH_SIZE = 250;

export default function PendudukImportDialog({ open, onOpenChange, onImported }) {
  const [rows, setRows] = useState([]);
  const [validation, setValidation] = useState([]);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef(null);

  const reset = () => {
    setRows([]); setValidation([]); setFileName(''); setResult(null); setError('');
    setProgress({ done: 0, total: 0 });
    setShowPreview(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(''); setResult(null); setParsing(true); setFileName(file.name);
    try {
      const parsed = await parsePendudukFile(file);
      setRows(parsed.rows);
      setValidation(parsed.validation);
      if (parsed.rows.length === 0) setError('Tidak ada baris data yang terbaca. Pastikan format kolom sama dengan contoh Data KK.');
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
      // Hanya import baris yang valid (errors.length === 0)
      const validRows = rows.filter((_, idx) => validation[idx]?.isValid);
      if (validRows.length === 0) {
        setError('Tidak ada baris valid untuk diimpor. Perbaiki error pada preview.');
        setImporting(false);
        return;
      }
      setProgress({ done: 0, total: validRows.length });

      const { inserted, updated, errors, errorDetails } = await upsertPendudukBatch(validRows);
      setResult({ inserted, updated, skipped: rows.length - validRows.length, errors, errorDetails });
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
  
  const validCount = validation.filter(v => v.isValid).length;
  const invalidCount = validation.filter(v => !v.isValid).length;
  const warningCount = validation.filter(v => v.warnings && v.warnings.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Impor Data Penduduk (Excel)</DialogTitle>
          <DialogDescription>
            Unggah file Data KK dengan format yang sama seperti contoh desa (kolom NAMA, NO KK, NIK, dan seterusnya).
            Data warga dengan NIK yang sudah ada akan diperbarui (upsert). Kolom No. WA/HP di kolom ke-21 (opsional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

          {!result && (
            <>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/40 transition-colors">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium">{fileName || 'Pilih file .xlsx / .xls'}</span>
                <span className="text-xs text-muted-foreground">Format Data Kartu Keluarga Desa Tagog Apu</span>
                <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={parsing || importing} />
              </label>
            </>
          )}

          {parsing && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Membaca data Excel...
            </p>
          )}

          {!parsing && rows.length > 0 && !result && (
            <div className="rounded-xl bg-muted/50 p-4 text-sm space-y-1">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{rows.length.toLocaleString('id-ID')} baris total</Badge>
                <Badge variant="secondary">{validCount} valid</Badge>
                <Badge variant="destructive">{invalidCount} error</Badge>
                <Badge variant="outline">{warningCount} peringatan</Badge>
              </div>
              <p className="text-muted-foreground">
                {new Set(rows.map((r) => r.rw).filter(Boolean)).size} wilayah RW terdeteksi
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? <Eye className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />} {showPreview ? 'Sembunyikan' : 'Tampilkan'} Preview Validasi
              </Button>
            </div>
          )}

          {showPreview && validation.length > 0 && (
            <div className="rounded-xl border border-border max-h-64 overflow-hidden">
              <ScrollArea className="h-64">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1 font-semibold">NIK</th>
                      <th className="text-left px-2 py-1 font-semibold">Nama</th>
                      <th className="text-left px-2 py-1 font-semibold">No. KK</th>
                      <th className="text-left px-2 py-1 font-semibold">No. WA</th>
                      <th className="text-left px-2 py-1 font-semibold">Status</th>
                      <th className="text-left px-2 py-1 font-semibold">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validation.map((v, idx) => (
                      <tr key={idx} className={v.isValid ? '' : 'bg-destructive/5'}>
                        <td className="px-2 py-1 font-mono">{v.row?.nik || '-'}</td>
                        <td className="px-2 py-1">{v.row?.nama_lengkap || '-'}</td>
                        <td className="px-2 py-1 font-mono text-muted-foreground">{v.row?.no_kk || '-'}</td>
                        <td className="px-2 py-1 font-mono text-muted-foreground">{v.row?.no_wa || '-'}</td>
                        <td className="px-2 py-1">
                          {v.isValid ? (
                            <Badge variant="secondary">Valid</Badge>
                          ) : (
                            <Badge variant="destructive">Error</Badge>
                          )}
                        </td>
                        <td className="px-2 py-1">
                          <div className="flex flex-col gap-1">
                            {v.errors.map((e, i) => (
                              <span key={i} className="text-destructive text-[10px]">{e}</span>
                            ))}
                            {v.warnings?.map((w, i) => (
                              <span key={i} className="text-amber-600 text-[10px]">{w}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
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
              <p>{result.inserted.toLocaleString('id-ID')} data baru ditambahkan</p>
              {result.updated > 0 && <p>{result.updated.toLocaleString('id-ID')} data diperbarui</p>}
              {result.skipped > 0 && <p>{result.skipped.toLocaleString('id-ID')} data dilewati (error validasi)</p>}
              {result.errors > 0 && (
                <p className="text-destructive">{result.errors.toLocaleString('id-ID')} data gagal disimpan</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={importing}>
            {result ? 'Tutup' : 'Batal'}
          </Button>
          {!result && (
            <Button onClick={runImport} disabled={importing || parsing || rows.length === 0 || validCount === 0}>
              {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengimpor...</> : <><Upload className="w-4 h-4 mr-2" /> Impor {validCount} Data Valid</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}