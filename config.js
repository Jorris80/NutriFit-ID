/* ============================================================
   NutriFit ID — Konfigurasi GitHub Pages
   ------------------------------------------------------------
   ISI SATU BARIS DI BAWAH INI dengan URL Web App Apps Script
   milikmu, lalu simpan dan unggah ulang ke GitHub.

   Cara mendapatkan URL-nya:
   1. Buka proyek Apps Script > Deploy > New deployment
   2. Type: Web app
      Execute as        : Me
      Who has access    : Anyone
   3. Salin "Web app URL", bentuknya:
      https://script.google.com/macros/s/AKfycb..../exec
   ============================================================ */

window.NUTRIFIT_CONFIG = {

  /* WAJIB diisi — tanpa ini aplikasi hanya membaca data cache. */
  gasUrl: 'https://script.google.com/macros/s/AKfycbynXIkXuRjwQiyT3hmUae5CvpQkRCP9HgjCM7hDz9ti2Irps_JNiv6RrCRehq-haOXv/exec',

  /* Nama yang tampil pada judul & pemasangan PWA. */
  namaAplikasi: 'NutriFit ID',

  /* Jeda penyegaran data otomatis (milidetik). Standar 5 menit. */
  jedaSegarkan: 300000,

  /* Setel true bila ingin melihat catatan galat di konsol peramban. */
  debug: false
};

/* Peringatan bila URL belum diisi, agar tidak bingung saat menguji. */
if (!window.NUTRIFIT_CONFIG.gasUrl) {
  console.warn('[NutriFit] gasUrl pada config.js masih kosong. ' +
    'Aplikasi berjalan dalam mode cache: data lama tetap terbaca, ' +
    'tetapi perubahan tidak dapat dikirim ke Google Sheets.');
}
