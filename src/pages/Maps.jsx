import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { buildGraph, planTrips, MAX_WALK_KM } from '../lib/routing'
import { loadRoutes } from '../lib/routeData'
import { readOD } from '../lib/geocode'

/* ────────────────────────────────────────────────────────────
   Konfigurasi
   Pemuatan & parsing GeoJSON (public/rute/) ada di src/lib/routeData.js
   Geometri jarak & dijkstra ada di src/lib/routing.js
   ──────────────────────────────────────────────────────────── */
const CENTER = [-6.5971, 106.806]
const CHIP_COLOR = { biskita: '#F97316', angkot: '#0D9F6E' }

const hhmm = (t) =>
    new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':')
const fmtKm = (km) => `${km.toFixed(1)} km`
const fmtRp = (n) => `Rp ${n.toLocaleString('id-ID')}`
const fmtFare = (f) => (f.lo === f.hi ? fmtRp(f.lo) : `${fmtRp(f.lo)}–${fmtRp(f.hi)}`)

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
        ? route.stops.map((s) => ({
            name: s.name,
            // halte bernama tidak perlu koordinat; halte tanpa nama tetap menampilkannya
            sub: s.named ? undefined : `${s.pos[0].toFixed(5)}, ${s.pos[1].toFixed(5)}`,
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
    const walk = (m, key) => (
        <span key={key} className="inline-flex items-center gap-1 bg-white text-gray-800 text-xs font-semibold rounded px-2 py-1">
            <Icon name="walk" className="w-3.5 h-3.5" />{Math.max(1, Math.round(m))}&apos;
        </span>
    )
    const sep = (key) => <span key={key} className="text-blue-300">›</span>
    const out = []
    plan.legs.forEach((l, i) => {
        if (i === 0 || l.walk.min >= 1) out.push(walk(l.walk.min, `w${i}`), sep(`a${i}`))
        out.push(
            <span key={`c${i}`} className="inline-flex items-center gap-1 text-white text-xs font-bold rounded px-2 py-1" style={{ background: CHIP_COLOR[l.route.kind] }}>
                <Icon name={l.route.kind === 'biskita' ? 'bus' : 'car'} className="w-3.5 h-3.5" />{l.route.ref} {l.route.kind === 'biskita' ? 'Bis Kita' : 'Angkot'}
            </span>,
            sep(`b${i}`),
        )
    })
    out.push(walk(plan.endWalk.min, 'wend'))
    return <div className="flex flex-wrap items-center gap-1.5">{out}</div>
}

const TagPill = ({ tag }) =>
    tag ? (
        <span className={`text-[10px] font-bold rounded px-2 py-0.5 ${tag === 'Tercepat' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{tag}</span>
    ) : null

function PlanSummary({ plan }) {
    return (
        <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl font-bold text-white">{Math.round(plan.total)}</span>
            <span className="text-lg text-white">mnt</span>
            <span className="text-xs text-blue-200">
                • Tiba pukul {hhmm(plan.arrive)} • {plan.transfers ? `${plan.transfers}x transit` : 'Langsung'}
            </span>
        </div>
    )
}

function PlanDetail({ plan, onBack }) {
    const steps = []
    plan.legs.forEach((l, i) => {
        const r = l.route
        const isBus = r.kind === 'biskita'
        steps.push({
            icon: 'walk', bg: 'bg-white text-gray-800', label: i === 0 ? 'Jalan kaki' : 'Transit',
            title: l.boardStop ? `Jalan ke halte ${l.boardStop}` : i === 0 ? `Jalan ke jalur ${r.ref}` : `Pindah ke jalur ${r.ref}`,
            sub: `Jarak ~${fmtKm(l.walk.km)} • Tiba sebelum ${hhmm(l.boardAt)}`,
            time: `${Math.max(1, Math.round(l.walk.min))} mnt`,
        })
        steps.push({
            icon: isBus ? 'bus' : 'car', bg: 'text-white', color: CHIP_COLOR[r.kind], label: isBus ? 'Naik bus' : 'Naik angkot',
            chip: r.ref, title: `Arah ${l.reversed ? r.from : (l.part.dir || r.to || r.from)}`,
            sub: `${l.alightStop ? `Turun di halte ${l.alightStop} • ` : ''}Perjalanan ~${fmtKm(l.km)} • ${Math.round(l.rideMin)} mnt • Tarif ${r.fare}`,
            time: hhmm(l.boardAt),
        })
    })
    const lastStop = plan.legs[plan.legs.length - 1].alightStop
    steps.push({
        icon: 'walk', bg: 'bg-white text-gray-800', label: 'Jalan kaki',
        title: lastStop ? `Turun di halte ${lastStop}, lalu jalan ke tujuan` : 'Turun, lalu jalan ke tujuan',
        sub: `Jarak ~${fmtKm(plan.endWalk.km)}`,
        time: `Tiba ${hhmm(plan.arrive)}`,
    })
    return (
        <>
            <BackButton onClick={onBack} />
            <PlanSummary plan={plan} />
            <div className="mt-3 mb-2"><PlanChips plan={plan} /></div>
            <p className="text-xs text-blue-200 mb-5">Total tarif ~{fmtFare(plan.fare)}</p>
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
   Popup rute: info singkat + titik awal & titik akhir
   ──────────────────────────────────────────────────────────── */
const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const KIND_LABEL = { biskita: 'Bis Kita', angkot: 'Angkot' }

const tipHtml = (r) =>
    `<span class="tg-dot" style="background:${r.color}"></span><b>${esc(r.ref)}</b><span>${esc(r.from)}${r.to ? ` → ${esc(r.to)}` : ''}</span>`

function popupHtml(r) {
    const end = r.to || r.from
    return `
<div class="tg-card" style="--c:${r.color}">
  <div class="tg-bar"></div>
  <div class="tg-head">
    <span class="tg-badge">${esc(r.ref)}</span>
    <div class="tg-headtxt">
      <div class="tg-kind">${KIND_LABEL[r.kind]}</div>
      <div class="tg-title">${esc(r.from)}${r.to ? ` <span>→</span> ${esc(r.to)}` : ''}</div>
    </div>
  </div>
  <div class="tg-stats">
    <div><b>${esc(r.fare)}</b><span>Tarif</span></div>
    <div><b>~${r.minutes} mnt</b><span>Estimasi</span></div>
    <div><b>${r.km.toFixed(1).replace('.', ',')} km</b><span>Panjang</span></div>
  </div>
  <div class="tg-pass">
    <ol class="tg-list">
      <li class="tg-stop tg-end"><i></i><b>${esc(r.from)}</b><small>Titik awal</small></li>
      <li class="tg-stop tg-end"><i></i><b>${esc(end)}</b><small>Titik akhir</small></li>
    </ol>
  </div>
</div>`
}

function openRoutePopup(m, r, latlng) {
    L.popup({ className: 'tg-popup', maxWidth: 300, minWidth: 280, autoPanPadding: [30, 30] })
        .setLatLng(latlng)
        .setContent(popupHtml(r))
        .openOn(m)
}

const POPUP_CSS = `
.tg-tip.leaflet-tooltip{display:flex;align-items:center;gap:8px;padding:6px 10px;border:0;border-radius:10px;background:#fff;color:#111827;font-size:12px;box-shadow:0 6px 18px rgba(10,30,80,.22)}
.tg-tip.leaflet-tooltip::before{display:none}
.tg-tip .tg-dot{width:10px;height:10px;border-radius:50%;flex:none}
.tg-tip b{font-weight:700}
.tg-popup .leaflet-popup-content-wrapper{padding:0;border-radius:16px;overflow:hidden;box-shadow:0 14px 36px rgba(10,30,80,.3)}
.tg-popup .leaflet-popup-content{margin:0;width:280px!important;font-family:inherit}
.tg-popup .leaflet-popup-tip{box-shadow:0 6px 12px rgba(10,30,80,.15)}
.tg-popup a.leaflet-popup-close-button{top:12px;right:10px;width:24px;height:24px;padding:0;font-size:20px;line-height:22px;text-align:center;color:#6B7280}
.tg-card{color:#111827}
.tg-bar{height:5px;background:var(--c)}
.tg-head{display:flex;gap:10px;align-items:flex-start;padding:12px 38px 12px 14px}
.tg-badge{flex:none;min-width:38px;height:38px;padding:0 6px;border-radius:10px;background:var(--c);color:#fff;font:700 13px/38px system-ui,sans-serif;text-align:center}
.tg-kind{font-size:11px;font-weight:600;color:#6B7280}
.tg-title{font-size:14px;font-weight:700;line-height:1.3}
.tg-title span{color:#9CA3AF;font-weight:400}
.tg-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#E5E7EB;border-top:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB}
.tg-stats div{display:flex;flex-direction:column;gap:2px;padding:8px 10px;background:#F8FAFC}
.tg-stats b{font-size:12px;font-weight:700}
.tg-stats span{font-size:10px;color:#6B7280}
.tg-pass{padding:14px 14px 14px}
.tg-list{list-style:none;margin:0;padding:0;max-height:190px;overflow-y:auto}
.tg-stop{position:relative;padding:0 0 11px 20px;font-size:12px;line-height:1.3}
.tg-stop:last-child{padding-bottom:0}
.tg-stop::before{content:'';position:absolute;left:4px;top:12px;bottom:-2px;width:2px;background:var(--c);opacity:.35}
.tg-stop:last-child::before{display:none}
.tg-stop i{position:absolute;left:0;top:3px;width:10px;height:10px;box-sizing:border-box;border-radius:50%;background:#fff;border:2px solid var(--c)}
.tg-stop.tg-end i{background:var(--c)}
.tg-stop b{display:block;font-weight:600}
.tg-stop small{display:block;color:#6B7280;font-size:11px}
`

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
    const [data, setData] = useState({
        biskita: [],
        angkot: [],
    })
    const [status, setStatus] = useState('loading') // loading | ready | error
    const [error, setError] = useState('')

    // Asal & tujuan dari landing page (/maps?asal=lat,lng&tujuan=lat,lng), atau null
    const [init] = useState(readOD)

    const [tab, setTab] = useState(init ? 'petunjuk' : 'trayek') // 'petunjuk' | 'trayek'
    const [mode, setMode] = useState('biskita') // 'biskita' | 'angkot'
    const [query, setQuery] = useState('')
    const [selectedId, setSelectedId] = useState(null)

    const [asal, setAsal] = useState(init?.asal ?? null)
    const [tujuan, setTujuan] = useState(init?.tujuan ?? null)
    const [pick, setPick] = useState(init ? null : 'asal')
    const [planIdx, setPlanIdx] = useState(null)
    const [autoPlan, setAutoPlan] = useState(!!init) // buka rute tercepat otomatis, sekali saja
    const [geoMsg, setGeoMsg] = useState('')

    const mapEl = useRef(null)
    const map = useRef(null)
    const groups = useRef({})
    const layers = useRef({})
    const live = useRef({})
    live.current = { tab, pick, tujuan }

    /* ── Muat GeoJSON lewat routeData.js (di-cache, dipakai juga oleh HomePage) ── */
    useEffect(() => {
        let off = false
        loadRoutes()
            .then((d) => { if (!off) { setData(d); setStatus('ready') } })
            .catch((e) => { if (!off) { setError(e.message); setStatus('error') } })
        return () => { off = true }
    }, [])

    // Petunjuk Arah memakai BisKita + angkot sekaligus supaya bisa transit antar moda.
    // Tab Trayek tetap per moda sesuai pilihan.
    const allRoutes = useMemo(() => [...data.biskita, ...data.angkot], [data])
    const routes = tab === 'petunjuk' ? allRoutes : mode === 'biskita' ? data.biskita : data.angkot
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return routes
        return routes.filter((r) => `${r.ref} ${r.from} ${r.to} ${r.via || ''} ${r.name}`.toLowerCase().includes(q))
    }, [routes, query])

    const selected = tab === 'trayek' ? routes.find((r) => r.id === selectedId) || null : null
    const graph = useMemo(() => buildGraph(allRoutes), [allRoutes])

    // Diagnosa (hanya saat dev): bagian angkot yang terdeteksi satu arah / loop
    useEffect(() => {
        if (import.meta.env.DEV && graph.loops.length) {
            console.info(
                '[TransGIS] bagian satu arah (loop) terdeteksi:',
                graph.loops.map((l) => `${l.ref}: km ${l.fromKm.toFixed(1)}–${l.toKm.toFixed(1)}`),
            )
        }
    }, [graph])
    const plans = useMemo(() => (asal && tujuan ? planTrips(graph, asal, tujuan) : []), [graph, asal, tujuan])
    const plan = tab === 'petunjuk' && planIdx != null ? plans[planIdx] || null : null

    // Datang dari landing page: setelah data rute siap, langsung tampilkan rute tercepat
    useEffect(() => {
        if (!autoPlan || status !== 'ready') return
        if (plans.length) setPlanIdx(0)
        setAutoPlan(false)
    }, [autoPlan, status, plans])

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
        m.closePopup()
        layers.current = {}
        const all = []
        routes.forEach((r) => {
            layers.current[r.id] = r.parts.map((part) => {
                all.push(...part.pts)
                return L.polyline(part.pts, { color: r.color, weight: 4, opacity: 0.85, lineCap: 'round', lineJoin: 'round' })
                    .bindTooltip(tipHtml(r), { sticky: true, direction: 'top', opacity: 1, className: 'tg-tip' })
                    .on('click', (e) => {
                        const { tab: t, pick: p } = live.current
                        if (t === 'trayek') setSelectedId(r.id)
                        if (t === 'petunjuk' && p) return // sedang memilih titik asal/tujuan
                        openRoutePopup(m, r, e.latlng)
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

    /* ── Gambar rute perjalanan terpilih (bisa multi-leg / transit) ── */
    useEffect(() => {
        const m = map.current
        const pg = groups.current.plan
        if (!m || !pg) return
        pg.clearLayers()
        if (!plan) return
        const walk = { color: '#1B3A8C', weight: 4, dashArray: '2 9', lineCap: 'round' }
        const all = [asal, tujuan]
        plan.legs.forEach((l) => {
            L.polyline([l.walk.from, l.walk.to], walk).addTo(pg)
            const ride = l.ridePts
            all.push(...ride)
            L.polyline(ride, { color: '#fff', weight: 11, opacity: 0.9 }).addTo(pg)
            L.polyline(ride, { color: l.route.color, weight: 7 }).addTo(pg)
                ;[ride[0], ride[ride.length - 1]].forEach((p) =>
                    L.circleMarker(p, { radius: 6, color: l.route.color, weight: 3, fillColor: '#fff', fillOpacity: 1 }).addTo(pg),
                )
        })
        L.polyline([plan.endWalk.from, plan.endWalk.to], walk).addTo(pg)
        m.fitBounds(L.latLngBounds(all), { padding: [60, 60] })
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

    const legend = tab === 'petunjuk' ? [...data.biskita.slice(0, 2), ...data.angkot.slice(0, 4)] : routes.slice(0, 6)

    /* ── Tampilan ── */
    return (
        <section className="flex flex-col lg:flex-row h-[100dvh] lg:h-[calc(100vh-4rem)] lg:min-h-[640px]">
            <style>{POPUP_CSS}</style>
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
                    {tab === 'trayek' ? (
                        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                            {[['biskita', 'Bis Kita', 'bus'], ['angkot', 'Angkot Bogor', 'car']].map(([k, l, ic]) => (
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
                    ) : (
                        <p className="flex items-center gap-2 pb-1.5 text-xs text-blue-100">
                            <Icon name="bus" className="w-4 h-4 text-[#F97316]" />
                            <Icon name="car" className="w-4 h-4 text-[#F97316]" />
                            Rute menggabungkan Bis Kita dan angkot
                        </p>
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
                                            Tidak ditemukan rute Bis Kita atau angkot (termasuk transit) dalam jarak jalan {MAX_WALK_KM} km. Geser penanda asal atau tujuan.
                                        </p>
                                    ) : (
                                        plans.map((p, i) => (
                                            <button
                                                key={p.sig}
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
                                                    Naik pukul <b className="text-white">{hhmm(p.depart)}</b> dari jalur {p.legs[0].route.ref} ({p.legs[0].route.from}{p.legs[0].route.to && ' → ' + p.legs[0].route.to})
                                                    {p.transfers > 0 && <> • lanjut {p.legs.slice(1).map((l) => l.route.ref).join(', ')}</>}
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