/* ────────────────────────────────────────────────────────────
   Pemuat data rute publik dari API backend (koleksi routes + stops).
   Dipakai oleh Maps.jsx dan section "Info Tarif & Rute" di HomePage.
   ──────────────────────────────────────────────────────────── */
import { dist, SPEED } from './routing'
import { registerVisitor } from './consent'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const FARE = { biskita: 'Rp 4.000', angkot: 'Rp 5.000-7.000' }
const PALETTE = ['#16A34A', '#2563EB', '#F97316', '#9333EA', '#0D9488', '#DB2777', '#CA8A04', '#0891B2', '#65A30D', '#7C3AED']
const OVERRIDES = { K1: { color: '#DC2626' }, K2F: { color: '#A559A4' } }

function makePart(pts) {
    const cum = [0]
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]))
    return { pts, cum, dir: null }
}

function toRoute(kind, doc, idx) {
    const parts = (doc.pathGeoJSON || []).map(makePart).filter((p) => p.pts.length > 1)
    const km = parts.length ? Math.max(...parts.map((p) => p.cum[p.cum.length - 1])) : 0
    const stops = (doc.stops || []).map((s) => ({
        pos: [s.location.coordinates[1], s.location.coordinates[0]],
        name: s.nama,
        named: true,
    }))
    // Detail operasional diambil apa adanya dari koleksi routes (bukan data contoh).
    const intervalMin = Number(doc.intervalMenit) > 0 ? Number(doc.intervalMenit) : null
    const buka = doc.jamOperasional?.buka || ''
    const tutup = doc.jamOperasional?.tutup || ''
    return {
        id: doc._id, kind, ref: doc.kodeRute, from: doc.asal, to: doc.tujuan,
        via: doc.viaDeskripsi || null, name: doc.namaRute,
        color: OVERRIDES[doc.kodeRute]?.color ?? doc.color ?? PALETTE[idx % PALETTE.length],
        km,
        minutes: Math.max(5, Math.round((km / SPEED[kind]) * 60)),
        fare: doc.tarif || FARE[kind],
        tipeTarif: doc.tipeTarif || null,
        intervalMin,
        jamOperasional: buka && tutup ? { buka, tutup } : null,
        stops, allStops: stops, parts,
    }
}

let cache = null

/* Satu kunjungan = satu kali dokumen dimuat (satu tab). Berpindah halaman di
   dalam SPA tidak menambah hitungan, mis. Beranda → Peta tetap 1. Refresh atau
   membuka tab baru mengeksekusi ulang modul ini, jadi dihitung sebagai
   kunjungan baru. Flag ini juga mencegah hitungan ganda dari StrictMode. */
let counted = false

/** Catat satu kunjungan halaman publik ke koleksi page_views (fire-and-forget),
    sekaligus mendaftarkan pengunjung unik bila cookie sudah disetujui. */
export function trackPageView() {
    if (counted) return
    counted = true
    fetch(`${API}/api/public/page-view`, { method: 'POST' }).catch(() => {})
    registerVisitor()
}

const walkCache = new Map()

/** Geometri jalan kaki mengikuti jalan asli (backend → OSRM pejalan kaki).
    Mengembalikan array [lat,lng], atau null bila gagal (pemanggil fallback ke garis lurus). */
export function fetchWalkRoute(from, to) {
    const key = `${from[0].toFixed(5)},${from[1].toFixed(5)}|${to[0].toFixed(5)},${to[1].toFixed(5)}`
    if (walkCache.has(key)) return walkCache.get(key)
    const p = fetch(`${API}/api/public/walk-route?from=${from[0]},${from[1]}&to=${to[0]},${to[1]}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
            if (d?.ok && d.pts?.length > 1) return d.pts
            walkCache.delete(key) // izinkan coba lagi di kesempatan berikutnya
            return null
        })
        .catch(() => { walkCache.delete(key); return null })
    walkCache.set(key, p)
    return p
}

/** Muat semua rute dari API sekali saja; hasilnya di-cache untuk pemanggilan berikutnya. */
export function loadRoutes() {
    if (cache) return cache
    cache = fetch(`${API}/api/public/routes`)
        .then((r) => {
            if (!r.ok) throw new Error(`API ${r.status}`)
            return r.json()
        })
        .then((data) => ({
            biskita: (data.biskita || []).map((d, i) => toRoute('biskita', d, i)),
            angkot: (data.angkot || []).map((d, i) => toRoute('angkot', d, i)),
        }))
        .catch((e) => {
            cache = null // izinkan coba lagi
            throw e
        })
    return cache
}
