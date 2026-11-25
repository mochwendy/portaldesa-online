import { loadLocalData } from './src/lib/localData.js';

async function test() {
  try {
    const penduduk = await loadLocalData('Penduduk');
    console.log('Penduduk CSV loaded successfully', penduduk.length, 'rows');
    const apbdes = await loadLocalData('APBDes');
    console.log('APBDes CSV loaded successfully', apbdes.length, 'rows');
    const umkm = await loadLocalData('UMKM');
    console.log('UMKM CSV loaded successfully', umkm.length, 'rows');
    
    const realisasi = await loadLocalData('RealisasiPembangunan');
    console.log('Realisasi CSV loaded successfully', realisasi.length, 'rows');
    
    const profil = await loadLocalData('ProfilDesa');
    console.log('Profil CSV loaded successfully', profil ? 'Profil found' : 'No Profil data');
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();