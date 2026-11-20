import { useEffect } from 'react'

/* ────────────────────────────────────────────────────────────
   Modal "Jalur & halte" — dipakai bersama oleh landing page
   (tombol "Lihat Jalur & Halte") dan /maps (chip angkot/bis
   yang ditekan pada detail perjalanan), supaya tampilannya
   persis sama di kedua tempat.
   ──────────────────────────────────────────────────────────── */

function Icon({ d, className = 'w-4 h-4' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
            {d}
        </svg>
    )
}
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

export default function RouteStopModal({ route, onClose }) {
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

    const stops = route.stops || []
    const hasStops = stops.length > 0
    const interval = route.intervalMin ? `Setiap ${route.intervalMin} menit` : null
    const jam = route.jamOperasional ? `${route.jamOperasional.buka} – ${route.jamOperasional.tutup} WIB` : null
    const items = hasStops
        ? stops.map((s) => ({
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
                        className="press-pixel press-pixel-xs shrink-0 border-2 border-[#12233F] bg-[#F7F4EA] p-2 text-[#12233F] hover:bg-[#F97316] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A8C]"
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