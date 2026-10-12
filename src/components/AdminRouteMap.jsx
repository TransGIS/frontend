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
            <div ref={el} className="absolute inset-0 bg-slate-100" />
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
        <div className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-label={`Peta trayek ${route.kode}`} onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
                <header className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
                    <span className="inline-flex min-w-9 h-8 px-2 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: route.color }}>{route.kode}</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{route.from}{route.to && ` ⇌ ${route.to}`}</p>
                        {route.via && <p className="text-xs text-gray-500 truncate">Via {route.via}</p>}
                    </div>
                    <button type="button" onClick={onClose} aria-label="Tutup" className="p-2 text-gray-500 hover:text-gray-900"><Icon name="close" className="w-5 h-5" /></button>
                </header>
                <RouteMap className="h-[60vh]" parts={route.parts} stops={route.stops} color={route.color} markerColor={route.markerColor} />
                <footer className="flex flex-wrap gap-x-8 gap-y-1 px-5 py-3 text-xs text-gray-600 border-t border-gray-200">
                    <span>Tarif: <b className="text-gray-900">{route.tarif}</b></span>
                    <span>Estimasi: <b className="text-gray-900">{route.estimasi}</b></span>
                    <span>Halte: <b className="text-gray-900">{route.stops?.length || 0}</b></span>
                </footer>
            </div>
        </div>
    )
}