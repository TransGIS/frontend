import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ────────────────────────────────────────────────────────────
   Konfigurasi
   Taruh file GeoJSON di: public/rute/
   ──────────────────────────────────────────────────────────── */
const BASE = import.meta.env.BASE_URL
const FILES = {
    biskita: `${BASE}rute/biskita-bogor.geojson`,
    kota: `${BASE}rute/angkot-kota-kabupaten-bogor.geojson`,
    kabupaten: `${BASE}rute/angkot-kabupaten-bogor.geojson`,
}

const CENTER = [-6.5971, 106.806]
const FARE = { biskita: 'Rp 4.000', angkot: 'Rp 5.000-7.000' }
const SPEED = { biskita: 18, angkot: 15 } // km/jam, untuk estimasi
const WALK_KMH = 4.8
const MAX_WALK_KM = 1.5
const WAIT_MIN = 5
const CHIP_COLOR = { biskita: '#F97316', angkot: '#0D9F6E' }

const PALETTE = ['#16A34A', '#2563EB', '#F97316', '#9333EA', '#0D9488', '#DB2777', '#CA8A04', '#0891B2', '#65A30D', '#7C3AED']
// Ubah warna rute tertentu di sini bila perlu, mis. { K2: { color: '#C026D3' } }
const OVERRIDES = { K1: { color: '#DC2626' } }

/* ────────────────────────────────────────────────────────────
   Helper geometri & parsing GeoJSON
   ──────────────────────────────────────────────────────────── */
const RAD = Math.PI / 180
function dist(a, b) {
    const dLat = (b[0] - a[0]) * RAD
    const dLng = (b[1] - a[1]) * RAD
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLng / 2) ** 2
    return 12742 * Math.asin(Math.sqrt(h))
}

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

function buildRoutes(fc, kind, { exclude = new Set(), stopFeatures = [] } = {}) {
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

// Halte BisKita: ambil titik ber-role "stop" milik rute, urutkan sepanjang jalur utama.
function attachStops(route, stopFeatures) {
    const mine = stopFeatures.filter((s) =>
        s.properties?.['@relations']?.some((x) => x.role === 'stop' && String(x.reltags?.ref) === route.ref),
    )
    const placed = mine.map((s) => {
        const pos = [s.geometry.coordinates[1], s.geometry.coordinates[0]]
        let best = { pi: 0, i: 0, d: Infinity }
        route.parts.forEach((part, pi) => {
            const n = nearest(part, pos)
            if (n.d < best.d) best = { pi, i: n.i, d: n.d }
        })
        return { pos, name: s.properties?.name || null, ...best }
    })
    if (!placed.length) return
    const count = {}
    placed.forEach((s) => { count[s.pi] = (count[s.pi] || 0) + 1 })
    const primary = Number(Object.keys(count).sort((a, b) => count[b] - count[a])[0])
    route.allStops = placed.map((s, n) => ({ pos: s.pos, name: s.name || `Halte ${n + 1}` }))
    route.stops = placed
        .filter((s) => s.pi === primary)
        .sort((a, b) => a.i - b.i)
        .map((s, n) => ({ pos: s.pos, name: s.name || `Halte ${n + 1}` }))
}

/* Pencari rute langsung (tanpa transit): asal → naik → turun → tujuan */
function planTrips(routes, A, B) {
    const out = []
    for (const r of routes) {
        let best = null
        for (const part of r.parts) {
            const a = nearest(part, A)
            const b = nearest(part, B)
            if (a.d > MAX_WALK_KM || b.d > MAX_WALK_KM || b.i <= a.i) continue
            const ride = part.cum[b.i] - part.cum[a.i]
            if (ride < 0.3) continue
            const walkAMin = ((a.d * 1.25) / WALK_KMH) * 60
            const walkBMin = ((b.d * 1.25) / WALK_KMH) * 60
            const rideMin = (ride / SPEED[r.kind]) * 60
            const total = walkAMin + WAIT_MIN + rideMin + walkBMin
            if (!best || total < best.total) {
                best = { route: r, part, a, b, ride, rideMin, walkAMin, walkBMin, total, walkKm: (a.d + b.d) * 1.25 }
            }
        }
        if (best) out.push(best)
    }
    out.sort((x, y) => x.total - y.total)
    const top = out.slice(0, 4)
    if (top.length) top[0].tag = 'Tercepat'
    const rest = top.slice(1).sort((x, y) => x.walkKm - y.walkKm)
    if (rest.length && rest[0].walkKm < top[0].walkKm) rest[0].tag = 'Sedikit Jalan'
    const t0 = Date.now()
    return top.map((p) => ({
        ...p,
        depart: t0 + p.walkAMin * 60000,
        arrive: t0 + p.total * 60000,
    }))
}

const hhmm = (t) =>
    new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':')
const fmtKm = (km) => `${km.toFixed(1)} km`

/* ────────────────────────────────────────────────────────────
   Ikon
   ──────────────────────────────────────────────────────────── */
const ICONS = {
    pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    back: <path d="M19 12H5M12 19l-7-7 7-7" />,
    sliders: <path d="M4 6h8m4 0h4M4 12h2m4 0h10M4 18h10m4 0h2" />,
    bus: <path d="M5 4h14a1 1 0 011 1v11H4V5a1 1 0 011-1zM4 11h16M7 19v-3M17 19v-3" />,
    car: <path d="M5 16l1.5-5a2 2 0 012-1.5h7a2 2 0 012 1.5L19 16M4 16h16v3H4zM7 19v1M17 19v1" />,
    walk: <><circle cx="13" cy="4" r="1.5" /><path d="M12 8l-3 3 1 3 2-1M12 8l3 3 2 1M10 14l-2 6M12 13l2 3v4" /></>,
    locate: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
    close: <path d="M6 6l12 12M18 6L6 18" />,
}
function Icon({ name, className = 'w-4 h-4' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
            {ICONS[name]}
        </svg>
    )
}

/* ────────────────────────────────────────────────────────────
   Komponen kecil sidebar
   ──────────────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200 mb-2">{children}</p>
)

function Badge({ route }) {
    return (
        <span
            className="shrink-0 min-w-9 h-9 px-1.5 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: route.color }}
        >
            {route.ref}
        </span>
    )
}

function RouteCard({ route, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left bg-white rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-start gap-3">
                <Badge route={route} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-snug">
                        {route.from}
                        {route.to && <span className="text-gray-400 font-normal"> → </span>}
                        {route.to}
                    </p>
                    {route.via && <p className="text-xs text-gray-500 mt-0.5">Via {route.via}</p>}
                </div>
                <span className="shrink-0 bg-gray-100 text-gray-700 text-[11px] font-bold rounded px-2 py-1">{route.fare}</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><Icon name="clock" className="w-3.5 h-3.5" />Estimasi Perjalanan: ~{route.minutes} mnt</span>
                {route.kind === 'biskita' && <span>Tarif Flat</span>}
            </div>
        </button>
    )
}

function BackButton({ onClick }) {
    return (
        <button type="button" onClick={onClick} className="flex items-center gap-2 text-white text-sm font-semibold mb-4 hover:text-orange-300 transition-colors">
            <Icon name="back" className="w-5 h-5" /> Kembali
        </button>
    )
}

function Timeline({ items }) {
    return (
        <ol className="relative pl-7">
            <span className="absolute left-[9px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#F97316] to-[#16A34A]" />
            {items.map((s, i) => {
                const first = i === 0
                const last = i === items.length - 1
                return (
                    <li key={`${s.name}-${i}`} className="relative mb-3 last:mb-0">
                        <span
                            className={`absolute -left-7 top-4 w-5 h-5 rounded-full border-[3px] ${first ? 'bg-[#F97316] border-white' : last ? 'bg-[#16A34A] border-white' : 'bg-[#0A47A9] border-[#F97316]'}`}
                        />
                        <div className="rounded-xl border-2 border-white/90 px-3.5 py-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-white">{s.name}</p>
                                {(first || last || s.tag) && (
                                    <span className={`shrink-0 text-[10px] font-bold text-white rounded-full px-2 py-0.5 ${first ? 'bg-[#F97316]' : last ? 'bg-[#16A34A]' : 'bg-white/20'}`}>
                                        {first ? 'Titik Awal' : last ? 'Tujuan Akhir' : s.tag}
                                    </span>
                                )}
                            </div>
                            {s.sub && <p className="text-xs text-blue-200 mt-0.5">{s.sub}</p>}
                        </div>
                    </li>
                )
            })}
        </ol>
    )
}

function RouteDetail({ route, onBack }) {
    const items = route.stops.length
        ? route.stops.map((s, i) => ({
            name: s.name,
            sub: i === 0 ? route.from : `${s.pos[0].toFixed(5)}, ${s.pos[1].toFixed(5)}`,
        }))
        : [
            { name: route.from, sub: 'Pangkalan / titik awal rute' },
            ...(route.via ? [{ name: route.via, sub: 'Melewati kawasan ini', tag: 'Via' }] : []),
            { name: route.to || route.from, sub: 'Titik akhir rute' },
        ]
    return (
        <>
            <BackButton onClick={onBack} />
            <div className="bg-[#16A34A] rounded-xl p-3.5 mb-5 text-white shadow-md">
                <div className="flex items-start gap-3">
                    <Badge route={route} />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-snug">{route.from}{route.to && ' → '}{route.to}</p>
                        {route.via && <p className="text-xs text-green-100 mt-0.5">Via {route.via}</p>}
                    </div>
                    <span className="shrink-0 bg-green-900/50 text-[11px] font-bold rounded px-2 py-1">{route.fare}</span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/25 flex items-center justify-between text-xs text-green-50">
                    <span className="flex items-center gap-1.5"><Icon name="clock" className="w-3.5 h-3.5" />Estimasi Perjalanan: ~{route.minutes} mnt • {fmtKm(route.km)}</span>
                    {route.kind === 'biskita' && <span>Tarif Flat</span>}
                </div>
            </div>
            <SectionLabel>Daftar halte &amp; kedatangan</SectionLabel>
            <Timeline items={items} />
            {!route.stops.length && (
                <p className="text-xs text-blue-200 mt-4 leading-relaxed">
                    Data halte untuk trayek angkot belum ada di file GeoJSON, jadi hanya titik awal dan akhir yang ditampilkan.
                </p>
            )}
        </>
    )
}

function PickField({ label, color, value, placeholder, active, onPick, onClear }) {
    return (
        <div>
            <SectionLabel>{label}</SectionLabel>
            <div className={`flex items-center bg-white rounded-xl px-3 py-2.5 gap-2.5 ring-2 transition-all ${active ? 'ring-[#F97316]' : 'ring-transparent'}`}>
                <span style={{ color }}><Icon name="pin" className="w-4 h-4" /></span>
                <button type="button" onClick={onPick} className={`flex-1 text-left text-sm truncate ${value ? 'text-gray-800' : 'text-gray-400'}`}>
                    {value || placeholder}
                </button>
                {value && (
                    <button type="button" onClick={onClear} aria-label={`Hapus ${label}`} className="text-gray-400 hover:text-gray-700">
                        <Icon name="close" className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    )
}

function PlanChips({ plan }) {
    const Mode = plan.route.kind === 'biskita' ? 'bus' : 'car'
    const walk = (m) => (
        <span className="inline-flex items-center gap-1 bg-white text-gray-800 text-xs font-semibold rounded px-2 py-1">
            <Icon name="walk" className="w-3.5 h-3.5" />{Math.max(1, Math.round(m))}&apos;
        </span>
    )
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {walk(plan.walkAMin)}
            <span className="text-blue-300">›</span>
            <span className="inline-flex items-center gap-1 text-white text-xs font-bold rounded px-2 py-1" style={{ background: CHIP_COLOR[plan.route.kind] }}>
                <Icon name={Mode} className="w-3.5 h-3.5" />{plan.route.ref} {plan.route.kind === 'biskita' ? 'Bis Kita' : 'Angkot'}
            </span>
            <span className="text-blue-300">›</span>
            {walk(plan.walkBMin)}
        </div>
    )
}

const TagPill = ({ tag }) =>
    tag ? (
        <span className={`text-[10px] font-bold rounded px-2 py-0.5 ${tag === 'Tercepat' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{tag}</span>
    ) : null

function PlanSummary({ plan }) {
    return (
        <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{Math.round(plan.total)}</span>
            <span className="text-lg text-white">mnt</span>
            <span className="text-xs text-blue-200">• Tiba pukul {hhmm(plan.arrive)}</span>
        </div>
    )
}

function PlanDetail({ plan, onBack }) {
    const r = plan.route
    const isBus = r.kind === 'biskita'
    const steps = [
        {
            icon: 'walk', bg: 'bg-white text-gray-800', label: 'Jalan kaki',
            title: `Jalan ke jalur ${r.ref}`,
            sub: `Jarak ~${fmtKm(plan.a.d * 1.25)} • Tiba sebelum ${hhmm(plan.depart + WAIT_MIN * 60000)}`,
            time: `${Math.max(1, Math.round(plan.walkAMin))} mnt`,
        },
        {
            icon: isBus ? 'bus' : 'car', bg: 'text-white', color: CHIP_COLOR[r.kind], label: isBus ? 'Naik bus' : 'Naik angkot',
            chip: r.ref, title: `Arah ${plan.part.dir || r.to || r.from}`,
            sub: `Perjalanan ~${fmtKm(plan.ride)} • ${Math.round(plan.rideMin)} mnt • Tarif ${r.fare}`,
            time: hhmm(plan.depart + WAIT_MIN * 60000),
        },
        {
            icon: 'walk', bg: 'bg-white text-gray-800', label: 'Jalan kaki',
            title: 'Turun, lalu jalan ke tujuan',
            sub: `Jarak ~${fmtKm(plan.b.d * 1.25)}`,
            time: `Tiba ${hhmm(plan.arrive)}`,
        },
    ]
    return (
        <>
            <BackButton onClick={onBack} />
            <PlanSummary plan={plan} />
            <div className="mt-3 mb-5"><PlanChips plan={plan} /></div>
            <ol className="relative">
                <span className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-white/30" />
                {steps.map((s, i) => (
                    <li key={i} className="relative flex gap-3 pb-6 last:pb-0">
                        <span className={`relative shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${s.bg}`} style={s.color ? { background: s.color } : undefined}>
                            <Icon name={s.icon} className="w-4 h-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-blue-200">Langkah {i + 1} • {s.label}</p>
                                <span className="shrink-0 bg-white/90 text-gray-800 text-[11px] font-semibold rounded px-2 py-0.5">{s.time}</span>
                            </div>
                            <p className="text-sm font-semibold text-white mt-1">
                                {s.chip && <span className="inline-block text-[11px] font-bold rounded px-1.5 py-0.5 mr-1.5" style={{ background: s.color }}>{s.chip}</span>}
                                {s.title}
                            </p>
                            <p className="text-xs text-blue-200 mt-0.5">{s.sub}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </>
    )
}

/* ────────────────────────────────────────────────────────────
   Marker peta
   ──────────────────────────────────────────────────────────── */
const pinIcon = (color, text) =>
    L.divIcon({
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        html: `<div style="background:${color};width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);color:#fff;font:700 12px/1 system-ui,sans-serif">${text}</span></div>`,
    })

/* ────────────────────────────────────────────────────────────
   Halaman peta
   ──────────────────────────────────────────────────────────── */
function Maps() {
    const [data, setData] = useState({ biskita: [], kota: [], kabupaten: [] })
    const [status, setStatus] = useState('loading') // loading | ready | error
    const [error, setError] = useState('')

    const [tab, setTab] = useState('trayek') // 'petunjuk' | 'trayek'
    const [mode, setMode] = useState('biskita') // 'biskita' | 'angkot'
    const [area, setArea] = useState('kota') // 'kota' | 'kabupaten'
    const [query, setQuery] = useState('')
    const [selectedId, setSelectedId] = useState(null)

    const [asal, setAsal] = useState(null)
    const [tujuan, setTujuan] = useState(null)
    const [pick, setPick] = useState('asal')
    const [planIdx, setPlanIdx] = useState(null)
    const [geoMsg, setGeoMsg] = useState('')

    const mapEl = useRef(null)
    const map = useRef(null)
    const groups = useRef({})
    const layers = useRef({})
    const live = useRef({})
    live.current = { tab, pick, tujuan }

    /* ── Muat GeoJSON dari public/rute ── */
    useEffect(() => {
        let off = false
        Promise.all(
            Object.values(FILES).map((u) =>
                fetch(u).then((r) => {
                    if (!r.ok) throw new Error(`${u} (${r.status})`)
                    return r.json()
                }),
            ),
        )
            .then(([bis, kota, kab]) => {
                if (off) return
                const biskita = buildRoutes(bis, 'biskita', { stopFeatures: bis.features.filter((f) => f.geometry?.type === 'Point') })
                const exclude = new Set(biskita.map((r) => r.ref))
                setData({
                    biskita,
                    kota: buildRoutes(kota, 'angkot', { exclude }),
                    kabupaten: buildRoutes(kab, 'angkot'),
                })
                setStatus('ready')
            })
            .catch((e) => {
                if (off) return
                setError(e.message)
                setStatus('error')
            })
        return () => { off = true }
    }, [])

    const routes = mode === 'biskita' ? data.biskita : area === 'kota' ? data.kota : data.kabupaten
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return routes
        return routes.filter((r) => `${r.ref} ${r.from} ${r.to} ${r.via || ''} ${r.name}`.toLowerCase().includes(q))
    }, [routes, query])

    const selected = tab === 'trayek' ? routes.find((r) => r.id === selectedId) || null : null
    const plans = useMemo(() => (asal && tujuan ? planTrips(routes, asal, tujuan) : []), [routes, asal, tujuan])
    const plan = tab === 'petunjuk' && planIdx != null ? plans[planIdx] || null : null

    /* ── Inisialisasi peta (sekali) ── */
    useEffect(() => {
        const m = L.map(mapEl.current, { center: CENTER, zoom: 12, zoomControl: false, preferCanvas: true })
        L.control.zoom({ position: 'topright' }).addTo(m)
        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                subdomains: ['a', 'b', 'c'],
                attribution: '&copy; OpenStreetMap contributors'
            }
        ).addTo(m)
        groups.current = {
            routes: L.layerGroup().addTo(m),
            stops: L.layerGroup().addTo(m),
            plan: L.layerGroup().addTo(m),
            od: L.layerGroup().addTo(m),
        }
        m.on('click', (e) => {
            const { tab: t, pick: p, tujuan: tj } = live.current
            if (t !== 'petunjuk' || !p) return
            const ll = [e.latlng.lat, e.latlng.lng]
            if (p === 'asal') {
                setAsal(ll)
                setPick(tj ? null : 'tujuan')
            } else {
                setTujuan(ll)
                setPick(null)
            }
            setPlanIdx(null)
        })
        map.current = m
        return () => { m.remove(); map.current = null }
    }, [])

    useEffect(() => {
        if (map.current) map.current.getContainer().style.cursor = tab === 'petunjuk' && pick ? 'crosshair' : ''
    }, [tab, pick])

    /* ── Gambar semua jalur sesuai moda ── */
    useEffect(() => {
        const m = map.current
        if (!m) return
        const g = groups.current.routes
        g.clearLayers()
        layers.current = {}
        const all = []
        routes.forEach((r) => {
            layers.current[r.id] = r.parts.map((part) => {
                all.push(...part.pts)
                return L.polyline(part.pts, { color: r.color, weight: 4, opacity: 0.85, lineCap: 'round', lineJoin: 'round' })
                    .bindTooltip(`${r.ref} • ${r.from}${r.to ? ' → ' + r.to : ''}`, { sticky: true })
                    .on('click', () => {
                        if (live.current.tab === 'trayek') setSelectedId(r.id)
                    })
                    .addTo(g)
            })
        })
        if (all.length) m.fitBounds(L.latLngBounds(all), { padding: [30, 30] })
    }, [routes])

    /* ── Sorot rute terpilih + halte ── */
    useEffect(() => {
        const m = map.current
        if (!m) return
        const dim = !!plan
        routes.forEach((r) => {
            const isSel = r.id === selected?.id
                ; (layers.current[r.id] || []).forEach((l) => {
                    l.setStyle({
                        weight: isSel ? 7 : selected ? 3 : 4,
                        opacity: dim ? 0.1 : selected ? (isSel ? 1 : 0.15) : 0.85,
                    })
                    if (isSel) l.bringToFront()
                })
        })
        const sg = groups.current.stops
        sg.clearLayers()
        if (selected && !plan) {
            selected.allStops.forEach((s) =>
                L.circleMarker(s.pos, { radius: 5, color: '#fff', weight: 2, fillColor: selected.color, fillOpacity: 1 })
                    .bindTooltip(s.name)
                    .addTo(sg),
            )
            m.fitBounds(L.latLngBounds(selected.parts.flatMap((p) => p.pts)), { padding: [50, 50] })
        }
    }, [routes, selected, plan])

    /* ── Marker asal / tujuan ── */
    useEffect(() => {
        const og = groups.current.od
        if (!og) return
        og.clearLayers()
        const add = (pos, color, text, setter) =>
            L.marker(pos, { icon: pinIcon(color, text), draggable: true })
                .on('dragend', (e) => {
                    const { lat, lng } = e.target.getLatLng()
                    setter([lat, lng])
                    setPlanIdx(null)
                })
                .addTo(og)
        if (tab !== 'petunjuk') return
        if (asal) add(asal, '#16A34A', 'A', setAsal)
        if (tujuan) add(tujuan, '#F97316', 'B', setTujuan)
    }, [asal, tujuan, tab])

    /* ── Gambar rute perjalanan terpilih ── */
    useEffect(() => {
        const m = map.current
        const pg = groups.current.plan
        if (!m || !pg) return
        pg.clearLayers()
        if (!plan) return
        const { part, a, b, route } = plan
        const ride = part.pts.slice(a.i, b.i + 1)
        const walk = { color: '#1B3A8C', weight: 4, dashArray: '2 9', lineCap: 'round' }
        L.polyline([asal, part.pts[a.i]], walk).addTo(pg)
        L.polyline([part.pts[b.i], tujuan], walk).addTo(pg)
        L.polyline(ride, { color: '#fff', weight: 11, opacity: 0.9 }).addTo(pg)
        L.polyline(ride, { color: route.color, weight: 7 }).addTo(pg)
            ;[part.pts[a.i], part.pts[b.i]].forEach((p) =>
                L.circleMarker(p, { radius: 6, color: route.color, weight: 3, fillColor: '#fff', fillOpacity: 1 }).addTo(pg),
            )
        m.fitBounds(L.latLngBounds([asal, tujuan, ...ride]), { padding: [60, 60] })
    }, [plan, asal, tujuan])

    /* ── Aksi ── */
    const switchTab = (t) => {
        setTab(t)
        setSelectedId(null)
        setPlanIdx(null)
        if (t === 'petunjuk' && !asal) setPick('asal')
    }
    const switchMode = (md) => {
        setMode(md)
        setSelectedId(null)
        setPlanIdx(null)
        setQuery('')
    }
    const switchArea = (a) => {
        setArea(a)
        setSelectedId(null)
        setPlanIdx(null)
        setQuery('')
    }
    const useMyLocation = () => {
        setGeoMsg('')
        if (!navigator.geolocation) return setGeoMsg('Browser kamu tidak mendukung lokasi.')
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const ll = [pos.coords.latitude, pos.coords.longitude]
                setAsal(ll)
                setPick(tujuan ? null : 'tujuan')
                setPlanIdx(null)
                map.current?.flyTo(ll, 15)
            },
            () => setGeoMsg('Lokasi tidak bisa diakses. Izinkan akses lokasi atau klik peta untuk memilih asal.'),
            { enableHighAccuracy: true, timeout: 10000 },
        )
    }
    const fmtPoint = (p) => (p ? `Titik di peta (${p[0].toFixed(4)}, ${p[1].toFixed(4)})` : '')

    const legend = routes.slice(0, 6)

    /* ── Tampilan ── */
    return (
        <section className="flex flex-col lg:flex-row h-[100dvh] lg:h-[calc(100vh-4rem)] lg:min-h-[640px]">
            <aside className="w-full lg:w-[420px] shrink-0 bg-[#0A47A9] flex flex-col" style={{ maxHeight: 'clamp(240px, 45dvh, 99999px)' }}>
                <div className="shrink-0 px-4 pt-4">
                    <div className="flex gap-4 mb-3">
                        {[['petunjuk', 'Petunjuk Arah'], ['trayek', 'Trayek']].map(([k, l]) => (
                            <button
                                key={k}
                                type="button"
                                onClick={() => switchTab(k)}
                                className={`pb-1 text-sm font-semibold border-b-2 transition-colors ${tab === k ? 'text-white border-white' : 'text-blue-200 border-transparent hover:text-white'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                        {[['biskita', 'Bis Kita', 'bus'], ['angkot', 'Angkot Bogor (01–32)', 'car']].map(([k, l, ic]) => (
                            <button
                                key={k}
                                type="button"
                                onClick={() => switchMode(k)}
                                className={`flex items-center gap-1.5 pb-1.5 text-sm border-b-2 transition-colors ${mode === k ? 'text-white font-bold border-[#F97316]' : 'text-blue-200 border-transparent hover:text-white'}`}
                            >
                                <Icon name={ic} className={`w-4 h-4 ${mode === k ? 'text-[#F97316]' : ''}`} />{l}
                            </button>
                        ))}
                    </div>
                    {mode === 'angkot' && (
                        // SESUDAH
                        <div className="flex gap-1 mt-3 bg-white/10 rounded-full p-1 w-fit max-w-full overflow-x-auto scrollbar-none">
                            {[['kota', 'Kota Bogor'], ['kabupaten', 'Kabupaten Bogor']].map(([k, l]) => (
                                <button
                                    key={k}
                                    type="button"
                                    onClick={() => switchArea(k)}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${area === k ? 'bg-white text-[#0A47A9]' : 'text-blue-100 hover:text-white'}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                    {status === 'loading' && <p className="text-sm text-blue-100">Memuat data rute…</p>}
                    {status === 'error' && (
                        <div className="bg-red-50 text-red-800 text-sm rounded-xl p-3.5 leading-relaxed">
                            Data rute gagal dimuat: {error}. Pastikan file GeoJSON ada di <code>public/rute/</code>.
                        </div>
                    )}

                    {status === 'ready' && tab === 'trayek' && (
                        selected ? (
                            <RouteDetail route={selected} onBack={() => setSelectedId(null)} />
                        ) : (
                            <>
                                <SectionLabel>Tujuan &amp; pencarian koridor</SectionLabel>
                                <div className="flex items-center bg-white rounded-xl px-3 py-2.5 gap-2.5 mb-4">
                                    <span className="text-[#F97316]"><Icon name="pin" /></span>
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={mode === 'biskita' ? 'Pilih koridor... (cth: K1 atau Bubulak)' : 'Cari nomor trayek angkot (cth: 02, 03, 10)...'}
                                        className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400"
                                    />
                                    <span className="text-gray-400"><Icon name="sliders" /></span>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {filtered.map((r) => <RouteCard key={r.id} route={r} onClick={() => setSelectedId(r.id)} />)}
                                    {!filtered.length && (
                                        <p className="text-sm text-blue-100">Tidak ada trayek yang cocok dengan “{query}”. Coba nomor atau nama lokasi lain.</p>
                                    )}
                                </div>
                            </>
                        )
                    )}

                    {status === 'ready' && tab === 'petunjuk' && (
                        plan ? (
                            <PlanDetail plan={plan} onBack={() => setPlanIdx(null)} />
                        ) : (
                            <>
                                <div className="flex flex-col gap-3">
                                    <PickField
                                        label="Asal" color="#16A34A" value={fmtPoint(asal)} active={pick === 'asal'}
                                        placeholder="Klik peta untuk memilih lokasi asal"
                                        onPick={() => setPick('asal')} onClear={() => { setAsal(null); setPick('asal'); setPlanIdx(null) }}
                                    />
                                    <PickField
                                        label="Tujuan" color="#F97316" value={fmtPoint(tujuan)} active={pick === 'tujuan'}
                                        placeholder="Klik peta untuk memilih tujuan"
                                        onPick={() => setPick('tujuan')} onClear={() => { setTujuan(null); setPick('tujuan'); setPlanIdx(null) }}
                                    />
                                    <button
                                        type="button"
                                        onClick={useMyLocation}
                                        className="flex items-center gap-2.5  hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wide rounded-xl px-3 py-3 transition-colors"
                                    >
                                        <span className="text-[#F97316]"><Icon name="locate" /></span>Dari lokasi Anda sekarang
                                    </button>
                                    {geoMsg && <p className="text-xs text-orange-200">{geoMsg}</p>}
                                </div>

                                <div className="mt-6 -mx-4 border-t border-white/15">
                                    <p className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white">Rute rekomendasi</p>
                                    {!asal || !tujuan ? (
                                        <p className="px-4 pb-2 text-sm text-blue-100 leading-relaxed">
                                            {pick === 'tujuan' ? 'Klik peta untuk menentukan tujuan.' : 'Pilih asal dan tujuan di peta, rute terbaik akan muncul di sini.'}
                                        </p>
                                    ) : plans.length === 0 ? (
                                        <p className="px-4 pb-2 text-sm text-blue-100 leading-relaxed">
                                            Tidak ada {mode === 'biskita' ? 'BisKita' : 'angkot'} langsung antara dua titik ini dalam jarak jalan {MAX_WALK_KM} km. Geser penanda atau coba moda lain.
                                        </p>
                                    ) : (
                                        plans.map((p, i) => (
                                            <button
                                                key={p.route.id}
                                                type="button"
                                                onClick={() => setPlanIdx(i)}
                                                className="w-full text-left px-4 py-4 border-t border-white/15 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <PlanSummary plan={p} />
                                                    <TagPill tag={p.tag} />
                                                </div>
                                                <div className="my-2.5"><PlanChips plan={p} /></div>
                                                <p className="text-xs text-blue-100">
                                                    Berangkat pukul <b className="text-white">{hhmm(p.depart + WAIT_MIN * 60000)}</b> dari jalur {p.route.ref} ({p.route.from}{p.route.to && ' → ' + p.route.to})
                                                </p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )
                    )}
                </div>
            </aside>

            {/* Peta */}
            <div className="relative isolate flex-1 min-h-[50dvh] lg:h-auto">
                <div ref={mapEl} className="absolute inset-0 bg-gray-100" />
                {tab === 'petunjuk' && pick && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-[#1B3A8C] text-white text-xs font-semibold rounded-full px-4 py-2 shadow-lg pointer-events-none">
                        Klik peta untuk memilih {pick === 'asal' ? 'lokasi asal' : 'tujuan'}
                    </div>
                )}
                {legend.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none flex justify-center">
                        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-700 max-w-full">
                            <span className="flex items-center gap-1.5 font-bold text-gray-900"><Icon name="pin" className="w-3.5 h-3.5 text-[#F97316]" />Legenda Jalur:</span>
                            {legend.map((r) => (
                                <span key={r.id} className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                                    {r.ref} ({r.to || r.from})
                                </span>
                            ))}
                            {routes.length > legend.length && <span className="text-gray-400">+{routes.length - legend.length} lainnya</span>}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

export default Maps