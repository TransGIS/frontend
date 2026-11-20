import { Link } from 'react-router-dom'

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
}
export function Icon({ name, className = '' }) {
    const size = /(^|\s)w-/.test(className) ? '' : 'w-4 h-4 '
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={size + className} aria-hidden="true">{P[name]}</svg>
}

export function Logo({ className = '' }) {
    return (
        <Link to="/admin/dasbor" aria-label="TransGIS, buka dasbor admin" className={`inline-flex items-center gap-2.5 ${className}`}>
            <span className="grid h-9 w-9 place-items-center border-2 border-[#12233F] bg-[#1B3A8C] shadow-[3px_3px_0_#12233F]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 17V7c0-2 2-3 7-3s7 1 7 3v10M5 13h14M8 8h8M8 17v3M16 17v3" />
                    <path d="M8 16h.01M16 16h.01" strokeWidth="3" />
                </svg>
            </span>
            <span className="font-pixel text-2xl font-semibold leading-none"><span className="text-[#1B3A8C]">Trans</span><span className="text-[#F97316]">GIS</span></span>
        </Link>
    )
}

export function AuthShell({ title = 'Masuk ke panel admin', children }) {
    return (
        <div className="admin-page flex min-h-screen flex-col bg-[#F7F4EA] text-[#12233F]">
            <header className="flex h-20 items-center border-b-2 border-[#12233F] bg-white px-4 sm:px-8"><Logo /></header>
            <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
                <div className="grid w-full max-w-5xl border-2 border-[#12233F] bg-white shadow-[7px_7px_0_#12233F] lg:grid-cols-[0.95fr_1.05fr]">
                    <section className="relative overflow-hidden border-b-2 border-[#12233F] bg-[#1B3A8C] px-6 pb-20 pt-7 text-white sm:px-8 lg:border-b-0 lg:border-r-2 lg:px-10 lg:pb-24 lg:pt-10">
                        <p className="font-pixel text-xl font-semibold text-[#F97316]">Area pengelola</p>
                        <h1 className="mt-3 max-w-md font-pixel text-4xl font-semibold leading-[1.05] sm:text-5xl">Panel Admin TransGIS</h1>
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
