import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import heroBg from '../../../hero-section.jpeg'

const P = {
    pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    bus: <path d="M5 4h14a1 1 0 011 1v11H4V5a1 1 0 011-1zM4 11h16M7 19v-3M17 19v-3" />,
    van: <path d="M3 8h12l4 4h2v5H3zM7 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />,
    search: <path d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />,
    bell: <path d="M6 9a6 6 0 1112 0c0 6 2 7 2 7H4s2-1 2-7zM10 20h4" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 118 0v3" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    edit: <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" />,
    trash: <path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
    map: <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14" />,
    filter: <path d="M4 5h16l-6 8v6l-4-2v-4z" />,
    refresh: <path d="M20 11a8 8 0 00-14-4M4 4v4h4M4 13a8 8 0 0014 4M20 20v-4h-4" />,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    trend: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
    route: <><circle cx="6" cy="5" r="2" /><circle cx="18" cy="19" r="2" /><path d="M8 5h6a3 3 0 010 6h-4a3 3 0 000 6h6" /></>,
    users: <><circle cx="9" cy="8" r="3.5" /><path d="M2 20a7 7 0 0114 0M16 4.5a3.5 3.5 0 010 7M18 20a6 6 0 00-2-4.5" /></>,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    chevron: <path d="M6 9l6 6 6-6" />,
    check: <path d="M4 12.5l5 5L20 6.5" />,
    calendar: <><rect x="3.5" y="5" width="17" height="15" rx="1" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
    sort: <path d="M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3" />,
}
export function Icon({ name, className = '' }) {
    const size = /(^|\s)w-/.test(className) ? '' : 'w-4 h-4 '
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={size + className} aria-hidden="true">{P[name]}</svg>
}

export function Logo({ className = '', tone = 'dark', to = '/admin/dasbor' }) {
    const light = tone === 'light'
    return (
        <Link to={to} aria-label="TransGIS, buka dasbor admin" className={`inline-flex items-center gap-2.5 ${className}`}>
            <span className={`grid h-9 w-9 place-items-center border-2 ${light ? 'border-[#12233F] bg-white shadow-[3px_3px_0_rgba(18,35,63,0.55)]' : 'border-[#12233F] bg-[#1B3A8C] shadow-[3px_3px_0_#12233F]'}`}>
                <svg viewBox="0 0 24 24" className={`h-5 w-5 ${light ? 'text-[#1B3A8C]' : 'text-white'}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 17V7c0-2 2-3 7-3s7 1 7 3v10M5 13h14M8 8h8M8 17v3M16 17v3" />
                    <path d="M8 16h.01M16 16h.01" strokeWidth="3" />
                </svg>
            </span>
            <span className="whitespace-nowrap font-pixel text-2xl font-semibold leading-none">
                <span className={light ? 'text-white [text-shadow:2px_2px_0_rgba(18,35,63,0.8)]' : 'text-[#1B3A8C]'}>Trans</span>
                <span className={light ? 'text-[#F97316] [text-shadow:2px_2px_0_rgba(18,35,63,0.45)]' : 'text-[#F97316]'}>GIS</span>
            </span>
        </Link>
    )
}

export function AuthShell({ title = 'Masuk ke panel admin', children }) {
    return (
        <div className="admin-page flex min-h-screen flex-col bg-[#1A3FA0] bg-cover bg-fixed bg-center text-[#12233F]" style={{ backgroundImage: `url(${heroBg})` }}>
            <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
                <div className="grid w-full max-w-5xl border-2 border-[#12233F] bg-white shadow-[7px_7px_0_#12233F] lg:grid-cols-[0.95fr_1.05fr]">
                    <section className="relative overflow-hidden border-b-2 border-[#12233F] bg-[#1B3A8C] px-6 pb-20 pt-7 text-white sm:px-8 lg:border-b-0 lg:border-r-2 lg:px-10 lg:pb-24 lg:pt-10">
                        <Logo tone="light" to="/" />
                        <h1 className="mt-6 max-w-md font-pixel text-4xl font-semibold leading-[1.05] text-white sm:text-5xl">Panel Admin TransGIS</h1>
                        <p className="mt-4 max-w-md text-sm leading-6 text-white/80">Kelola trayek, halte, tarif, dan aktivitas portal transportasi Bogor dari satu tempat.</p>
                        <div className="mt-7 space-y-3 text-sm font-semibold">
                            <p className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center border-2 border-white/70 bg-white/10"><Icon name="bus" className="h-5 w-5" /></span>Data BisKita dan angkot</p>
                            <p className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center border-2 border-white/70 bg-white/10"><Icon name="route" className="h-5 w-5" /></span>Pemantauan rute dan kunjungan</p>
                        </div>
                        <div className="road-strip absolute inset-x-0 bottom-0" aria-hidden="true" />
                    </section>
                    <section className="px-6 py-7 sm:px-9 sm:py-9 lg:px-10">
                        <h2 className="font-pixel text-3xl font-semibold leading-tight text-[#1B3A8C] sm:text-4xl">{title}</h2>
                        {children}
                    </section>
                </div>
            </main>
        </div>
    )
}

export function Field({ label, icon, type = 'text', value, onChange, placeholder, right, autoComplete }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-[#12233F]">{label}</span>
            <span className="flex h-12 items-center gap-2.5 border-2 border-[#12233F]/25 bg-white px-3.5 transition-colors focus-within:border-[#1B3A8C] focus-within:ring-2 focus-within:ring-[#1B3A8C]/15">
                <Icon name={icon} className="h-4 w-4 shrink-0 text-[#F97316]" />
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete}
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#12233F] outline-none placeholder:font-normal placeholder:text-gray-400" />
                {right}
            </span>
        </label>
    )
}

export const PrimaryBtn = ({ children, ...p }) => (
    <button {...p} className="flex h-12 w-full items-center justify-center gap-2 border-2 border-[#12233F] bg-[#1B3A8C] px-4 text-sm font-extrabold text-white shadow-[4px_4px_0_#F97316] transition-colors hover:bg-[#12233F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] disabled:cursor-wait disabled:opacity-60">{children}</button>
)

/* Dropdown filter bergaya design system TransGIS (krem–tinta, border tegas,
   bayangan keras). Dipakai untuk filter trayek dan periode statistik. */
export function FilterSelect({ label, value, options, onChange, icon = 'filter', align = 'left', className = '', disabled = false }) {
    const [open, setOpen] = useState(false)
    const box = useRef(null)
    const trigger = useRef(null)
    const current = options.find((option) => option.value === value) || options[0]

    useEffect(() => {
        if (!open) return
        const onPointer = (event) => { if (box.current && !box.current.contains(event.target)) setOpen(false) }
        const onKey = (event) => {
            if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
        }
        document.addEventListener('mousedown', onPointer)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onPointer)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    const choose = (next) => { onChange(next); setOpen(false); trigger.current?.focus() }

    return (
        <div ref={box} className={`relative ${className}`}>
            <button
                ref={trigger}
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={label}
                className={`flex h-11 w-full items-center justify-between gap-3 border-2 px-3.5 text-xs font-extrabold text-[#12233F] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] disabled:cursor-wait disabled:opacity-60 ${open
                    ? 'border-[#12233F] bg-[#F7F4EA] shadow-[3px_3px_0_#F97316]'
                    : 'border-[#12233F]/30 bg-white hover:border-[#12233F] hover:bg-[#F7F4EA]'
                    }`}
            >
                <span className="flex min-w-0 items-center gap-2.5">
                    <Icon name={icon} className="h-4 w-4 shrink-0 text-[#F97316]" />
                    <span className="truncate">{current?.label}</span>
                </span>
                <Icon name="chevron" className={`h-3.5 w-3.5 shrink-0 text-[#1B3A8C] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className={`absolute top-full z-[70] mt-2 w-full min-w-[14rem] max-w-[min(21rem,calc(100vw-2rem))] overflow-hidden border-2 border-[#12233F] bg-[#F7F4EA] shadow-[5px_5px_0_#12233F] ${align === 'right' ? 'right-0' : 'left-0'}`}>
                    <p className="border-b-2 border-[#12233F]/15 bg-white/70 px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">{label}</p>
                    <ul role="listbox" aria-label={label} className="max-h-64 overflow-y-auto p-2">
                        {options.map((option) => {
                            const active = option.value === value
                            return (
                                <li key={option.value}>
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={active}
                                        onClick={() => choose(option.value)}
                                        className={`flex w-full items-center justify-between gap-3 border-l-2 px-3 py-2.5 text-left text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F97316] ${active
                                            ? 'border-[#F97316] bg-[#1B3A8C] text-white'
                                            : 'border-transparent text-[#12233F] hover:border-[#12233F]/40 hover:bg-white'
                                            }`}
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate">{option.label}</span>
                                            {option.hint && <span className={`mt-0.5 block text-[11px] font-medium ${active ? 'text-white/70' : 'text-gray-500'}`}>{option.hint}</span>}
                                        </span>
                                        {active && <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-[#F97316]" />}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </div>
    )
}
