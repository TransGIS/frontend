/* Semua pemanggilan API admin ke backend Express (lihat backend/src/routes.js).
   Token JWT disimpan di localStorage melalui `session`. */
import { dist, SPEED } from './routing'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const KEY = 'transgis_admin'

/* Cek kedaluwarsa JWT dari klaim `exp` (tanpa verifikasi tanda tangan —
   verifikasi tetap dilakukan backend di requireAuth). */
const expired = (token) => {
    try {
        let b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        b64 += '='.repeat((4 - (b64.length % 4)) % 4)
        const { exp } = JSON.parse(atob(b64))
        return !exp || exp * 1000 <= Date.now()
    } catch { return true }
}

export const session = {
    get: () => {
        try {
            const s = JSON.parse(localStorage.getItem(KEY))
            if (!s || typeof s.token !== 'string' || !s.user || expired(s.token)) {
                localStorage.removeItem(KEY)
                return null
            }
            return s
        } catch { return null }
    },
    set: (s) => localStorage.setItem(KEY, JSON.stringify(s)),
    clear: () => localStorage.removeItem(KEY),
}

const toLogin = () => window.location.replace('/admin/login')

async function req(path, opts = {}) {
    const s = session.get()
    // Endpoint selain auth wajib punya sesi valid; jika tidak, kembali ke login.
    if (!s && !path.startsWith('/api/auth/')) {
        toLogin()
        throw new Error('Sesi berakhir. Silakan login kembali.')
    }
    let res
    try {
        res = await fetch(`${API}${path}`, {
            ...opts,
            headers: { 'Content-Type': 'application/json', ...(s?.token && { Authorization: `Bearer ${s.token}` }) },
            body: opts.body && JSON.stringify(opts.body),
        })
    } catch {
        throw new Error('Tidak bisa menghubungi server. Jalankan backend (npm run dev di folder backend).')
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
        // Token ditolak backend (kedaluwarsa/tidak valid) → paksa logout.
        if (res.status === 401 && s) { session.clear(); toLogin() }
        throw new Error(data.message || `Permintaan gagal (${res.status})`)
    }
    return data
}

/* ── Penyesuaian bentuk data: dokumen backend (routes/stops) ↔ form frontend ── */

export const FORM_DEFAULTS = {
    biskita: { tarif: 'Rp 4.000', tipeTarif: 'flat', intervalMenit: 15, jamBuka: '05:00', jamTutup: '21:00', status: 'aktif', integrasi: '' },
    angkot: { tarif: 'Rp 5.000-7.000', tipeTarif: 'jarak', intervalMenit: 10, jamBuka: '05:30', jamTutup: '20:00', status: 'aktif', integrasi: '' },
}

const kmOf = (parts = []) => Math.max(0, ...parts.map((pts) => pts.reduce((sum, pt, i) => (i ? sum + dist(pts[i - 1], pt) : sum), 0)))
const stopRows = (stops = []) => stops.map((s) => ({ pos: [s.location.coordinates[1], s.location.coordinates[0]], name: s.nama }))

const toRow = (d) => {
    const km = kmOf(d.pathGeoJSON)
    return {
        id: d._id, kode: d.kodeRute, nama: d.namaRute, from: d.asal, to: d.tujuan, via: d.viaDeskripsi || '',
        color: d.color || '#2563EB', markerColor: d.markerColor || '#F97316',
        halte: d.halte ?? (d.stops || []).length,
        estimasi: km ? `~${Math.max(5, Math.round((km / SPEED[d.tipe]) * 60))} mnt` : '—',
        tarif: d.tarif, status: d.status, parts: d.pathGeoJSON || [], stops: stopRows(d.stops),
    }
}

const toForm = (d) => ({
    nama: d.namaRute, kode: d.kodeRute, from: d.asal, to: d.tujuan, via: d.viaDeskripsi || '',
    tarif: d.tarif, tipeTarif: d.tipeTarif, intervalMenit: d.intervalMenit,
    jamBuka: d.jamOperasional?.buka || '', jamTutup: d.jamOperasional?.tutup || '',
    status: d.status, integrasi: (d.integrasi || []).join(', '),
    color: d.color || '#2563EB', markerColor: d.markerColor || '#F97316',
    parts: d.pathGeoJSON || [], stops: stopRows(d.stops),
})

const toPayload = (kind, f) => ({
    tipe: kind, kodeRute: f.kode, namaRute: f.nama, asal: f.from, tujuan: f.to, viaDeskripsi: f.via,
    tarif: f.tarif, tipeTarif: f.tipeTarif, intervalMenit: Number(f.intervalMenit) || 0,
    jamOperasional: { buka: f.jamBuka, tutup: f.jamTutup },
    integrasi: String(f.integrasi || '').split(',').map((s) => s.trim()).filter(Boolean),
    status: f.status, color: f.color, markerColor: f.markerColor,
    pathGeoJSON: f.parts, stops: f.stops.map((s) => ({ pos: s.pos, name: s.name })),
})

async function trayek(kind) {
    const { items } = await req(`/api/routes?tipe=${kind}`)
    return { items: items.map(toRow) }
}

export const adminApi = {
    login: (username, password) => req('/api/auth/login', { method: 'POST', body: { username, password } }),
    forgot: (email) => req('/api/auth/forgot', { method: 'POST', body: { email } }),
    dashboard: () => req('/api/dashboard'),
    trayek,
    get: async (kind, id) => toForm(await req(`/api/routes/${encodeURIComponent(id)}`)),
    remove: (kind, id) => req(`/api/routes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    // id null = tambah baru, id terisi = ubah
    save: (kind, id, data) => req(id ? `/api/routes/${encodeURIComponent(id)}` : '/api/routes', {
        method: id ? 'PUT' : 'POST',
        body: toPayload(kind, data),
    }),
}
