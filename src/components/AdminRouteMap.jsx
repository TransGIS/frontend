import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Icon } from './AdminUi'

/* Peta jalur + halte. parts = [[ [lat,lng], ... ], ...]  stops = [{ pos:[lat,lng], name }] */
export function RouteMap({ parts = [], stops = [], color = '#2563EB', markerColor = '#F97316', className = '' }) {
    const el = useRef(null)
    const map = useRef(null)
    const layer = useRef(null)

    useEffect(() => {
        const m = L.map(el.current, { center: [-6.5971, 106.806], zoom: 12, preferCanvas: true })
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            subdomains: ['a', 'b', 'c'],
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(m)
        layer.current = L.layerGroup().addTo(m)
        map.current = m
        return () => { m.remove(); map.current = null }
    }, [])

    useEffect(() => {
        const m = map.current
        const g = layer.current
        if (!m || !g) return
        g.clearLayers()
        const all = []
        parts.forEach((pts) => {
            all.push(...pts)
            L.polyline(pts, { color: '#fff', weight: 9, opacity: 0.9 }).addTo(g)
            L.polyline(pts, { color, weight: 5, lineCap: 'round', lineJoin: 'round' }).addTo(g)
        })
        stops.forEach((s) => {
            all.push(s.pos)
            L.circleMarker(s.pos, { radius: 5, color, weight: 2, fillColor: '#fff', fillOpacity: 1 }).bindTooltip(s.name).addTo(g)
        })
        if (parts.length) {
            const first = parts[0][0]
            const lastPart = parts[parts.length - 1]
            const last = lastPart[lastPart.length - 1]
            L.circleMarker(first, { radius: 8, color: '#fff', weight: 3, fillColor: '#16A34A', fillOpacity: 1 }).bindTooltip('Titik awal').addTo(g)
            L.circleMarker(last, { radius: 8, color: '#fff', weight: 3, fillColor: markerColor, fillOpacity: 1 }).bindTooltip('Titik akhir').addTo(g)
        }
        if (all.length) m.fitBounds(L.latLngBounds(all), { padding: [30, 30] })
    }, [parts, stops, color, markerColor])

    return (
        <div className={`relative isolate ${className}`}>
            <div ref={el} className="absolute inset-0 bg-[#E8E1CC]" />
            {!parts.length && (
                <p className="absolute inset-0 z-[500] flex items-center justify-center px-6 text-center text-xs text-slate-500 pointer-events-none">
                    Unggah file GeoJSON untuk melihat jalur di peta.
                </p>
            )}
        </div>
    )
}

export function RouteMapModal({ route, onClose }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', onKey)
        return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
    }, [onClose])

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#12233F]/55 p-4" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-label={`Peta trayek ${route.kode}`} onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl overflow-hidden border-2 border-[#12233F] bg-white shadow-[6px_6px_0_#12233F]">
                <header className="flex items-center gap-3 border-b-2 border-[#12233F] bg-[#F7F4EA] px-4 py-4 sm:px-5">
                    <span className="inline-flex h-9 min-w-10 items-center justify-center border-2 border-[#12233F] px-2 text-xs font-extrabold text-white" style={{ background: route.color }}>{route.kode}</span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-[#12233F]">{route.from}{route.to && ` ⇌ ${route.to}`}</p>
                        {route.via && <p className="mt-0.5 truncate text-xs text-gray-500">Via {route.via}</p>}
                    </div>
                    <button type="button" onClick={onClose} aria-label="Tutup peta" className="grid h-9 w-9 shrink-0 place-items-center border-2 border-[#12233F] bg-white text-[#12233F] transition-colors hover:bg-[#F97316] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"><Icon name="close" className="h-4 w-4" /></button>
                </header>
                <RouteMap className="h-[60vh] min-h-[320px]" parts={route.parts} stops={route.stops} color={route.color} markerColor={route.markerColor} />
                <footer className="flex flex-wrap gap-x-8 gap-y-2 border-t-2 border-[#12233F] bg-[#F7F4EA] px-5 py-3 text-xs text-gray-600">
                    <span>Tarif: <b className="text-[#12233F]">{route.tarif}</b></span>
                    <span>Estimasi: <b className="text-[#12233F]">{route.estimasi}</b></span>
                    <span>Halte: <b className="text-[#12233F]">{route.stops?.length || 0}</b></span>
                </footer>
            </div>
        </div>
    )
}