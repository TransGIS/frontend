/* ────────────────────────────────────────────────────────────
   Pencarian lokasi (Nominatim / OpenStreetMap) + oper asal-tujuan
   ke halaman /maps lewat query string.

   Catatan penggunaan Nominatim publik: maks. ~1 permintaan/detik dan
   cocok untuk trafik ringan. Kalau situs ramai, pindah ke instance
   sendiri atau layanan lain (Photon, MapTiler, dll) — cukup ganti
   ENDPOINT / toPlace() di file ini.
   ──────────────────────────────────────────────────────────── */

const ENDPOINT = 'https://nominatim.openstreetmap.org/search'
// kiri, atas, kanan, bawah — mencakup Kota & Kabupaten Bogor
const VIEWBOX = '106.60,-6.40,107.00,-6.80'

const cache = new Map()

function toPlace(d) {
    const parts = String(d.display_name || '').split(',').map((s) => s.trim())
    return {
        id: d.place_id,
        name: d.name || parts[0] || 'Lokasi',
        sub: parts.slice(1, 3).join(', '),
        lat: Number(d.lat),
        lng: Number(d.lon),
    }
}

/** Cari tempat di sekitar Bogor. Mengembalikan [{ id, name, sub, lat, lng }]. */
export async function searchPlaces(q, signal, limit = 5) {
    const key = `${limit}|${q.trim().toLowerCase()}`
    if (cache.has(key)) return cache.get(key)

    const params = new URLSearchParams({
        q,
        format: 'jsonv2',
        limit: String(limit),
        countrycodes: 'id',
        viewbox: VIEWBOX,
        bounded: '1',
        'accept-language': 'id',
    })
    const res = await fetch(`${ENDPOINT}?${params}`, { signal })
    if (!res.ok) throw new Error(`Pencarian lokasi gagal (${res.status})`)
    const places = (await res.json()).map(toPlace)
    cache.set(key, places)
    return places
}

/* ── Oper asal & tujuan ke /maps?asal=lat,lng&tujuan=lat,lng ── */

const parsePoint = (s) => {
    if (!s) return null
    const [lat, lng] = s.split(',').map(Number)
    const ok = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    return ok ? [lat, lng] : null
}

const fmt = (p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`

export const mapsUrl = (asal, tujuan) => `/maps?asal=${fmt(asal)}&tujuan=${fmt(tujuan)}`

/** Baca asal & tujuan dari URL. null bila salah satu tidak ada / tidak valid. */
export function readOD(search = window.location.search) {
    const p = new URLSearchParams(search)
    const asal = parsePoint(p.get('asal'))
    const tujuan = parsePoint(p.get('tujuan'))
    return asal && tujuan ? { asal, tujuan } : null
}