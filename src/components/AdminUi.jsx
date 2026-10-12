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
    chevron: <path d="M6 9l6 6 6-6" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    trend: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
    route: <><circle cx="6" cy="5" r="2" /><circle cx="18" cy="19" r="2" /><path d="M8 5h6a3 3 0 010 6h-4a3 3 0 000 6h6" /></>,
    users: <><circle cx="9" cy="8" r="3.5" /><path d="M2 20a7 7 0 0114 0M16 4.5a3.5 3.5 0 010 7M18 20a6 6 0 00-2-4.5" /></>,
}
export function Icon({ name, className = '' }) {
    const size = /(^|\s)w-/.test(className) ? '' : 'w-4 h-4 '
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={size + className} aria-hidden="true">{P[name]}</svg>
}

export function Logo({ className = '' }) {
    return (
        <Link to="/admin" className={`inline-flex items-center gap-1.5 ${className}`}>
            <svg viewBox="0 0 24 30" className="w-7 h-9" aria-hidden="true"><path d="M12 29S2 19 2 11a10 10 0 1120 0c0 8-10 18-10 18z" fill="#F97316" /><circle cx="12" cy="11" r="4" fill="#fff" /></svg>
            <span className="text-3xl font-bold tracking-tight"><span className="text-[#0A47A9]">Trans</span><span className="text-[#047857]">GIS</span></span>
        </Link>
    )
}

export function AuthShell({ children }) {
    return (
        <div className="min-h-screen bg-[#1D4ED8] flex flex-col">
            <header className="bg-white h-[72px] px-6 sm:px-8 flex items-center"><Logo /></header>
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md px-8 sm:px-10 py-9">
                    <p className="text-center text-2xl font-bold tracking-tight mb-4"><span className="text-[#1D4ED8]">Trans</span><span className="text-emerald-500">GIS</span></p>
                    <h1 className="text-center text-lg font-bold text-gray-900 leading-snug">Tentukan Perjalanan di Bogor<br /><span className="text-gray-700">dengan </span><span className="text-[#F97316]">TransGIS</span></h1>
                    {children}
                </div>
            </main>
        </div>
    )
}

export function Field({ label, icon, type = 'text', value, onChange, placeholder, right, autoComplete }) {
    return (
        <label className="block">
            <span className="block text-xs font-semibold text-gray-800 mb-1.5">{label}</span>
            <span className="flex items-center gap-2.5 border border-gray-200 bg-slate-50 rounded-xl px-3.5 h-12 focus-within:ring-2 focus-within:ring-[#1D4ED8] focus-within:bg-white transition">
                <Icon name={icon} className="w-4 h-4 text-slate-400 shrink-0" />
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete}
                    className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 outline-none placeholder-slate-400" />
                {right}
            </span>
        </label>
    )
}

export const PrimaryBtn = ({ children, ...p }) => (
    <button {...p} className="w-full h-12 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-70 disabled:cursor-wait text-white text-sm font-bold uppercase tracking-wide shadow-lg shadow-blue-700/30 flex items-center justify-center gap-2 transition-colors">{children}</button>
)