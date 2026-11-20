import { useEffect, useMemo, useState } from 'react'
import { loadRoutes } from '../lib/routeData'

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
            className="flex h-10 min-w-10 shrink-0 items-center justify-center border-2 border-[#12233F] px-2 font-pixel text-base font-semibold text-white"
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
            <dt className="text-gray-500">{label}:</dt>
            <dd className="font-medium text-[#12233F]">{children}</dd>
        </div>
    )
}

/* Nilai yang memang belum diisi di database ditandai apa adanya,
   bukan dipinjam dari rute lain. */
function EmptyValue() {
    return <span className="font-normal italic text-gray-400">Belum tersedia</span>
}

function RouteInfoCard({ route, onOpen, wide = false }) {
    const interval = route.intervalMin ? `Setiap ${route.intervalMin} menit` : null
    const jam = route.jamOperasional ? `${route.jamOperasional.buka} – ${route.jamOperasional.tutup} WIB` : null

    return (
        <article className={`flex flex-col bg-white p-5${wide ? ' md:col-span-2' : ''}`}>
            <header className="flex items-start gap-3">
                <Badge route={route} />
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold leading-snug text-[#12233F]">
                        {route.from}
                        {route.to && <span className="text-gray-400 font-normal"> → </span>}
                        {route.to}
                    </h3>
                    {route.via && <p className="mt-1 text-xs leading-5 text-gray-500">Via {route.via}</p>}
                </div>
                <span className="shrink-0 whitespace-nowrap border-2 border-[#12233F]/15 bg-[#F7F4EA] px-2 py-1 text-[11px] font-extrabold text-[#12233F]">
                    {route.fare}
                </span>
            </header>

            <dl className={`mt-4 flex-1 border-t-2 border-[#12233F]/10 pt-4 text-xs leading-5 ${wide ? 'grid gap-2.5 sm:grid-cols-2 sm:gap-x-12' : 'space-y-2.5'}`}>
                <InfoRow label="Interval">{interval ? interval : <EmptyValue />}</InfoRow>
                <InfoRow label="Jam Operasional">{jam ? jam : <EmptyValue />}</InfoRow>
            </dl>

            <div className="mt-4 flex justify-end border-t-2 border-[#12233F]/10 pt-3">
                <button
                    type="button"
                    onClick={() => onOpen(route)}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1B3A8C] transition-colors hover:text-[#F97316] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                >
                    Lihat Jalur &amp; Halte <Icon d={CHEVRON} className="h-3.5 w-3.5" />
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
                    className={`h-9 w-9 border text-sm font-medium transition-colors ${n === page
                        ? 'bg-[#1B3A8C] border-[#1B3A8C] text-white'
                        : 'bg-white border-[#1B3A8C] text-gray-900 hover:bg-blue-50'
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
        <ol className="relative ml-2 border-l-2 border-[#12233F] pl-6">
            {items.map((s, i) => {
                const first = i === 0
                const last = i === items.length - 1
                return (
                    <li key={`${s.name}-${i}`} className="relative mb-3 last:mb-0">
                        <span
                            aria-hidden="true"
                            className={`absolute -left-[35px] top-4 h-4 w-4 border-2 border-[#12233F] ${first ? 'bg-[#F97316]' : last ? 'bg-[#16A34A]' : 'bg-[#1B3A8C]'}`}
                        />
                        <div className="border-2 border-[#12233F]/15 bg-white px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-bold leading-6 text-[#12233F]">{s.name}</p>
                                {(first || last || s.tag) && (
                                    <span className={`shrink-0 border border-[#12233F] px-2 py-0.5 text-[10px] font-extrabold ${first ? 'bg-[#F97316] text-[#12233F]' : last ? 'bg-[#16A34A] text-white' : 'bg-[#EAF0FF] text-[#1B3A8C]'}`}>
                                        {first ? 'Titik Awal' : last ? 'Tujuan Akhir' : s.tag}
                                    </span>
                                )}
                            </div>
                            {s.sub && <p className="mt-1 text-xs leading-5 text-gray-500">{s.sub}</p>}
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
    const interval = route.intervalMin ? `Setiap ${route.intervalMin} menit` : null
    const jam = route.jamOperasional ? `${route.jamOperasional.buka} – ${route.jamOperasional.tutup} WIB` : null
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
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#12233F]/70 p-3 sm:p-6"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={`Jalur dan halte ${route.ref}`}
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[90dvh] w-full max-w-2xl flex-col border-2 border-[#12233F] bg-[#F7F4EA] shadow-[8px_8px_0_#12233F]"
            >
                <div className="flex items-center justify-between gap-4 border-b-2 border-[#12233F] bg-white px-4 py-4 sm:px-6">
                    <div>
                        <h2 className="font-pixel text-2xl font-semibold leading-none text-[#12233F] sm:text-3xl">Jalur &amp; halte</h2>
                        <p className="mt-1 text-xs text-gray-500">Detail perjalanan rute {route.ref}</p>
                    </div>
                    <button
                        type="button"
                        autoFocus
                        onClick={onClose}
                        aria-label="Tutup detail jalur dan halte"
                        className="shrink-0 border-2 border-[#12233F] bg-[#F7F4EA] p-2 text-[#12233F] transition-colors hover:bg-[#F97316] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A8C]"
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                            <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                    </button>
                </div>

                <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
                    <div className="border-2 border-[#12233F] bg-white p-4 shadow-[4px_4px_0_#12233F]">
                        <div className="flex items-start gap-3">
                            <Badge route={route} />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-extrabold leading-6 text-[#12233F]">{route.from}{route.to && ' → '}{route.to}</p>
                                {route.via && <p className="mt-1 text-xs leading-5 text-gray-500">Via {route.via}</p>}
                            </div>
                            <span className="shrink-0 whitespace-nowrap border-2 border-[#12233F]/15 bg-[#F7F4EA] px-2 py-1 text-[11px] font-extrabold text-[#12233F]">{route.fare}</span>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t-2 border-[#12233F]/10 pt-3 text-xs font-semibold text-gray-600">
                            <span className="flex items-center gap-1.5">
                                <Icon d={CLOCK} className="h-4 w-4 text-[#1B3A8C]" />
                                Sekitar {route.minutes} menit
                            </span>
                            <span>{route.km.toFixed(1)} km</span>
                            {interval && <span>{interval}</span>}
                            {jam && <span>{jam}</span>}
                            {route.tipeTarif === 'flat' && <span className="text-[#1B3A8C]">Tarif flat</span>}
                        </div>
                    </div>

                    <div className="mb-4 mt-7 flex items-end justify-between gap-3">
                        <h3 className="font-pixel text-2xl font-semibold text-[#12233F]">Daftar halte</h3>
                        <span className="text-xs font-semibold text-gray-500">{items.length} titik</span>
                    </div>
                    <Timeline items={items} />
                    {!hasStops && (
                        <p className="mt-5 border-l-4 border-[#F97316] bg-white px-4 py-3 text-xs leading-6 text-gray-600">
                            Data halte untuk rute ini belum tersedia. Hanya titik awal, via, dan titik akhir yang ditampilkan.
                        </p>
                    )}
                </div>
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
                <p className="mb-2 text-sm font-bold text-[#1B3A8C]">{mode === 'biskita' ? 'BisKita Trans Pakuan' : 'Angkot Kota Bogor'}</p>
                <h2 className="mb-6 text-2xl font-extrabold text-[#12233F] sm:mb-8 sm:text-3xl">{TITLE[mode]}</h2>

                {status === 'loading' && <p className="text-sm text-gray-500">Memuat data rute…</p>}
                {status === 'error' && (
                    <div className="border-2 border-red-200 bg-red-50 p-3.5 text-sm leading-relaxed text-red-800">
                        Data rute gagal dimuat: {error}. Pastikan backend API berjalan (VITE_API_URL) dan data rute sudah di-seed.
                    </div>
                )}

                {status === 'ready' && (
                    filtered.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            Tidak ada trayek yang cocok dengan “{query}”. Coba nomor atau nama lokasi lain.
                        </p>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-x-10 lg:gap-y-8">
                                {visible.map((r, i) => (
                                    <RouteInfoCard
                                        key={r.id}
                                        route={r}
                                        onOpen={setOpenRoute}
                                        wide={visible.length % 2 === 1 && i === visible.length - 1}
                                    />
                                ))}
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