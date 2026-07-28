/* ============================================================
   NutriFit ID — Service Worker
   Menyediakan mode offline penuh untuk PWA di GitHub Pages.

   Strategi:
   - Berkas inti (HTML/CSS/JS/ikon) : cache-first, diperbarui di latar belakang
   - Peta Leaflet & ubin OSM        : cache terpisah, dibatasi jumlahnya
   - Panggilan ke Apps Script       : TIDAK di-cache (data harus segar);
                                      saat offline, aplikasi memakai
                                      localStorage + antrean sinkronisasi
   Naikkan angka VERSI setiap kali berkas di bawah berubah, supaya
   pengguna lama otomatis mendapat versi terbaru.
   ============================================================ */

const VERSI = 'nutrifit-v2';
const CACHE_INTI  = VERSI + '-inti';
const CACHE_PETA  = VERSI + '-peta';
const CACHE_LUAR  = VERSI + '-luar';

const BATAS_PETA = 600;   /* maksimal ubin peta yang disimpan */
const BATAS_LUAR = 60;    /* maksimal berkas pihak ketiga     */

const BERKAS_INTI = [
  './',
  './index.html',
  './config.js',
  './manifest.json',
  './icon.svg'
];

/* ---------------- Pemasangan ---------------- */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_INTI)
      .then((c) => c.addAll(BERKAS_INTI))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW] gagal menyimpan berkas inti:', err))
  );
});

/* ---------------- Aktivasi: buang cache versi lama ---------------- */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((kunci) => Promise.all(
        kunci.filter((k) => k.indexOf(VERSI) !== 0).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ---------------- Pesan dari halaman ---------------- */
self.addEventListener('message', (e) => {
  if (e.data === 'lewati-tunggu') self.skipWaiting();
  if (e.data === 'bersihkan-cache') {
    caches.keys().then((k) => k.forEach((n) => caches.delete(n)));
  }
});

/* ---------------- Pengambilan ---------------- */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                 /* POST ke Apps Script dilewati */

  const url = new URL(req.url);

  /* 1. Apps Script / Open Food Facts / Gemini — selalu ke jaringan.
        Bila gagal, biarkan aplikasi menangani sendiri (mode offline). */
  if (url.hostname.indexOf('script.google') >= 0 ||
      url.hostname.indexOf('googleusercontent') >= 0 ||
      url.hostname.indexOf('openfoodfacts') >= 0 ||
      url.hostname.indexOf('googleapis') >= 0) {
    return;
  }

  /* 2. Ubin peta OpenStreetMap — cache-first dengan batas jumlah. */
  if (url.hostname.indexOf('tile.openstreetmap.org') >= 0) {
    e.respondWith(cacheDuluBerbatas(req, CACHE_PETA, BATAS_PETA));
    return;
  }

  /* 3. Pustaka pihak ketiga (Leaflet dari unpkg). */
  if (url.origin !== self.location.origin) {
    e.respondWith(cacheDuluBerbatas(req, CACHE_LUAR, BATAS_LUAR));
    return;
  }

  /* 4. Berkas aplikasi sendiri — cache-first + penyegaran diam-diam. */
  e.respondWith(
    caches.match(req).then((tersimpan) => {
      const dariJaringan = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const salinan = res.clone();
          caches.open(CACHE_INTI).then((c) => c.put(req, salinan));
        }
        return res;
      }).catch(() => tersimpan);

      return tersimpan || dariJaringan;
    }).catch(() => caches.match('./index.html'))
  );
});

/* ---------------- Pembantu ---------------- */
function cacheDuluBerbatas(req, namaCache, batas) {
  return caches.open(namaCache).then((c) =>
    c.match(req).then((tersimpan) => {
      if (tersimpan) return tersimpan;
      return fetch(req).then((res) => {
        if (res && res.status === 200) {
          c.put(req, res.clone());
          pangkasCache(namaCache, batas);
        }
        return res;
      }).catch(() => tersimpan || Response.error());
    })
  );
}

/** Buang entri terlama bila cache melewati batas. */
function pangkasCache(nama, batas) {
  caches.open(nama).then((c) =>
    c.keys().then((kunci) => {
      if (kunci.length <= batas) return;
      for (let i = 0; i < kunci.length - batas; i++) c.delete(kunci[i]);
    })
  );
}

/* ---------------- Notifikasi ---------------- */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((daftar) => {
      for (const k of daftar) if ('focus' in k) return k.focus();
      if (self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});
