import { useEffect, useMemo, useState } from 'react'
import { loadRoutes } from '../lib/routeData'
import { getRouteInfo } from '../data/rute-info'

const PER_PAGE = 4

const TITLE = {
    biskita: 'Koridor BisKita Trans Pakuan Unggulan',
    angkot: 'Koridor Angkot Kota Bogor',
}

/* ── Ikon kecil ── */
function Icon({ d, className = 'w-4 h-4' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
            {d}
        </svg>
    )
}
const ARROW_RIGHT = <path d="M5 12h14M13 6l6 6-6 6" />
const ARROW_LEFT = <path d="M19 12H5M11 6l-6 6 6 6" />
const CHEVRON = <path d="M9 6l6 6-6 6" />
const CLOCK = <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>

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

/* ── Kartu rute ── */
function InfoRow({ label, children }) {
    return (
        <div className="grid grid-cols-[6.5rem_1fr] sm:grid-cols-[7.5rem_1fr] gap-2 items-start">
            <dt className="text-gray-400">{label}:</dt>
            <dd className="text-gray-800">{children}</dd>
        </div>
    )
}

function RouteInfoCard({ route, onOpen }) {
    const info = getRouteInfo(route)
    const hasRows = info.lintasan || info.interval || info.integrasi || info.jam
    return (
        <article className="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col">
            <header className="flex items-start gap-3">
                <Badge route={route} />
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 leading-snug">
                        {route.from}
                        {route.to && <span className="text-gray-400 font-normal"> → </span>}
                        {route.to}
                    </h3>
                    {route.via && <p className="text-xs text-gray-500 mt-0.5">Via {route.via}</p>}
                </div>
                <span className="shrink-0 bg-gray-100 text-gray-700 text-[11px] font-bold rounded px-2 py-1 whitespace-nowrap">
                    {route.fare}
                </span>
            </header>

            {hasRows && (
                <dl className="mt-3 pt-3 border-t border-gray-200 space-y-2.5 text-xs">
                    {info.lintasan && <InfoRow label="Lintasan">{info.lintasan}</InfoRow>}
                    {info.interval && <InfoRow label="Interval">{info.interval}</InfoRow>}
                    {info.integrasi && (
                        <InfoRow label="Integrasi">
                            <span className="inline-block bg-green-50 text-green-700 rounded px-2 py-1">{info.integrasi}</span>
                        </InfoRow>
                    )}
                    {info.jam && <InfoRow label="Jam Oprasional">{info.jam}</InfoRow>}
                </dl>
            )}

            <div className={`${hasRows ? 'mt-3 pt-3 border-t border-gray-200' : 'mt-3'} flex justify-end`}>
                <button
                    type="button"
                    onClick={() => onOpen(route)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A47A9] hover:text-[#1B3A8C] transition-colors"
                >
                    Lihat Jalur &amp; Halte <Icon d={CHEVRON} className="w-3.5 h-3.5" />
                </button>
            </div>
        </article>
    )
}

/* ── Paginasi ── */
function Pagination({ page, pages, onChange }) {
    if (pages <= 1) return null
    return (
        <nav className="mt-10 flex items-center justify-center gap-3 sm:gap-5" aria-label="Halaman rute">
            <button
                type="button"
                onClick={() => onChange(page - 1)}
                disabled={page === 1}
                aria-label="Halaman sebelumnya"
                className="p-1 text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
                <Icon d={ARROW_LEFT} className="w-5 h-5" />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    aria-current={n === page ? 'page' : undefined}
                    className={`w-9 h-9 rounded-md border text-sm font-medium transition-colors ${n === page
                        ? 'bg-[#0A47A9] border-[#0A47A9] text-white'
                        : 'bg-white border-[#0A47A9] text-gray-900 hover:bg-blue-50'
                        }`}
                >
                    {n}
                </button>
            ))}
            <button
                type="button"
                onClick={() => onChange(page + 1)}
                disabled={page === pages}
                aria-label="Halaman berikutnya"
                className="p-1 text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
                <Icon d={ARROW_RIGHT} className="w-5 h-5" />
            </button>
        </nav>
    )
}

/* ── Modal jalur & halte ── */
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

function RouteModal({ route, onClose }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = prev
            window.removeEventListener('keydown', onKey)
        }
    }, [onClose])

    const hasStops = route.stops.length > 0
    const items = hasStops
        ? route.stops.map((s) => ({
            name: s.name,
            sub: s.named ? undefined : `${s.pos[0].toFixed(5)}, ${s.pos[1].toFixed(5)}`,
        }))
        : [
            { name: route.from, sub: 'Pangkalan / titik awal rute' },
            ...(route.via ? [{ name: route.via, sub: 'Melewati kawasan ini', tag: 'Via' }] : []),
            { name: route.to || route.from, sub: 'Titik akhir rute' },
        ]

    return (
        <div
            className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={`Jalur dan halte ${route.ref}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0A47A9] w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl shadow-2xl p-5"
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center gap-2 text-white text-sm font-semibold mb-4 hover:text-orange-300 transition-colors"
                >
                    <Icon d={ARROW_LEFT} className="w-5 h-5" /> Kembali
                </button>

                <div className="bg-[#16A34A] rounded-xl p-3.5 mb-5 text-white shadow-md">
                    <div className="flex items-start gap-3">
                        <Badge route={route} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold leading-snug">{route.from}{route.to && ' → '}{route.to}</p>
                            {route.via && <p className="text-xs text-green-100 mt-0.5">Via {route.via}</p>}
                        </div>
                        <span className="shrink-0 bg-green-900/50 text-[11px] font-bold rounded px-2 py-1 whitespace-nowrap">{route.fare}</span>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-white/25 flex items-center justify-between text-xs text-green-50">
                        <span className="flex items-center gap-1.5">
                            <Icon d={CLOCK} className="w-3.5 h-3.5" />
                            Estimasi Perjalanan: ~{route.minutes} mnt • {route.km.toFixed(1)} km
                        </span>
                        {route.kind === 'biskita' && <span>Tarif Flat</span>}
                    </div>
                </div>

                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200 mb-2">Daftar halte &amp; kedatangan</p>
                <Timeline items={items} />
                {!hasStops && (
                    <p className="text-xs text-blue-200 mt-4 leading-relaxed">
                        Data halte untuk rute ini belum ada di file GeoJSON, jadi hanya titik awal dan akhir yang ditampilkan.
                    </p>
                )}
            </div>
        </div>
    )
}

/* ── Section utama ── */
function RouteInfoSection({ mode = 'biskita', query = '' }) {
    const [data, setData] = useState(null)
    const [status, setStatus] = useState('loading') // loading | ready | error
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)
    const [openRoute, setOpenRoute] = useState(null)

    useEffect(() => {
        let off = false
        loadRoutes()
            .then((d) => { if (!off) { setData(d); setStatus('ready') } })
            .catch((e) => { if (!off) { setError(e.message); setStatus('error') } })
        return () => { off = true }
    }, [])

    const filtered = useMemo(() => {
        const routes = data?.[mode] ?? []
        const q = query.trim().toLowerCase()
        if (!q) return routes
        return routes.filter((r) => `${r.ref} ${r.from} ${r.to} ${r.via || ''} ${r.name}`.toLowerCase().includes(q))
    }, [data, mode, query])

    useEffect(() => { setPage(1) }, [mode, query])

    const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
    const current = Math.min(page, pages)
    const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE)

    return (
        <section id="tarif" className="scroll-mt-16 bg-[#F0F3F8] px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-6xl mx-auto">
                <p className="text-xs font-bold uppercase tracking-wide text-[#1B4FD8] mb-2">Armada Modern BRT</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6 sm:mb-8">{TITLE[mode]}</h2>

                {status === 'loading' && <p className="text-sm text-gray-500">Memuat data rute…</p>}
                {status === 'error' && (
                    <div className="bg-red-50 text-red-800 text-sm rounded-xl p-3.5 leading-relaxed">
                        Data rute gagal dimuat: {error}. Pastikan file GeoJSON ada di <code>public/rute/</code>.
                    </div>
                )}

                {status === 'ready' && (
                    filtered.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            Tidak ada trayek yang cocok dengan “{query}”. Coba nomor atau nama lokasi lain.
                        </p>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-x-16 lg:gap-y-8">
                                {visible.map((r) => <RouteInfoCard key={r.id} route={r} onOpen={setOpenRoute} />)}
                            </div>
                            <Pagination page={current} pages={pages} onChange={setPage} />
                        </>
                    )
                )}
            </div>

            {openRoute && <RouteModal route={openRoute} onClose={() => setOpenRoute(null)} />}
        </section>
    )
}

export default RouteInfoSection