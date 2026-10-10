import { useEffect, useState } from 'react'
import { searchPlaces } from '../lib/geocode'

/**
 * Input lokasi dengan saran (Nominatim).
 * - value / onChange : teks yang diketik
 * - selected         : place terpilih ({ name, lat, lng, ... }) atau null
 * - onSelect(place)  : dipanggil saat saran dipilih
 * - onSubmit         : dipanggil saat Enter tanpa saran yang disorot
 */
function PlaceInput({ value, selected, onChange, onSelect, onSubmit, placeholder, pinClass = 'text-[#F97316]', className = '' }) {
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState([])
    const [state, setState] = useState('idle') // idle | loading | done | error
    const [active, setActive] = useState(-1)

    const q = value.trim()
    const showPanel = open && !selected && q.length >= 3

    // Cari saran setelah pengguna berhenti mengetik (debounce)
    useEffect(() => {
        if (!open || selected || q.length < 3) return
        const ctrl = new AbortController()
        setState('loading')
        const t = setTimeout(() => {
            searchPlaces(q, ctrl.signal)
                .then((r) => { setItems(r); setActive(-1); setState('done') })
                .catch((e) => { if (e.name !== 'AbortError') setState('error') })
        }, 600)
        return () => { clearTimeout(t); ctrl.abort() }
    }, [q, open, selected])

    const pick = (p) => {
        onSelect(p)
        setOpen(false)
    }

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown' && showPanel && items.length) {
            e.preventDefault()
            setActive((a) => (a + 1) % items.length)
        } else if (e.key === 'ArrowUp' && showPanel && items.length) {
            e.preventDefault()
            setActive((a) => (a <= 0 ? items.length - 1 : a - 1))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (showPanel && active >= 0 && items[active]) pick(items[active])
            else { setOpen(false); onSubmit?.() }
        } else if (e.key === 'Escape') {
            setOpen(false)
        }
    }

    return (
        <div className={`relative ${className}`}>
            <div
                className={`flex items-center border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 focus-within:ring-2 focus-within:ring-[#1B3A8C] focus-within:border-transparent transition-all ${selected ? 'border-green-300' : 'border-gray-200'}`}
            >
                <span className={`${pinClass} mr-2.5 sm:mr-3 text-base shrink-0`}>📍</span>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={showPanel}
                    aria-autocomplete="list"
                    className="flex-1 bg-transparent text-gray-700 text-xs sm:text-sm outline-none placeholder-gray-400 min-w-0"
                />
                {selected && <span className="text-green-600 text-xs font-bold ml-2 shrink-0" aria-label="Lokasi dipilih">✓</span>}
            </div>

            {showPanel && (
                <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden text-left"
                >
                    {state === 'loading' && <li className="px-4 py-3 text-xs text-gray-500">Mencari lokasi…</li>}
                    {state === 'error' && <li className="px-4 py-3 text-xs text-red-600">Pencarian gagal. Coba lagi sebentar.</li>}
                    {state === 'done' && items.length === 0 && (
                        <li className="px-4 py-3 text-xs text-gray-500">Tidak ada hasil di sekitar Bogor.</li>
                    )}
                    {state === 'done' && items.map((p, i) => (
                        <li
                            key={p.id}
                            role="option"
                            aria-selected={i === active}
                            onMouseDown={(e) => { e.preventDefault(); pick(p) }}
                            onMouseEnter={() => setActive(i)}
                            className={`px-4 py-2.5 cursor-pointer ${i === active ? 'bg-blue-50' : ''}`}
                        >
                            <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                            {p.sub && <p className="text-xs text-gray-500 truncate">{p.sub}</p>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default PlaceInput