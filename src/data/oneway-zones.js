/* ────────────────────────────────────────────────────────────
   Zona jalan SATU ARAH (mis. SSA Kebun Raya).

   Angkot yang digambar 1 garis dianggap bisa bolak-balik, KECUALI di:
   1) bagian garis yang berputar membentuk loop (terdeteksi otomatis), dan
   2) zona di bawah ini (cadangan manual bila loop tidak terdeteksi).

   Tiap zona = kotak [selatan, barat, utara, timur] dalam derajat lat/lng.
   `refs` (opsional) membatasi zona hanya untuk nomor rute tertentu.
   Cara mudah mendapat koordinat: klik titik di peta (/maps) lalu baca
   koordinatnya, atau klik kanan di Google Maps → salin koordinat.

   Contoh (SESUAIKAN koordinatnya sebelum dipakai):
     { name: 'SSA Kebun Raya', bounds: [-6.6050, 106.7900, -6.5930, 106.8060] },
     { name: 'Loop khusus 05',  bounds: [...], refs: ['05'] },
   ──────────────────────────────────────────────────────────── */
export const ONEWAY_ZONES = []