import { useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { session } from '../lib/adminApi'
import { Icon, Logo } from './AdminUi'

const GROUPS = [
    { label: 'Utama', items: [{ to: '/admin/dasbor', icon: 'grid', text: 'Dashboard' }] },
    {
        label: 'Manajemen Trayek', items: [
            { to: '/admin/trayek/biskita', icon: 'bus', text: 'BisKita Trans Pakuan' },
            { to: '/admin/trayek/angkot', icon: 'van', text: 'Trayek Angkot Bogor' },
        ]
    },
    {
        label: 'Info Tarif & Rute', items: [
            { to: '/admin/info/biskita', icon: 'bus', text: 'BisKita Trans Pakuan' },
            { to: '/admin/info/angkot', icon: 'van', text: 'Trayek Angkot Bogor' },
        ]
    },
]

export default function AdminLayout() {
    const s = session.get()
    const nav = useNavigate()
    const [open, setOpen] = useState(false)
    const [confirmOut, setConfirmOut] = useState(false)
    if (!s) return <Navigate to="/admin/login" replace />
    const initials = (s.user?.name || 'AD').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    const cls = (active) => `mb-1.5 flex min-h-11 items-center gap-3 border-2 px-3 py-2.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] ${active ? 'border-[#12233F] bg-[#F97316] font-extrabold text-[#12233F] shadow-[3px_3px_0_#F7F4EA]' : 'border-transparent font-semibold text-white/75 hover:border-white/20 hover:bg-white/10 hover:text-white'}`

    return (
        <div className="admin-page min-h-screen bg-[#F7F4EA] text-[#12233F]">
            <header className="fixed inset-x-0 top-0 z-40 flex h-20 items-center gap-3 border-b-2 border-[#12233F] bg-white px-4 sm:px-6 lg:px-8">
                <button type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Tutup menu admin' : 'Buka menu admin'} aria-expanded={open} className="-ml-1 grid h-10 w-10 place-items-center border-2 border-[#12233F] text-[#12233F] transition-colors hover:bg-[#F97316] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] lg:hidden"><Icon name="menu" className="h-5 w-5" /></button>
                <Logo />
                <label className="ml-auto hidden h-11 w-96 max-w-[38%] items-center gap-2 border-2 border-[#12233F]/20 bg-[#F7F4EA] px-3 transition-colors focus-within:border-[#1B3A8C] focus-within:ring-2 focus-within:ring-[#1B3A8C]/15 md:flex">
                    <Icon name="search" className="shrink-0 text-[#F97316]" />
                    <input aria-label="Cari di panel admin" placeholder="Cari rute, trayek, koridor, atau halte..." className="min-w-0 flex-1 bg-transparent text-xs font-medium text-[#12233F] outline-none placeholder:font-normal placeholder:text-gray-400" />
                </label>
                <div className="ml-auto flex items-center gap-2 sm:gap-3 md:ml-4">
                    <button type="button" aria-label="Notifikasi" className="relative hidden h-10 w-10 place-items-center border-2 border-[#12233F]/20 text-[#12233F] transition-colors hover:border-[#12233F] hover:bg-[#F7F4EA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] sm:grid"><Icon name="bell" className="h-5 w-5" /><span className="absolute right-1.5 top-1.5 h-2 w-2 bg-[#F97316]" /></button>
                    <button type="button" onClick={() => setConfirmOut(true)} title="Keluar dari panel admin" className="flex items-center gap-2.5 border-2 border-transparent p-1 text-left transition-colors hover:border-[#12233F]/20 hover:bg-[#F7F4EA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] sm:px-2">
                        <span className="grid h-9 w-9 shrink-0 place-items-center border-2 border-[#12233F] bg-[#1B3A8C] text-xs font-extrabold text-white">{initials}</span>
                        <span className="hidden leading-tight sm:block"><b className="block max-w-32 truncate text-xs text-[#12233F]">{s.user?.name}</b><span className="text-[11px] text-gray-500">{s.user?.role}</span></span>
                        <Icon name="logout" className="h-4 w-4 shrink-0 text-[#F97316]" />
                    </button>
                </div>
            </header>

            {open && <button type="button" aria-label="Tutup menu admin" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-[#12233F]/50 lg:hidden" />}
            <aside className={`fixed bottom-0 left-0 top-20 z-30 w-72 overflow-y-auto border-r-2 border-[#12233F] bg-[#12233F] px-4 py-6 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                {GROUPS.map((g) => (
                    <nav key={g.label} className="mb-7" aria-label={g.label}>
                        <p className="mb-2.5 px-3 text-xs font-bold text-white/50">{g.label}</p>
                        {g.items.map((i) => (
                            <NavLink key={i.text + i.to} to={i.to} end={i.end} onClick={() => setOpen(false)} className={({ isActive }) => cls(isActive)}><Icon name={i.icon} className="h-[18px] w-[18px] shrink-0" />{i.text}</NavLink>
                        ))}
                    </nav>
                ))}
                <p className="mx-3 mt-10 border-t-2 border-white/15 pt-4 text-xs leading-5 text-white/45">Panel pengelola transportasi Kota Bogor.</p>
            </aside>

            <main className="min-h-screen pt-20 lg:pl-72"><div className="p-4 sm:p-6 lg:p-8"><Outlet /></div></main>

            {confirmOut && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button type="button" aria-label="Tutup konfirmasi" onClick={() => setConfirmOut(false)} className="absolute inset-0 bg-[#12233F]/55" />
                    <div role="dialog" aria-modal="true" aria-labelledby="logout-title" className="relative w-full max-w-sm border-2 border-[#12233F] bg-[#F7F4EA] p-6 shadow-[6px_6px_0_#12233F]">
                        <span className="grid h-11 w-11 place-items-center border-2 border-[#12233F] bg-red-100 text-red-700"><Icon name="logout" className="h-5 w-5" /></span>
                        <h2 id="logout-title" className="mt-4 font-pixel text-3xl font-semibold text-[#1B3A8C]">Keluar dari Admin?</h2>
                        <p className="mt-2 text-sm leading-6 text-gray-600">Sesi Anda akan diakhiri. Untuk membuka panel ini lagi, masuk kembali dengan akun admin.</p>
                        <div className="mt-6 flex gap-3">
                            <button type="button" onClick={() => setConfirmOut(false)} className="h-11 flex-1 border-2 border-[#12233F] bg-white text-sm font-extrabold text-[#12233F] transition-colors hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]">Batal</button>
                            <button type="button" onClick={() => { session.clear(); nav('/admin/login', { replace: true }) }} className="h-11 flex-1 border-2 border-[#12233F] bg-red-700 text-sm font-extrabold text-white transition-colors hover:bg-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]">Keluar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
