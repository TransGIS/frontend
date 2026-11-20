import { useEffect, useState } from 'react'
import { searchPlaces } from '../lib/geocode'

/**
 * Input lokasi dengan saran (Nominatim).
 * - value / onChange : teks yang diketik
 * - selected         : place terpilih ({ name, lat, lng, ... }) atau null
 * - onSelect(place)  : dipanggil saat saran dipilih
 * - onSubmit         : dipanggil saat Enter tanpa saran yang disorot
 * - onFocus          : opsional, dipanggil saat input difokuskan
 * - onClear          : opsional, bila ada menampilkan tombol × untuk menghapus
 */
function PlaceInput({ id, value, selected, onChange, onSelect, onSubmit, onFocus, onClear, placeholder, pinClass = 'text-[#F97316]', className = '' }) {
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
                className={`flex min-h-[50px] items-center rounded-lg border-2 bg-white px-3.5 transition-colors focus-within:border-[#1B3A8C] focus-within:ring-2 focus-within:ring-[#1B3A8C]/15 ${selected ? 'border-[#16A34A]' : 'border-[#12233F]/25'}`}
            >
                <svg viewBox="0 0 24 24" className={`${pinClass} mr-3 h-5 w-5 shrink-0`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                </svg>
                <input
                    id={id}
                    type="text"
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setOpen(true) }}
                    onFocus={() => { setOpen(true); onFocus?.() }}
                    onBlur={() => setOpen(false)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={showPanel}
                    aria-autocomplete="list"
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#12233F] outline-none placeholder:font-normal placeholder:text-gray-400"
                />
                {selected && (
                    <svg viewBox="0 0 24 24" className="ml-2 h-5 w-5 shrink-0 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth="2.5" aria-label="Lokasi dipilih" role="img">
                        <path d="M5 12l4 4L19 6" />
                    </svg>
                )}
                {onClear && (value || selected) && (
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClear} aria-label="Hapus lokasi" className="ml-2 shrink-0 px-1 text-lg font-bold text-gray-400 hover:text-gray-700">×</button>
                )}
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