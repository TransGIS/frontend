/* ────────────────────────────────────────────────────────────
   Pemuat & pengurai data rute (GeoJSON di public/rute/).
   Dipakai bersama oleh section "Info Tarif & Rute" di HomePage.
   Logikanya sama dengan yang ada di Maps.jsx — lihat catatan di
   bawah bila ingin Maps.jsx ikut memakai file ini.
   ──────────────────────────────────────────────────────────── */
import { dist, SPEED } from './routing'

const BASE = import.meta.env.BASE_URL
const FILES = {
    biskita: `${BASE}rute/biskita-bogor.geojson`,
    angkot: `${BASE}rute/angkot-kota-kabupaten-bogor.geojson`,
}

const FARE = { biskita: 'Rp 4.000', angkot: 'Rp 5.000-7.000' }
const PALETTE = ['#16A34A', '#2563EB', '#F97316', '#9333EA', '#0D9488', '#DB2777', '#CA8A04', '#0891B2', '#65A30D', '#7C3AED']
const OVERRIDES = { K1: { color: '#DC2626' } }

function makePart(pts, dir) {
    const cum = [0]
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]))
    return { pts, cum, dir: dir || null }
}

function nearest(part, p) {
    let i = 0
    let d = Infinity
    for (let k = 0; k < part.pts.length; k++) {
        const x = dist(part.pts[k], p)
        if (x < d) { d = x; i = k }
    }
    return { i, d }
}

function refFromName(name, fid) {
    const t = name.match(/^Trayek\s+(\d+\w*)/i)
    if (t) return t[1]
    const k = name.match(/Kor\s*(\d+)/i)
    if (k) return `Kor ${k[1]}`
    if (/^\d+\w*$/.test(name)) return name
    return `#${fid ?? '?'}`
}

function splitTitle(name, p) {
    if (p.from && p.to) return [p.from, p.to]
    let s = name.replace(/\s*\(via[^)]*\)/i, '')
    const m = s.match(/\((.+)\)/)
    if (m && /[-–—]/.test(m[1])) s = m[1]
    const t = s.split(/\s*[–—]\s*|\s+-\s+|-(?=[A-Z])/).map((x) => x.trim()).filter(Boolean)
    return t.length >= 2 ? [t[0], t[t.length - 1]] : [s, '']
}

export function buildRoutes(fc, kind, { exclude = new Set(), stopFeatures = [] } = {}) {
    const groups = new Map()
    for (const f of fc.features) {
        const g = f.geometry
        const p = f.properties || {}
        if (!g || !/LineString$/.test(g.type)) continue
        const name = String(p.name ?? p.Nama ?? '').trim()
        const ref = String(p.ref ?? refFromName(name, p.FID))
        if (exclude.has(ref)) continue
        const [from, to] = splitTitle(name, p)
        const key =
            kind === 'biskita' ? ref
                : p.Nama ? name
                    : p.from && p.to ? `${ref}|${[p.from, p.to].sort().join('>')}`
                        : `${ref}|${name}`
        const lines = g.type === 'LineString' ? [g.coordinates] : g.coordinates
        const parts = lines
            .map((l) => makePart(l.map((c) => [c[1], c[0]]), p.to))
            .filter((x) => x.pts.length > 1)
        if (!groups.has(key)) groups.set(key, { id: key, kind, ref, from, to, via: p.via || null, name, parts: [] })
        groups.get(key).parts.push(...parts)
    }

    return [...groups.values()].map((r, idx) => {
        const km = Math.max(...r.parts.map((x) => x.cum[x.cum.length - 1]))
        const route = {
            ...r,
            color: OVERRIDES[r.ref]?.color ?? PALETTE[idx % PALETTE.length],
            km,
            minutes: Math.max(5, Math.round((km / SPEED[kind]) * 60)),
            fare: FARE[kind],
            stops: [],
            allStops: [],
        }
        if (kind === 'biskita') attachStops(route, stopFeatures)
        return route
    })
}

function attachStops(route, stopFeatures) {
    const mine = stopFeatures.flatMap((s) => {
        const rel = s.properties?.['@relations']?.find((x) => x.role === 'stop' && String(x.reltags?.ref) === route.ref)
        return rel ? [{ s, seq: rel.seq }] : []
    })
    const placed = mine.map(({ s, seq }) => {
        const pos = [s.geometry.coordinates[1], s.geometry.coordinates[0]]
        let best = { pi: 0, i: 0, d: Infinity }
        route.parts.forEach((part, pi) => {
            const n = nearest(part, pos)
            if (n.d < best.d) best = { pi, i: n.i, d: n.d }
        })
        return { pos, name: s.properties?.name || null, seq, ...best }
    })
    if (!placed.length) return
    const toStop = (s, n) => ({ pos: s.pos, name: s.name || `Halte ${n + 1}`, named: !!s.name })
    route.allStops = placed.map(toStop)

    if (placed.every((s) => Number.isFinite(s.seq))) {
        route.stops = [...placed].sort((a, b) => a.seq - b.seq).map(toStop)
        return
    }
    const count = {}
    placed.forEach((s) => { count[s.pi] = (count[s.pi] || 0) + 1 })
    const primary = Number(Object.keys(count).sort((a, b) => count[b] - count[a])[0])
    route.stops = placed
        .filter((s) => s.pi === primary)
        .sort((a, b) => a.i - b.i)
        .map(toStop)
}

let cache = null

/** Muat kedua GeoJSON sekali saja; hasilnya di-cache untuk pemanggilan berikutnya. */
export function loadRoutes() {
    if (cache) return cache
    cache = Promise.all(
        Object.values(FILES).map((u) =>
            fetch(u).then((r) => {
                if (!r.ok) throw new Error(`${u} (${r.status})`)
                return r.json()
            }),
        ),
    )
        .then(([bis, angkot]) => {
            const biskita = buildRoutes(bis, 'biskita', {
                stopFeatures: bis.features.filter((f) => f.geometry?.type === 'Point'),
            })
            const exclude = new Set(biskita.map((r) => r.ref))
            return { biskita, angkot: buildRoutes(angkot, 'angkot', { exclude }) }
        })
        .catch((e) => {
            cache = null // izinkan coba lagi
            throw e
        })
    return cache
}