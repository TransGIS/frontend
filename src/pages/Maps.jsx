import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { buildGraph, planTrips, topPlans, MAX_WALK_KM, dist } from '../lib/routing'
import { loadRoutes, trackPageView, fetchWalkRoute } from '../lib/routeData'
import { readOD, searchPlaces } from '../lib/geocode'
import PlaceInput from '../components/PlaceInput'
import RouteStopModal from '../components/RouteStopModal'

/* ────────────────────────────────────────────────────────────
   Konfigurasi
   Pemuatan data rute dari API backend ada di src/lib/routeData.js
   Geometri jarak & dijkstra ada di src/lib/routing.js
   ──────────────────────────────────────────────────────────── */
const CENTER = [-6.5971, 106.806]
// Selaras dengan VIEWBOX pencarian: mencakup Kota & Kabupaten Bogor.
const BOGOR_BOUNDS = L.latLngBounds([[-6.80, 106.60], [-6.40, 107.00]])
const CHIP_COLOR = { biskita: '#F97316', angkot: '#0D9F6E' }

// Kunci geometri jalan kaki = pasangan titik ujung segmen (bukan sig rute),
// agar tidak memakai geometri lama saat penanda asal/tujuan digeser.
const walkKey = (w) => `${w.from[0].toFixed(5)},${w.from[1].toFixed(5)}>${w.to[0].toFixed(5)},${w.to[1].toFixed(5)}`

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
const SectionLabel = ({ children, htmlFor }) => {
    const className = 'mb-2 block text-xs font-extrabold text-[#12233F]'
    return htmlFor
        ? <label htmlFor={htmlFor} className={className}>{children}</label>
        : <p className={className}>{children}</p>
}

function Badge({ route }) {
    return (
        <span
            className="flex h-10 min-w-10 shrink-0 items-center justify-center border-2 border-[#12233F] px-1.5 text-xs font-extrabold text-white"
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
            className="press-pixel press-pixel-sm group w-full border-2 border-[#12233F] bg-white p-4 text-left shadow-[3px_3px_0_#12233F] hover:bg-[#FDFBF3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
        >
            <div className="flex items-start gap-3">
                <Badge route={route} />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold leading-snug text-[#12233F] group-hover:text-[#1B3A8C]">
                        {route.from}
                        {route.to && <span className="font-normal text-gray-400"> → </span>}
                        {route.to}
                    </p>
                    {route.via && <p className="mt-1 text-xs leading-relaxed text-gray-500">Via {route.via}</p>}
                </div>
                <span className="shrink-0 border border-[#12233F]/20 bg-[#F7F4EA] px-2 py-1 text-[11px] font-extrabold text-[#12233F]">{route.fare}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#12233F]/10 pt-2.5 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><Icon name="clock" className="h-3.5 w-3.5 text-[#1B3A8C]" />Estimasi ~{route.minutes} mnt</span>
                {route.kind === 'biskita' && <span className="font-semibold text-[#1B3A8C]">Tarif flat</span>}
            </div>
        </button>
    )
}

function BackButton({ onClick }) {
    return (
        <button type="button" onClick={onClick} className="mb-4 flex items-center gap-2 text-sm font-extrabold text-[#1B3A8C] transition-colors hover:text-[#F97316] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]">
            <Icon name="back" className="h-5 w-5" /> Kembali
        </button>
    )
}

function Timeline({ items }) {
    return (
        <ol className="relative pl-7">
            <span className="absolute bottom-4 left-[9px] top-4 w-0.5 bg-[#94A3B8]" />
            {items.map((s, i) => {
                const first = i === 0
                const last = i === items.length - 1
                return (
                    <li key={`${s.name}-${i}`} className="relative mb-3 last:mb-0">
                        <span
                            className={`absolute -left-7 top-4 h-5 w-5 rounded-full border-[3px] ${first ? 'border-white bg-[#F97316]' : last ? 'border-white bg-[#16A34A]' : 'border-[#F97316] bg-[#1B3A8C]'}`}
                        />
                        <div className="border-2 border-[#12233F]/15 bg-white px-3.5 py-3">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-bold text-[#12233F]">{s.name}</p>
                                {(first || last || s.tag) && (
                                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-extrabold text-white ${first ? 'bg-[#F97316]' : last ? 'bg-[#16A34A]' : 'bg-[#1B3A8C]'}`}>
                                        {first ? 'Titik awal' : last ? 'Tujuan akhir' : s.tag}
                                    </span>
                                )}
                            </div>
                            {s.sub && <p className="mt-1 text-xs leading-relaxed text-gray-500">{s.sub}</p>}
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
            <div className="mb-5 border-2 border-t-4 bg-white p-4 text-[#12233F] shadow-[4px_4px_0_#12233F]" style={{ borderColor: '#12233F', borderTopColor: route.color }}>
                <div className="flex items-start gap-3">
                    <Badge route={route} />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold leading-snug">{route.from}{route.to && ' → '}{route.to}</p>
                        {route.via && <p className="mt-1 text-xs text-gray-500">Via {route.via}</p>}
                    </div>
                    <span className="shrink-0 border border-[#12233F]/20 bg-[#F7F4EA] px-2 py-1 text-[11px] font-extrabold">{route.fare}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#12233F]/10 pt-2.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><Icon name="clock" className="h-3.5 w-3.5 text-[#1B3A8C]" />~{route.minutes} mnt • {fmtKm(route.km)}</span>
                    {route.kind === 'biskita' && <span className="font-semibold text-[#1B3A8C]">Tarif flat</span>}
                </div>
            </div>
            <SectionLabel>Daftar halte &amp; kedatangan</SectionLabel>
            <Timeline items={items} />
            {!route.stops.length && (
                <p className="mt-4 border-l-4 border-[#F97316] bg-white px-3 py-2 text-xs leading-relaxed text-gray-600">
                    Data halte untuk trayek angkot belum ada di database, jadi hanya titik awal dan akhir yang ditampilkan.
                </p>
            )}
        </>
    )
}

function PlanChips({ plan, onOpenRoute }) {
    const walk = (m, key) => (
        <span key={key} className="inline-flex items-center gap-1 border border-[#12233F]/20 bg-[#F7F4EA] px-2 py-1 text-xs font-bold text-[#12233F]">
            <Icon name="walk" className="h-3.5 w-3.5 text-[#1B3A8C]" />{Math.max(1, Math.round(m))}&apos;
        </span>
    )
    const sep = (key) => <span key={key} className="font-bold text-[#F97316]">›</span>
    const out = []
    plan.legs.forEach((l, i) => {
        if (i === 0 || l.walk.min >= 1) out.push(walk(l.walk.min, `w${i}`), sep(`a${i}`))
        const chipClass = 'inline-flex items-center gap-1 border border-[#12233F] px-2 py-1 text-xs font-extrabold text-white'
        const chipStyle = { background: CHIP_COLOR[l.route.kind] }
        const chipInner = <>
            <Icon name={l.route.kind === 'biskita' ? 'bus' : 'car'} className="h-3.5 w-3.5" />{l.route.ref} {l.route.kind === 'biskita' ? 'BisKita' : 'Angkot'}
        </>
        out.push(
            onOpenRoute ? (
                <button
                    key={`c${i}`}
                    type="button"
                    onClick={() => onOpenRoute(l.route)}
                    aria-label={`Lihat jalur dan halte ${l.route.ref}`}
                    className={`press-pixel press-pixel-xs ${chipClass} hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]`}
                    style={chipStyle}
                >
                    {chipInner}
                </button>
            ) : (
                <span key={`c${i}`} className={chipClass} style={chipStyle}>{chipInner}</span>
            ),
            sep(`b${i}`),
        )
    })
    out.push(walk(plan.endWalk.min, 'wend'))
    return <div className="flex flex-wrap items-center gap-1.5">{out}</div>
}

function PlanSummary({ plan }) {
    return (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-pixel text-4xl font-semibold leading-none text-[#1B3A8C]">{Math.round(plan.total)}</span>
            <span className="text-sm font-extrabold text-[#12233F]">mnt</span>
            <span className="text-xs text-gray-500">
                • Tiba {hhmm(plan.arrive)} • {plan.transfers ? `${plan.transfers}x transit` : 'Langsung'}
            </span>
        </div>
    )
}

function PlanDetail({ plan, onBack, onOpenRoute }) {
    const steps = []
    plan.legs.forEach((l, i) => {
        const r = l.route
        const isBus = r.kind === 'biskita'
        steps.push({
            icon: 'walk', bg: 'bg-[#F7F4EA] text-[#1B3A8C]', label: i === 0 ? 'Jalan kaki' : 'Transit',
            title: l.boardStop ? `Jalan ke halte ${l.boardStop}` : i === 0 ? `Jalan ke jalur ${r.ref}` : `Pindah ke jalur ${r.ref}`,
            sub: `Jarak ~${fmtKm(l.walk.km)} • Tiba sebelum ${hhmm(l.boardAt)}`,
            time: `${Math.max(1, Math.round(l.walk.min))} mnt`,
        })
        steps.push({
            icon: isBus ? 'bus' : 'car', bg: 'text-white', color: CHIP_COLOR[r.kind], label: isBus ? 'Naik bus' : 'Naik angkot',
            chip: r.ref, title: `Arah ${l.reversed ? r.from : (l.part.dir || r.to || r.from)}`,
            sub: `${l.alightStop ? `Turun di halte ${l.alightStop} • ` : ''}Perjalanan ~${fmtKm(l.km)} • ${Math.round(l.rideMin)} mnt • Tarif ${r.fare}`,
            time: hhmm(l.boardAt),
            route: r,
        })
    })
    const lastStop = plan.legs[plan.legs.length - 1].alightStop
    steps.push({
        icon: 'walk', bg: 'bg-[#F7F4EA] text-[#1B3A8C]', label: 'Jalan kaki',
        title: lastStop ? `Turun di halte ${lastStop}, lalu jalan ke tujuan` : 'Turun, lalu jalan ke tujuan',
        sub: `Jarak ~${fmtKm(plan.endWalk.km)}`,
        time: `Tiba ${hhmm(plan.arrive)}`,
    })
    return (
        <>
            <BackButton onClick={onBack} />
            <div className="border-2 border-[#12233F] bg-white p-4 shadow-[4px_4px_0_#12233F]">
                <PlanSummary plan={plan} />
                <div className="mb-3 mt-4"><PlanChips plan={plan} onOpenRoute={onOpenRoute} /></div>
                <p className="border-t-2 border-[#12233F]/10 pt-3 text-xs font-semibold text-gray-600">Total tarif <span className="font-extrabold text-[#12233F]">~{fmtFare(plan.fare)}</span></p>
            </div>
            <ol className="relative mt-6">
                <span className="absolute bottom-6 left-[15px] top-6 w-0.5 bg-[#94A3B8]" />
                {steps.map((s, i) => (
                    <li key={i} className="relative flex gap-3 pb-6 last:pb-0">
                        <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center border-2 border-[#12233F] ${s.bg}`} style={s.color ? { background: s.color } : undefined}>
                            <Icon name={s.icon} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1 border-b-2 border-[#12233F]/10 pb-5">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-[11px] font-extrabold text-gray-500">Langkah {i + 1} • {s.label}</p>
                                <span className="shrink-0 border border-[#12233F]/20 bg-white px-2 py-0.5 text-[11px] font-bold text-[#12233F]">{s.time}</span>
                            </div>
                            <p className="mt-1.5 text-sm font-bold leading-relaxed text-[#12233F]">
                                {s.chip && (s.route && onOpenRoute ? (
                                    <button
                                        type="button"
                                        onClick={() => onOpenRoute(s.route)}
                                        aria-label={`Lihat jalur dan halte ${s.route.ref}`}
                                        className="press-pixel press-pixel-xs mr-1.5 inline-block border border-[#12233F] px-1.5 py-0.5 text-[11px] font-extrabold text-white hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                                        style={{ background: s.color }}
                                    >
                                        {s.chip}
                                    </button>
                                ) : (
                                    <span className="mr-1.5 inline-block border border-[#12233F] px-1.5 py-0.5 text-[11px] font-extrabold text-white" style={{ background: s.color }}>{s.chip}</span>
                                ))}
                                {s.title}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-gray-500">{s.sub}</p>
                            {s.route && onOpenRoute && (
                                <button
                                    type="button"
                                    onClick={() => onOpenRoute(s.route)}
                                    aria-label={`Lihat jalur dan halte ${s.route.ref}`}
                                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-[#1B3A8C] transition-colors hover:text-[#F97316] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                                >
                                    Lihat jalur &amp; halte <span aria-hidden="true">›</span>
                                </button>
                            )}
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
.maps-page{font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif}
.maps-page .leaflet-control-zoom{border:2px solid #12233F;border-radius:0;box-shadow:3px 3px 0 #12233F}
.maps-page .leaflet-control-zoom a{border-radius:0;color:#12233F;border-bottom:2px solid #12233F;font-family:'Plus Jakarta Sans',sans-serif}
.maps-page .leaflet-control-zoom a:last-child{border-bottom:0}
.maps-page .leaflet-control-zoom a:hover{background:#EAF0FF;color:#1B3A8C}
.maps-page .leaflet-control-attribution{background:rgba(247,244,234,.9);color:#4B5563;font-size:9px}
.tg-tip.leaflet-tooltip{display:flex;align-items:center;gap:8px;padding:7px 10px;border:2px solid #12233F;border-radius:0;background:#F7F4EA;color:#12233F;font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;box-shadow:3px 3px 0 #12233F}
.tg-tip.leaflet-tooltip::before{display:none}
.tg-tip .tg-dot{width:10px;height:10px;flex:none}
.tg-tip b{font-weight:800}
.tg-popup .leaflet-popup-content-wrapper{padding:0;border:2px solid #12233F;border-radius:0;overflow:hidden;box-shadow:5px 5px 0 #12233F}
.tg-popup .leaflet-popup-content{margin:0;width:280px!important;font-family:'Plus Jakarta Sans',sans-serif}
.tg-popup .leaflet-popup-tip{border:2px solid #12233F;box-shadow:none}
.tg-popup a.leaflet-popup-close-button{top:10px;right:9px;width:26px;height:26px;padding:0;border:2px solid transparent;font-size:21px;line-height:20px;text-align:center;color:#12233F}
.tg-popup a.leaflet-popup-close-button:hover{border-color:#12233F;background:#fff;color:#F97316}
.tg-card{color:#12233F;background:#F7F4EA}
.tg-bar{height:6px;background:var(--c);border-bottom:2px solid #12233F}
.tg-head{display:flex;gap:10px;align-items:flex-start;padding:13px 38px 13px 14px}
.tg-badge{flex:none;min-width:40px;height:40px;padding:0 6px;border:2px solid #12233F;background:var(--c);color:#fff;font:800 13px/36px 'Plus Jakarta Sans',sans-serif;text-align:center}
.tg-kind{font-size:11px;font-weight:700;color:#6B7280}
.tg-title{font-size:14px;font-weight:800;line-height:1.35}
.tg-title span{color:#F97316;font-weight:700}
.tg-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;background:#12233F;border-top:2px solid #12233F;border-bottom:2px solid #12233F}
.tg-stats div{display:flex;flex-direction:column;gap:2px;padding:9px 10px;background:#fff}
.tg-stats b{font-size:12px;font-weight:800}
.tg-stats span{font-size:10px;color:#6B7280}
.tg-pass{padding:14px}
.tg-list{list-style:none;margin:0;padding:0;max-height:190px;overflow-y:auto}
.tg-stop{position:relative;padding:0 0 12px 20px;font-size:12px;line-height:1.35}
.tg-stop:last-child{padding-bottom:0}
.tg-stop::before{content:'';position:absolute;left:4px;top:12px;bottom:-2px;width:2px;background:var(--c);opacity:.4}
.tg-stop:last-child::before{display:none}
.tg-stop i{position:absolute;left:0;top:3px;width:10px;height:10px;box-sizing:border-box;background:#fff;border:2px solid var(--c)}
.tg-stop.tg-end i{background:var(--c)}
.tg-stop b{display:block;font-weight:700}
.tg-stop small{display:block;color:#6B7280;font-size:11px}
@media(prefers-reduced-motion:reduce){.maps-page *{scroll-behavior:auto!important;transition-duration:.01ms!important}}
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
    const [panelOpen, setPanelOpen] = useState(true)
    const [legendOpen, setLegendOpen] = useState(false)
    const [detailRoute, setDetailRoute] = useState(null) // rute untuk modal "Jalur & halte"

    const [asal, setAsal] = useState(init?.asal ?? null)
    const [tujuan, setTujuan] = useState(init?.tujuan ?? null)
    // Teks & place terpilih untuk input ketikan (sinkron dengan koordinat di atas)
    const [asalText, setAsalText] = useState(init ? `Titik di peta (${init.asal[0].toFixed(4)}, ${init.asal[1].toFixed(4)})` : '')
    const [asalPlace, setAsalPlace] = useState(init ? { id: 'asal-init', name: 'Titik di peta', lat: init.asal[0], lng: init.asal[1] } : null)
    const [tujuanText, setTujuanText] = useState(init ? `Titik di peta (${init.tujuan[0].toFixed(4)}, ${init.tujuan[1].toFixed(4)})` : '')
    const [tujuanPlace, setTujuanPlace] = useState(init ? { id: 'tujuan-init', name: 'Titik di peta', lat: init.tujuan[0], lng: init.tujuan[1] } : null)
    const [pick, setPick] = useState(init ? null : 'asal')
    const [planIdx, setPlanIdx] = useState(null)
    const [walkGeo, setWalkGeo] = useState({}) // geometri jalan kaki asli per segmen (kunci: walkKey)
    const [autoPlan, setAutoPlan] = useState(!!init) // buka rute tercepat otomatis, sekali saja
    const [geoMsg, setGeoMsg] = useState('')

    const mapEl = useRef(null)
    const map = useRef(null)
    const groups = useRef({})
    const layers = useRef({})
    const live = useRef({})
    live.current = { tab, pick, tujuan }

    /* ── Sinkronisasi asal/tujuan: ketikan, klik peta, geser penanda, GPS ── */
    const setPoint = (which, ll, label = 'Titik di peta') => {
        const text = `${label} (${ll[0].toFixed(4)}, ${ll[1].toFixed(4)})`
        const place = { id: `${which}-peta`, name: label, lat: ll[0], lng: ll[1] }
        if (which === 'asal') { setAsal(ll); setAsalText(text); setAsalPlace(place) }
        else { setTujuan(ll); setTujuanText(text); setTujuanPlace(place) }
    }
    const applyPlace = (which, p) => {
        const ll = [p.lat, p.lng]
        if (which === 'asal') { setAsal(ll); setAsalText(p.name); setAsalPlace(p); setPick(tujuan ? null : 'tujuan') }
        else { setTujuan(ll); setTujuanText(p.name); setTujuanPlace(p); setPick(null) }
        setPlanIdx(null)
        map.current?.flyTo(ll, 15)
    }
    const clearPoint = (which) => {
        if (which === 'asal') { setAsal(null); setAsalText(''); setAsalPlace(null); setPick('asal') }
        else { setTujuan(null); setTujuanText(''); setTujuanPlace(null); setPick('tujuan') }
        setPlanIdx(null)
    }
    // Enter tanpa memilih saran: cari hasil pertama lalu terapkan
    const resolveText = async (which) => {
        const text = (which === 'asal' ? asalText : tujuanText).trim()
        if (!text) return
        setGeoMsg('')
        try {
            const p = (await searchPlaces(text, undefined, 1))[0]
            if (!p) return setGeoMsg(`Lokasi “${text}” tidak ditemukan di sekitar Bogor.`)
            applyPlace(which, p)
        } catch {
            setGeoMsg('Pencarian lokasi gagal. Periksa koneksi lalu coba lagi.')
        }
    }

    /* ── Muat GeoJSON lewat routeData.js (di-cache, dipakai juga oleh HomePage) ── */
    useEffect(() => {
        let off = false
        trackPageView()
        loadRoutes()
            .then((d) => { if (!off) { setData(d); setStatus('ready') } })
            .catch((e) => { if (!off) { setError(e.message); setStatus('error') } })
        return () => { off = true }
    }, [])

    // Escape menutup dialog teratas lebih dulu, baru sidebar overlay.
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key !== 'Escape') return
            if (detailRoute) setDetailRoute(null)
            else if (legendOpen) setLegendOpen(false)
            else setPanelOpen(false)
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [detailRoute, legendOpen])

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
    const plans = useMemo(() => (asal && tujuan ? topPlans(planTrips(graph, asal, tujuan)) : []), [graph, asal, tujuan])
    const plan = tab === 'petunjuk' && planIdx != null ? plans[planIdx] || null : null

    /* ── Jalur jalan kaki mengikuti jalan asli (Valhalla/OSRM pejalan kaki via backend) ── */
    useEffect(() => {
        if (!plan) return
        let off = false
        const jobs = plan.legs.map((l) => l.walk).concat([plan.endWalk])
        jobs.forEach((w) => {
            if (dist(w.from, w.to) < 0.05) return // sangat dekat: garis lurus sudah cukup
            fetchWalkRoute(w.from, w.to).then((pts) => {
                if (!off && pts) setWalkGeo((prev) => ({ ...prev, [walkKey(w)]: pts }))
            })
        })
        return () => { off = true }
    }, [plan])

    // Datang dari landing page: setelah data rute siap, langsung tampilkan rute tercepat
    useEffect(() => {
        if (!autoPlan || status !== 'ready') return
        if (plans.length) setPlanIdx(0)
        setAutoPlan(false)
    }, [autoPlan, status, plans])

    /* ── Inisialisasi peta (sekali) ── */
    useEffect(() => {
        const m = L.map(mapEl.current, {
            center: CENTER,
            zoom: 12,
            minZoom: 10,
            maxBounds: BOGOR_BOUNDS,
            maxBoundsViscosity: 1.0,
            zoomControl: false,
            preferCanvas: true,
        })
        const limitZoomToBogor = () => {
            const minZoom = m.getBoundsZoom(BOGOR_BOUNDS, true)
            m.options.minZoom = minZoom
            if (m.getZoom() < minZoom) m.setZoom(minZoom)
        }
        limitZoomToBogor()
        m.on('resize', limitZoomToBogor)
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
                setPoint('asal', ll)
                setPick(tj ? null : 'tujuan')
            } else {
                setPoint('tujuan', ll)
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
        const add = (pos, color, text, which) =>
            L.marker(pos, { icon: pinIcon(color, text), draggable: true })
                .on('dragend', (e) => {
                    const { lat, lng } = e.target.getLatLng()
                    setPoint(which, [lat, lng])
                    setPlanIdx(null)
                })
                .addTo(og)
        if (tab !== 'petunjuk') return
        if (asal) add(asal, '#16A34A', 'A', 'asal')
        if (tujuan) add(tujuan, '#F97316', 'B', 'tujuan')
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
            const wpts = walkGeo[walkKey(l.walk)] || [l.walk.from, l.walk.to]
            all.push(...wpts)
            L.polyline(wpts, walk).addTo(pg)
            const ride = l.ridePts
            all.push(...ride)
            L.polyline(ride, { color: '#fff', weight: 11, opacity: 0.9 }).addTo(pg)
            L.polyline(ride, { color: l.route.color, weight: 7 }).addTo(pg)
                ;[ride[0], ride[ride.length - 1]].forEach((p) =>
                    L.circleMarker(p, { radius: 6, color: l.route.color, weight: 3, fillColor: '#fff', fillOpacity: 1 }).addTo(pg),
                )
        })
        const endPts = walkGeo[walkKey(plan.endWalk)] || [plan.endWalk.from, plan.endWalk.to]
        all.push(...endPts)
        L.polyline(endPts, walk).addTo(pg)
        m.fitBounds(L.latLngBounds(all), { padding: [60, 60] })
    }, [plan, asal, tujuan, walkGeo])

    /* ── Aksi ── */
    const switchTab = (t) => {
        setTab(t)
        setSelectedId(null)
        setPlanIdx(null)
        setLegendOpen(false)
        if (t === 'petunjuk' && !asal) setPick('asal')
    }
    const switchMode = (md) => {
        setMode(md)
        setSelectedId(null)
        setPlanIdx(null)
        setQuery('')
        setLegendOpen(false)
    }

    const useMyLocation = () => {
        setGeoMsg('')
        if (!navigator.geolocation) return setGeoMsg('Browser kamu tidak mendukung lokasi.')
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const ll = [pos.coords.latitude, pos.coords.longitude]
                setPoint('asal', ll, 'Lokasi Anda')
                setPick(tujuan ? null : 'tujuan')
                setPlanIdx(null)
                map.current?.flyTo(ll, 15)
            },
            () => setGeoMsg('Lokasi tidak bisa diakses. Izinkan akses lokasi atau klik peta untuk memilih asal.'),
            { enableHighAccuracy: true, timeout: 10000 },
        )
    }

    const legend = tab === 'petunjuk' ? [...data.biskita.slice(0, 2), ...data.angkot.slice(0, 4)] : routes.slice(0, 6)

    /* ── Tampilan ── */
    return (
        <section className="maps-page relative h-[calc(100dvh-5rem)] min-h-[420px] overflow-hidden bg-[#F7F4EA] text-[#12233F] lg:grid lg:min-h-[640px] lg:grid-cols-[390px_minmax(0,1fr)] xl:grid-cols-[430px_minmax(0,1fr)]">
            <style>{POPUP_CSS}</style>
            {panelOpen && (
                <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Tutup sidebar peta"
                    onClick={() => setPanelOpen(false)}
                    className="fixed inset-x-0 bottom-0 top-20 z-[1150] bg-[#12233F]/45 lg:hidden"
                />
            )}
            <aside
                id="maps-sidebar"
                aria-label="Panel pencarian dan rute"
                className={`fixed bottom-0 left-0 top-20 z-[1200] flex w-[88vw] max-w-[400px] min-w-0 flex-col border-r-2 border-[#12233F] bg-[#F7F4EA] transition-transform duration-300 lg:static lg:z-auto lg:order-1 lg:h-full lg:w-full lg:max-w-none lg:min-h-0 lg:translate-x-0 lg:shadow-none ${panelOpen ? 'visible translate-x-0 shadow-[6px_0_0_rgba(18,35,63,0.3)]' : 'invisible -translate-x-full'} lg:visible`}
            >
                <div className="shrink-0 border-b-2 border-[#12233F] bg-white px-4 py-4 sm:px-5">
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <h1 className="font-pixel text-2xl font-semibold leading-none text-[#1B3A8C] sm:text-3xl">Peta Perjalanan</h1>
                            <p className="mt-1.5 text-xs text-gray-500">Temukan trayek dan rute transit di Bogor.</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <span className="hidden border-2 border-[#12233F] bg-[#F97316] px-2.5 py-1 font-pixel text-lg leading-none text-[#12233F] shadow-[2px_2px_0_#12233F] sm:block">Bogor</span>
                            <button
                                type="button"
                                onClick={() => setPanelOpen(false)}
                                aria-label="Tutup sidebar"
                                className="press-pixel press-pixel-xs border-2 border-[#12233F] bg-white p-2 text-[#12233F] hover:bg-[#F97316] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] lg:hidden"
                            >
                                <Icon name="close" className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Jenis pencarian peta">
                        {[['petunjuk', 'Petunjuk Arah'], ['trayek', 'Cari Trayek']].map(([k, l]) => (
                            <button
                                key={k}
                                id={`maps-tab-${k}`}
                                type="button"
                                role="tab"
                                aria-selected={tab === k}
                                aria-controls="maps-content"
                                onClick={() => switchTab(k)}
                                className={`press-pixel press-pixel-xs press-pixel-orange min-h-11 border-2 border-[#12233F] px-3 py-2.5 text-sm font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F97316] ${tab === k ? 'bg-[#1B3A8C] text-white shadow-[2px_2px_0_#F97316]' : 'bg-white text-gray-600 hover:bg-[#EAF0FF] hover:text-[#1B3A8C]'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>

                    {tab === 'trayek' ? (
                        <div className="mt-4 grid grid-cols-2 gap-2" aria-label="Pilih moda transportasi">
                            {[['biskita', 'BisKita', 'bus'], ['angkot', 'Angkot', 'car']].map(([k, l, ic]) => (
                                <button
                                    key={k}
                                    type="button"
                                    aria-pressed={mode === k}
                                    onClick={() => switchMode(k)}
                                    className={`press-pixel press-pixel-sm press-pixel-orange flex min-h-11 items-center justify-center gap-2 border-2 px-3 py-2.5 text-sm font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] ${mode === k ? 'border-[#12233F] bg-[#1B3A8C] text-white shadow-[3px_3px_0_#F97316]' : 'border-[#12233F]/25 bg-white text-gray-600 hover:border-[#1B3A8C] hover:text-[#1B3A8C]'}`}
                                >
                                    <Icon name={ic} className="h-5 w-5 shrink-0" />{l}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-4 flex flex-wrap items-center gap-2 border-l-4 border-[#F97316] bg-[#F7F4EA] px-3 py-2 text-xs font-semibold text-gray-600">
                            <span className="flex items-center gap-1 text-[#1B3A8C]"><Icon name="bus" className="h-4 w-4" /><Icon name="car" className="h-4 w-4" /></span>
                            Rute dapat menggabungkan BisKita dan angkot.
                        </p>
                    )}
                </div>

                <div
                    id="maps-content"
                    role="tabpanel"
                    aria-labelledby={`maps-tab-${tab}`}
                    className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-5"
                >
                    {status === 'loading' && (
                        <div className="border-2 border-[#12233F] bg-white p-4 text-sm font-semibold shadow-[3px_3px_0_#12233F]">Memuat data rute…</div>
                    )}
                    {status === 'error' && (
                        <div className="border-2 border-red-800 bg-red-50 p-4 text-sm leading-relaxed text-red-800 shadow-[3px_3px_0_#7F1D1D]">
                            Data rute gagal dimuat: {error}. Pastikan backend API berjalan (VITE_API_URL) dan data rute sudah di-seed.
                        </div>
                    )}

                    {status === 'ready' && tab === 'trayek' && (
                        selected ? (
                            <RouteDetail route={selected} onBack={() => setSelectedId(null)} />
                        ) : (
                            <>
                                <SectionLabel htmlFor="maps-route-query">Cari koridor atau nomor trayek</SectionLabel>
                                <div className="mb-5 flex min-h-[50px] items-center gap-2.5 border-2 border-[#12233F]/25 bg-white px-3.5 shadow-[3px_3px_0_#12233F] transition-colors focus-within:border-[#1B3A8C] focus-within:ring-2 focus-within:ring-[#1B3A8C]/15">
                                    <span className="text-[#F97316]"><Icon name="pin" /></span>
                                    <input
                                        id="maps-route-query"
                                        type="search"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={mode === 'biskita' ? 'Contoh: K1 atau Bubulak' : 'Contoh: 02, 03, atau 10'}
                                        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#12233F] outline-none placeholder:font-normal placeholder:text-gray-400"
                                    />
                                    <span className="text-gray-400"><Icon name="sliders" /></span>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {filtered.map((r) => <RouteCard key={r.id} route={r} onClick={() => setSelectedId(r.id)} />)}
                                    {!filtered.length && (
                                        <p className="border-2 border-dashed border-[#12233F]/30 bg-white p-4 text-sm leading-relaxed text-gray-600">Tidak ada trayek yang cocok dengan “{query}”. Coba nomor atau nama lokasi lain.</p>
                                    )}
                                </div>
                            </>
                        )
                    )}

                    {status === 'ready' && tab === 'petunjuk' && (
                        plan ? (
                            <PlanDetail plan={plan} onBack={() => setPlanIdx(null)} onOpenRoute={setDetailRoute} />
                        ) : (
                            <>
                                <div className="border-2 border-[#12233F] bg-white p-4 shadow-[4px_4px_0_#12233F]">
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                                        <div>
                                            <SectionLabel htmlFor="maps-asal">Dari mana?</SectionLabel>
                                            <PlaceInput
                                                id="maps-asal"
                                                value={asalText}
                                                selected={asalPlace}
                                                onChange={(t) => { setAsalText(t); setAsalPlace(null) }}
                                                onSelect={(p) => applyPlace('asal', p)}
                                                onFocus={() => setPick('asal')}
                                                onSubmit={() => resolveText('asal')}
                                                onClear={() => clearPoint('asal')}
                                                pinClass="text-[#16A34A]"
                                                placeholder="Contoh: Stasiun Bogor"
                                                className="[&>div]:rounded-none [&>ul]:rounded-none [&>ul]:border-2 [&>ul]:border-[#12233F]"
                                            />
                                        </div>
                                        <div>
                                            <SectionLabel htmlFor="maps-tujuan">Mau ke mana?</SectionLabel>
                                            <PlaceInput
                                                id="maps-tujuan"
                                                value={tujuanText}
                                                selected={tujuanPlace}
                                                onChange={(t) => { setTujuanText(t); setTujuanPlace(null) }}
                                                onSelect={(p) => applyPlace('tujuan', p)}
                                                onFocus={() => setPick('tujuan')}
                                                onSubmit={() => resolveText('tujuan')}
                                                onClear={() => clearPoint('tujuan')}
                                                placeholder="Contoh: Kebun Raya"
                                                className="[&>div]:rounded-none [&>ul]:rounded-none [&>ul]:border-2 [&>ul]:border-[#12233F]"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={useMyLocation}
                                            className="press-pixel press-pixel-sm flex min-h-11 items-center justify-center gap-2 border-2 border-[#12233F] bg-[#F7F4EA] px-3 py-2.5 text-xs font-extrabold text-[#1B3A8C] hover:bg-[#EAF0FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] sm:col-span-2 lg:col-span-1"
                                        >
                                            <span className="text-[#F97316]"><Icon name="locate" /></span>Gunakan lokasi saya sebagai asal
                                        </button>
                                        {geoMsg && <p className="border-l-4 border-[#F97316] bg-orange-50 px-3 py-2 text-xs leading-relaxed text-[#9A3412] sm:col-span-2 lg:col-span-1">{geoMsg}</p>}
                                    </div>
                                </div>

                                <div className="mt-7">
                                    <div className="flex items-end justify-between gap-3">
                                        <h2 className="font-pixel text-3xl font-semibold leading-none text-[#1B3A8C]">Rute rekomendasi</h2>
                                        {plans.length > 0 && <span className="shrink-0 text-xs font-bold text-gray-500">{plans.length} pilihan</span>}
                                    </div>
                                    {!asal || !tujuan ? (
                                        <p className="mt-4 border-2 border-dashed border-[#12233F]/30 bg-white p-4 text-sm leading-relaxed text-gray-600">
                                            {pick === 'tujuan' ? 'Ketik tujuan atau klik titiknya pada peta. Rute rekomendasi akan muncul setelah asal dan tujuan terisi.' : 'Isi asal dan tujuan dengan mengetik lokasi atau mengklik peta. Rute rekomendasi akan muncul di sini.'}
                                        </p>
                                    ) : plans.length === 0 ? (
                                        <p className="mt-4 border-2 border-dashed border-[#12233F]/30 bg-white p-4 text-sm leading-relaxed text-gray-600">
                                            Tidak ditemukan rute BisKita atau angkot, termasuk transit, dalam jarak jalan {MAX_WALK_KM} km. Geser penanda asal atau tujuan lalu coba lagi.
                                        </p>
                                    ) : (
                                        <div className="mt-4 flex flex-col gap-4">
                                            {plans.map((p, i) => (
                                                <button
                                                    key={p.sig}
                                                    type="button"
                                                    onClick={() => setPlanIdx(i)}
                                                    className="press-pixel press-pixel-sm w-full border-2 border-[#12233F] bg-white p-4 text-left shadow-[3px_3px_0_#12233F] hover:bg-[#FDFBF3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                                                >
                                                    {p.tag && (
                                                        <span className="mb-2 inline-flex items-center gap-1 border-2 border-[#12233F] bg-[#F97316] px-2.5 py-1 text-[10px] font-extrabold text-[#12233F]">
                                                            <Icon name="clock" className="h-3 w-3" />{p.tag}
                                                        </span>
                                                    )}
                                                    <PlanSummary plan={p} />
                                                    <div className="my-3"><PlanChips plan={p} /></div>
                                                    <p className="border-t-2 border-[#12233F]/10 pt-3 text-xs leading-relaxed text-gray-600">
                                                        Tarif ~{fmtFare(p.fare)} • Naik pukul <b className="text-[#12233F]">{hhmm(p.depart)}</b> dari jalur {p.legs[0].route.ref} ({p.legs[0].route.from}{p.legs[0].route.to && ' → ' + p.legs[0].route.to})
                                                        {p.transfers > 0 && <> • lanjut {p.legs.slice(1).map((l) => l.route.ref).join(', ')}</>}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )
                    )}
                </div>
            </aside>

            {/* Peta penuh di mobile/tablet; sidebar menjadi overlay. Desktop tetap dua kolom. */}
            <div className="absolute inset-0 isolate w-full lg:relative lg:inset-auto lg:order-2 lg:h-full lg:min-h-0">
                <div ref={mapEl} className="absolute inset-0 bg-[#E8E1CC]" />
                {!panelOpen && (
                    <button
                        type="button"
                        onClick={() => setPanelOpen(true)}
                        aria-expanded={panelOpen}
                        aria-controls="maps-sidebar"
                        className="press-pixel press-pixel-sm absolute left-3 top-3 z-[1100] flex min-h-11 items-center gap-2 border-2 border-[#12233F] bg-[#F7F4EA] px-3 py-2.5 text-xs font-extrabold text-[#1B3A8C] shadow-[3px_3px_0_#12233F] hover:bg-[#EAF0FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] lg:hidden"
                    >
                        <Icon name="sliders" className="h-4 w-4 text-[#F97316]" />Buka panel rute
                    </button>
                )}
                {tab === 'petunjuk' && pick && (
                    <div className="pointer-events-none absolute left-1/2 top-16 z-[1000] w-max max-w-[calc(100%_-_6rem)] -translate-x-1/2 border-2 border-[#12233F] bg-[#F7F4EA] px-3 py-2 text-center text-xs font-extrabold text-[#12233F] shadow-[3px_3px_0_#12233F] lg:top-3">
                        Klik peta untuk memilih {pick === 'asal' ? 'lokasi asal' : 'tujuan'}
                    </div>
                )}
                {legend.length > 0 && (
                    <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[1000] flex justify-center">
                        <div className="pointer-events-auto flex max-h-24 max-w-full flex-wrap items-center gap-x-3 gap-y-1.5 overflow-y-auto border-2 border-[#12233F] bg-[#F7F4EA]/95 px-3 py-2 text-[11px] text-gray-700 shadow-[3px_3px_0_#12233F]">
                            <span className="flex items-center gap-1.5 font-extrabold text-[#12233F]"><Icon name="pin" className="h-3.5 w-3.5 text-[#F97316]" />Legenda</span>
                            {legend.map((r) => (
                                <span key={r.id} className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 shrink-0 border border-[#12233F]/30" style={{ background: r.color }} />
                                    <span className="max-w-[9rem] truncate sm:max-w-[12rem]">{r.ref} ({r.to || r.from})</span>
                                </span>
                            ))}
                            {routes.length > legend.length && (
                                <button
                                    type="button"
                                    onClick={() => setLegendOpen(true)}
                                    aria-haspopup="dialog"
                                    aria-expanded={legendOpen}
                                    aria-controls="maps-legend-dialog"
                                    className="press-pixel press-pixel-xs border border-[#12233F]/25 bg-white px-2 py-0.5 font-extrabold text-[#1B3A8C] hover:border-[#F97316] hover:bg-[#F97316] hover:text-[#12233F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                                >
                                    +{routes.length - legend.length} lainnya
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {legendOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Tutup dialog legenda"
                        onClick={() => setLegendOpen(false)}
                        className="absolute inset-0 bg-[#12233F]/55"
                    />
                    <div
                        id="maps-legend-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="maps-legend-title"
                        aria-describedby="maps-legend-description"
                        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col border-2 border-[#12233F] bg-[#F7F4EA] shadow-[6px_6px_0_#12233F] sm:max-h-[calc(100dvh-3rem)]"
                    >
                        <div className="flex shrink-0 items-start justify-between gap-4 border-b-2 border-[#12233F] bg-white px-4 py-4 sm:px-5">
                            <div>
                                <h2 id="maps-legend-title" className="font-pixel text-3xl font-semibold leading-none text-[#1B3A8C]">Legenda Rute</h2>
                                <p id="maps-legend-description" className="mt-1.5 text-xs text-gray-500">{routes.length} rute yang sedang ditampilkan pada peta.</p>
                            </div>
                            <button
                                type="button"
                                autoFocus
                                onClick={() => setLegendOpen(false)}
                                aria-label="Tutup legenda"
                                className="press-pixel press-pixel-xs shrink-0 border-2 border-[#12233F] bg-white p-2 text-[#12233F] hover:bg-[#F97316] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                            >
                                <Icon name="close" className="h-4 w-4" />
                            </button>
                        </div>
                        <ul className="grid min-h-0 gap-2 overflow-y-auto p-4 sm:grid-cols-2 sm:p-5">
                            {routes.map((r) => (
                                <li key={r.id} className="flex min-w-0 items-start gap-3 border-2 border-[#12233F]/20 bg-white p-3">
                                    <span className="mt-0.5 h-4 w-4 shrink-0 border-2 border-[#12233F]" style={{ background: r.color }} aria-hidden="true" />
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="border border-[#12233F] px-1.5 py-0.5 text-[11px] font-extrabold text-white" style={{ background: r.color }}>{r.ref}</span>
                                            <span className="text-[10px] font-extrabold uppercase tracking-wide text-gray-500">{r.kind === 'biskita' ? 'BisKita' : 'Angkot'}</span>
                                        </div>
                                        <p className="mt-1.5 text-xs font-bold leading-relaxed text-[#12233F]">{r.from}{r.to && <> <span className="text-[#F97316]">→</span> {r.to}</>}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {detailRoute && <RouteStopModal route={detailRoute} onClose={() => setDetailRoute(null)} />}
        </section>
    )
}

export default Maps