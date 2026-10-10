/* ────────────────────────────────────────────────────────────
   Info tambahan tiap rute untuk kartu di section "Info Tarif & Rute".
   Data ini TIDAK ada di file GeoJSON, jadi diisi manual di sini.

   Kunci = nomor rute (K1, K2, ... untuk BisKita; 01, 02, ... untuk angkot).
   Bila satu nomor punya beberapa varian (id rute berbeda), kamu bisa
   memakai id rute persis sebagai kunci; id lebih diutamakan daripada ref.

   Field (semua opsional — baris yang kosong otomatis disembunyikan):
     lintasan  : string  → jalan / kawasan yang dilewati
     interval  : string  → jarak antar kendaraan
     integrasi : string  → titik integrasi dengan moda lain
     jam       : string  → jam operasional

   CATATAN: isi K1 dan 02 di bawah masih contoh dari desain Figma.
   Ganti dengan data asli sebelum rilis.
   ──────────────────────────────────────────────────────────── */
export const ROUTE_INFO = {
    K1: {
        lintasan: 'Terminal Bubulak, Jl. KH. Sholeh Iskandar, Pajajaran, Cidangiang',
        interval: '5 – 10 Menit (Jam Sibuk)',
        integrasi: 'Stasiun Bogor & Baranangsiang',
        jam: '04:00 - 22:00 WIB',
    },
    '02': {
        lintasan: 'Terminal Bubulak, Jl. KH. Sholeh Iskandar, Pajajaran, Cidangiang',
        interval: '5 – 10 Menit (Jam Sibuk)',
        integrasi: 'Stasiun Bogor & Baranangsiang',
        jam: '04:00 - 22:00 WIB',
    },
    // K2: { lintasan: '...', interval: '...', integrasi: '...', jam: '...' },
}

export function getRouteInfo(route) {
    return ROUTE_INFO[route.id] ?? ROUTE_INFO[route.ref] ?? {}
}