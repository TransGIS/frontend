import { useEffect, useMemo, useState } from 'react'
import { loadRoutes } from '../lib/routeData'
import RouteStopModal from './RouteStopModal'

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
                    className={`press-pixel press-pixel-xs h-9 w-9 border text-sm font-medium ${n === page
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
        <section id="tarif" className="scroll-mt-20 bg-[#F0F3F8] px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
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

            {openRoute && <RouteStopModal route={openRoute} onClose={() => setOpenRoute(null)} />}
        </section>
    )
}

export default RouteInfoSection