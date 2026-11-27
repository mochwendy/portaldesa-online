import fs from 'fs';
import path from 'path';

const csvPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'public/data/Penduduk_export.csv');
const outputPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'public/data/demografi_summary.json');

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

function countToPairs(rows, field, nameFn) {
  const counts = {};
  rows.forEach((r) => {
    const v = r[field] || '';
    if (v === '' || v === null || v === undefined) return;
    counts[v] = (counts[v] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name: nameFn ? nameFn(name) : String(name).trim(), value: Number(value) || 0 }))
    .sort((a, b) => b.value - a.value);
}

async function main() {
  console.log('Reading CSV...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);
  
  console.log(`Total rows: ${rows.length}`);
  
  const total = rows.length;
  const lakiLaki = rows.filter((r) => (r.jenis_kelamin || '').toLowerCase() === 'laki-laki').length;
  const perempuan = rows.filter((r) => (r.jenis_kelamin || '').toLowerCase() === 'perempuan').length;
  const mkRows = new Set(rows.map((r) => r.no_kk).filter((k) => k));
  const totalKK = mkRows.size;
  
  let usiaProduktif = 0;
  rows.forEach((r) => {
    const k = (r.kelompok_usia || '');
    const m = k.match(/(\d+)/);
    if (m && Number(m[1]) >= 15 && Number(m[1]) <= 64) usiaProduktif++;
  });
  
  const disabilitas = rows.filter((r) => (r.disabilitas || '') !== '').length;
  
  const gender = countToPairs(rows, 'jenis_kelamin');
  const usia = countToPairs(rows, 'kelompok_usia');
  const pendidikan = countToPairs(rows, 'pendidikan');
  const pekerjaan = countToPairs(rows, 'pekerjaan').slice(0, 10);
  const perkawinan = countToPairs(rows, 'status_perkawinan');
  const keluarga = countToPairs(rows, 'status_keluarga');
  const agama = countToPairs(rows, 'agama');
  const wilayah = countToPairs(rows, 'rw', (v) => `RW ${v}`);
  
  const summary = {
    total,
    totalKK,
    disabilitas,
    lakiLaki,
    perempuan,
    usiaProduktif,
    gender,
    usia,
    pendidikan,
    pekerjaan,
    perkawinan,
    keluarga,
    agama,
    wilayah,
    generatedAt: new Date().toISOString(),
    source: 'Penduduk_export.csv',
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  console.log('Summary saved to:', outputPath);
  console.log('Total:', total);
  console.log('Laki-laki:', lakiLaki);
  console.log('Perempuan:', perempuan);
  console.log('Total KK:', totalKK);
  console.log('Usia Produktif:', usiaProduktif);
  console.log('Disabilitas:', disabilitas);
  console.log('\nGender:', gender);
  console.log('\nUsia:', usia);
}

main().catch(console.error);