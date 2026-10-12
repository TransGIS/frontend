import { useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { session } from '../lib/adminApi'
import { Icon, Logo } from './AdminUi'

const GROUPS = [
    { label: 'Utama', items: [{ to: '/admin', end: true, icon: 'grid', text: 'Dashboard' }] },
    {
        label: 'Manajemen Trayek', items: [
            { to: '/admin/trayek/biskita', icon: 'bus', text: 'BisKita Trans Pakuan' },
            { to: '/admin/trayek/angkot', icon: 'van', text: 'Trayek Angkot Bogor' },
        ]
    },
    {
        label: 'Info Tarif & Rute', items: [
            { href: '/#tarif', icon: 'bus', text: 'BisKita Trans Pakuan' },
            { href: '/#tarif', icon: 'van', text: 'Trayek Angkot Bogor' },
        ]
    },
]

export default function AdminLayout() {
    const s = session.get()
    const nav = useNavigate()
    const [open, setOpen] = useState(false)
    if (!s) return <Navigate to="/admin/login" replace />
    const initials = (s.user?.name || 'AD').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    const cls = (active) => `flex items-center gap-3 px-3 h-10 rounded-lg text-sm transition-colors ${active ? 'bg-[#EA580C] text-white font-semibold' : 'text-blue-50 hover:bg-white/10'}`

    return (
        <div className="min-h-screen bg-[#F0F2F7] text-gray-900">
            <header className="fixed top-0 inset-x-0 z-40 h-[72px] bg-white flex items-center gap-3 px-4 sm:px-8 border-b border-gray-100">
                <button type="button" onClick={() => setOpen(!open)} aria-label="Buka menu" className="lg:hidden p-2 -ml-2 text-gray-600"><Icon name="menu" className="w-6 h-6" /></button>
                <Logo />
                <label className="hidden md:flex items-center gap-2 ml-auto w-96 max-w-[40%] h-10 rounded-lg bg-slate-100 px-3 focus-within:ring-2 focus-within:ring-[#1D4ED8]">
                    <Icon name="search" className="text-slate-400" />
                    <input placeholder="Cari rute, nomor trayek, koridor, atau halte..." className="flex-1 bg-transparent text-xs outline-none placeholder-slate-400" />
                </label>
                <div className="flex items-center gap-4 ml-auto md:ml-4">
                    <button type="button" aria-label="Notifikasi" className="relative text-slate-500"><Icon name="bell" className="w-5 h-5" /><span className="absolute -top-0.5 right-0 w-2 h-2 rounded-full bg-orange-500" /></button>
                    <span className="hidden sm:block w-px h-8 bg-gray-200" />
                    <button type="button" onClick={() => { session.clear(); nav('/admin/login') }} title="Klik untuk keluar" className="flex items-center gap-3 text-left">
                        <span className="w-9 h-9 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">{initials}</span>
                        <span className="hidden sm:block leading-tight"><b className="block text-xs">{s.user?.name}</b><span className="text-[11px] text-gray-500">{s.user?.role}</span></span>
                        <Icon name="chevron" className="hidden sm:block w-3.5 h-3.5 text-gray-400" />
                    </button>
                </div>
            </header>

            {open && <button type="button" aria-label="Tutup menu" onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 z-30 bg-black/40" />}
            <aside className={`fixed z-30 top-[72px] bottom-0 left-0 w-72 bg-[#1D4ED8] px-4 py-7 overflow-y-auto transition-transform ${open ? '' : '-translate-x-full'} lg:translate-x-0`}>
                {GROUPS.map((g) => (
                    <nav key={g.label} className="mb-6" aria-label={g.label}>
                        <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wide text-white">{g.label}</p>
                        {g.items.map((i) => i.to ? (
                            <NavLink key={i.text + i.to} to={i.to} end={i.end} onClick={() => setOpen(false)} className={({ isActive }) => cls(isActive)}><Icon name={i.icon} className="w-[18px] h-[18px]" />{i.text}</NavLink>
                        ) : (
                            <a key={i.text + i.href} href={i.href} className={cls(false)}><Icon name={i.icon} className="w-[18px] h-[18px]" />{i.text}</a>
                        ))}
                    </nav>
                ))}
            </aside>

            <main className="pt-[72px] lg:pl-72"><div className="p-4 sm:p-8"><Outlet /></div></main>
        </div>
    )
}