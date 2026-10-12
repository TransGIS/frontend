/* Semua pemanggilan API admin ada di sini.
   VITE_USE_MOCK=false di .env  → pakai backend asli (VITE_API_URL).
   Default: mock (login: admin / admin123).

   Endpoint ASUMSI (backend baru punya GET /api/health):
   POST /api/auth/login   {username,password} → {token,user:{name,role}}
   POST /api/auth/forgot  {email}             → {ok}
   GET  /api/admin/dashboard                  → lihat MOCK_DASH
   GET  /api/trayek?kind=biskita|angkot       → {items:[{id,kode,from,to,via,halte,estimasi,tarif}]}
   POST   /api/trayek  | PUT /api/trayek/:id  {kind,kode,nama,kodeLama,from,to,via,jaringan,operator,kendaraan,color,markerColor,parts,stops} → {ok}
   GET    /api/trayek/:id    → satu trayek (bentuk sama seperti item di atas, + parts & stops)
   DELETE /api/trayek/:id    → {ok}  */
import { loadRoutes } from './routeData'
import { dist, SPEED } from './routing'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const KEY = 'transgis_admin'
const wait = (v) => new Promise((r) => setTimeout(() => r(v), 350))

export const session = {
    get: () => { try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null } },
    set: (s) => localStorage.setItem(KEY, JSON.stringify(s)),
    clear: () => localStorage.removeItem(KEY),
}

async function req(path, opts = {}) {
    const s = session.get()
    const res = await fetch(`${API}${path}`, {
        ...opts,
        headers: { 'Content-Type': 'application/json', ...(s?.token && { Authorization: `Bearer ${s.token}` }) },
        body: opts.body && JSON.stringify(opts.body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || `Permintaan gagal (${res.status})`)
    return data
}

// ── Data trayek: GeoJSON di public/rute (lewat routeData.js) + perubahan admin yang disimpan di localStorage ──
const STORE = 'transgis_admin_data'
const store = (() => { try { return JSON.parse(localStorage.getItem(STORE)) } catch { return null } })()
    ?? { removed: [], edits: {}, created: { biskita: [], angkot: [] } }
const persist = () => { try { localStorage.setItem(STORE, JSON.stringify(store)) } catch { /* penyimpanan penuh */ } }

export const FORM_DEFAULTS = {
    biskita: { jaringan: 'BisKita Trans Pakuan', operator: 'BisKita Trans Pakuan', kendaraan: 'bus' },
    angkot: { jaringan: 'Angkutan Kota Bogor', operator: 'Dishub Kota Bogor', kendaraan: 'angkot' },
}

const toRow = (r) => ({
    id: r.id, kode: r.ref, nama: r.name, kodeLama: '', from: r.from, to: r.to, via: r.via || '',
    ...FORM_DEFAULTS[r.kind], color: r.color, markerColor: '#F97316',
    halte: r.stops.length, estimasi: `~${r.minutes} mnt`, tarif: r.fare,
    parts: r.parts.map((p) => p.pts), stops: r.allStops.map((s) => ({ pos: s.pos, name: s.name })),
})

// hitung ulang halte, estimasi & tarif dari jalur yang diunggah
function withMeta(kind, d) {
    const km = Math.max(0, ...d.parts.map((pts) => pts.reduce((sum, pt, i) => (i ? sum + dist(pts[i - 1], pt) : sum), 0)))
    const minutes = Math.max(5, Math.round((km / SPEED[kind]) * 60))
    return { ...d, halte: d.stops.length, estimasi: km ? `~${minutes} mnt` : '—', tarif: kind === 'biskita' ? 'Rp 4.000' : 'Rp 5.000-7.000' }
}

async function geoRows(kind) {
    const base = (await loadRoutes())[kind].map(toRow)
    return [...base, ...(store.created[kind] || [])]
        .filter((r) => !store.removed.includes(`${kind}:${r.id}`))
        .map((r) => ({ ...r, ...store.edits[`${kind}:${r.id}`] }))
        .sort((x, y) => String(x.kode).localeCompare(String(y.kode), 'id', { numeric: true }))
}

const MOCK_DASH = {
    biskita: { total: 5, baru: 2, tarif: 'Rp 4.000' },
    angkot: { total: 29, baru: 2, tarif: 'Rp 4.000 - Rp 7.000' },
    visitors: { total: 180, delta: 5 },
    series: [['Sab', 28.4], ['Min', 22.1], ['Sen', 24.6], ['Sel', 31.2], ['Rab', 14.5], ['Kam', 26.8], ['Jum', 25.3]],
    history: [
        { title: 'Terminal Bubulak', type: 'Penambahan Rute', note: 'Hub Transit Barat: BisKita K1, K2 + Angkot 02, 03, 15' },
        { title: 'Halte Merdeka / Stasiun', type: 'Perubahan Rute', note: 'Integrasi KRL Jabodetabek (350m transfer walking)' },
        { title: 'Cidangiang / Baranangsiang', type: 'Penghapusan Rute', note: 'Gerbang Masuk Tol Jagorawi, Botani Square & Damri Bandara' },
        { title: 'Simpang Yasmin / Cilendek', type: 'Penambahan Rute', note: 'Simpang Koridor BisKita K2 dan Feeder Angkot 02 Salabenda' },
    ],
}

export const adminApi = {
    async login(username, password) {
        if (!MOCK) return req('/api/auth/login', { method: 'POST', body: { username, password } })
        if (username === 'admin' && password === 'admin123') return wait({ token: 'mock', user: { name: 'Admin Dishub Bogor', role: 'Pengelola Trayek Kota' } })
        await wait(); throw new Error('Username atau kata sandi salah.')
    },
    forgot: (email) => (MOCK ? wait({ ok: true }) : req('/api/auth/forgot', { method: 'POST', body: { email } })),
    async dashboard() {
        if (!MOCK) return req('/api/admin/dashboard')
        const [b, a] = await Promise.all([geoRows('biskita'), geoRows('angkot')])
        // total rute = dari GeoJSON; pengunjung, grafik & riwayat masih dummy (belum ada sumber data)
        return wait({
            ...MOCK_DASH,
            biskita: { total: b.length, baru: 0, tarif: 'Rp 4.000' },
            angkot: { total: a.length, baru: 0, tarif: 'Rp 4.000 - Rp 7.000' },
        })
    },
    async trayek(kind) {
        if (MOCK) return { items: await geoRows(kind) }
        return req(`/api/trayek?kind=${kind}`)
    },
    async remove(kind, id) {
        if (MOCK) { store.removed.push(`${kind}:${id}`); persist(); return wait({ ok: true }) }
        return req(`/api/trayek/${encodeURIComponent(id)}`, { method: 'DELETE' })
    },
    async get(kind, id) {
        if (!MOCK) return req(`/api/trayek/${encodeURIComponent(id)}`)
        const row = (await geoRows(kind)).find((r) => r.id === id)
        if (!row) throw new Error('Trayek tidak ditemukan.')
        return row
    },
    // id null = tambah baru, id terisi = ubah
    async save(kind, id, data) {
        if (!MOCK) return req(id ? `/api/trayek/${encodeURIComponent(id)}` : '/api/trayek', { method: id ? 'PUT' : 'POST', body: { kind, ...data } })
        const row = withMeta(kind, data)
        if (id) store.edits[`${kind}:${id}`] = row
        else store.created[kind] = [...(store.created[kind] || []), { ...row, id: `baru-${Date.now()}` }]
        persist()
        return wait({ ok: true })
    },
}