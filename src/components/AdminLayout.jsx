import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { adminApi, session } from '../lib/adminApi'
import { Icon, Logo } from './AdminUi'

const GROUPS = [
    { label: 'Utama', items: [{ to: '/admin/dasbor', icon: 'grid', text: 'Dashboard' }] },
    {
        label: 'Manajemen Trayek', items: [
            { to: '/admin/trayek/biskita', icon: 'bus', text: 'BisKita Trans Pakuan' },
            { to: '/admin/trayek/angkot', icon: 'van', text: 'Trayek Angkot Bogor' },
        ]
    },
]

const SEEN_KEY = 'transgis_notif_seen'
const NOTIF_STYLE = {
    create: { icon: 'plus', box: 'bg-emerald-100 text-emerald-800' },
    update: { icon: 'edit', box: 'bg-[#EAF0FF] text-[#1B3A8C]' },
    delete: { icon: 'trash', box: 'bg-orange-100 text-[#C2410C]' },
}

const relTime = (value) => {
    const time = new Date(value).getTime()
    if (!Number.isFinite(time)) return ''
    const diff = Math.max(0, Date.now() - time)
    const minute = 60 * 1000
    if (diff < minute) return 'baru saja'
    if (diff < 60 * minute) return `${Math.floor(diff / minute)} menit lalu`
    if (diff < 24 * 60 * minute) return `${Math.floor(diff / (60 * minute))} jam lalu`
    if (diff < 7 * 24 * 60 * minute) return `${Math.floor(diff / (24 * 60 * minute))} hari lalu`
    return new Date(time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminLayout() {
    const s = session.get()
    const nav = useNavigate()
    const [open, setOpen] = useState(false)
    const [confirmOut, setConfirmOut] = useState(false)
    const [notifOpen, setNotifOpen] = useState(false)
    const [notifs, setNotifs] = useState([])
    const [notifErr, setNotifErr] = useState('')
    const [notifLoading, setNotifLoading] = useState(true)
    const [seen, setSeen] = useState(() => {
        try { return localStorage.getItem(SEEN_KEY) || '' } catch { return '' }
    })
    const notifOpenRef = useRef(false)

    useEffect(() => { notifOpenRef.current = notifOpen }, [notifOpen])

    const loadNotifs = useCallback(async (markSeen = false) => {
        if (!session.get()) { setNotifLoading(false); return }
        try {
            const data = await adminApi.notifications(12)
            const list = Array.isArray(data.items) ? data.items : []
            setNotifs(list)
            setNotifErr('')
            if (markSeen) {
                const latest = list.reduce((max, n) => Math.max(max, new Date(n.at).getTime() || 0), 0)
                if (latest) {
                    const iso = new Date(latest).toISOString()
                    localStorage.setItem(SEEN_KEY, iso)
                    setSeen(iso)
                }
            }
        } catch (e) {
            setNotifErr(e.message)
        } finally {
            setNotifLoading(false)
        }
    }, [])

    useEffect(() => { loadNotifs() }, [loadNotifs])

    // Aksi tambah/ubah/hapus trayek memicu event ini agar lonceng langsung terbarui.
    useEffect(() => {
        const onActivity = () => loadNotifs(notifOpenRef.current)
        window.addEventListener('transgis:activity', onActivity)
        return () => window.removeEventListener('transgis:activity', onActivity)
    }, [loadNotifs])

    useEffect(() => {
        if (!notifOpen) return
        const onKey = (event) => { if (event.key === 'Escape') setNotifOpen(false) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [notifOpen])

    if (!s) return <Navigate to="/admin/login" replace />
    const initials = (s.user?.name || 'AD').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    const cls = (active) => `mb-1.5 flex min-h-11 items-center gap-3 border-2 px-3 py-2.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] ${active ? 'border-[#12233F] bg-[#F97316] font-extrabold text-[#12233F] shadow-[3px_3px_0_#F7F4EA]' : 'border-transparent font-semibold text-white/75 hover:border-white/20 hover:bg-white/10 hover:text-white'}`
    const seenTime = seen ? new Date(seen).getTime() : 0
    const unread = notifs.filter((n) => (new Date(n.at).getTime() || 0) > seenTime).length
    const toggleNotif = () => {
        const next = !notifOpen
        setNotifOpen(next)
        if (next) {
            setNotifLoading(true)
            loadNotifs(true)
        }
    }

    return (
        <div className="admin-page min-h-screen bg-[#F7F4EA] text-[#12233F]">
            <header className="fixed inset-x-0 top-0 z-40 flex h-20 items-center gap-3 border-b-2 border-[#12233F] bg-white px-4 sm:px-6 lg:px-8">
                <button type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Tutup menu admin' : 'Buka menu admin'} aria-expanded={open} className="-ml-1 grid aspect-square h-10 w-10 shrink-0 place-items-center border-2 border-[#12233F] text-[#12233F] transition-colors hover:bg-[#F97316] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] lg:hidden"><Icon name="menu" className="h-5 w-5" /></button>
                <Logo className="shrink-0" />
                <label className="ml-auto hidden h-11 w-96 min-w-0 max-w-[38%] items-center gap-2 border-2 border-[#12233F]/20 bg-[#F7F4EA] px-3 transition-colors focus-within:border-[#1B3A8C] focus-within:ring-2 focus-within:ring-[#1B3A8C]/15 md:flex">
                    <Icon name="search" className="shrink-0 text-[#F97316]" />
                    <input aria-label="Cari di panel admin" placeholder="Cari rute, trayek, koridor, atau halte..." className="min-w-0 flex-1 bg-transparent text-xs font-medium text-[#12233F] outline-none placeholder:font-normal placeholder:text-gray-400" />
                </label>
                <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 md:ml-4">
                    <button
                        type="button"
                        onClick={toggleNotif}
                        aria-label={unread ? `Notifikasi, ${unread} aktivitas baru` : 'Notifikasi'}
                        aria-expanded={notifOpen}
                        aria-haspopup="dialog"
                        className={`relative grid aspect-square h-10 w-10 shrink-0 place-items-center border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] ${notifOpen ? 'border-[#12233F] bg-[#F7F4EA] text-[#12233F]' : 'border-[#12233F]/20 text-[#12233F] hover:border-[#12233F] hover:bg-[#F7F4EA]'}`}
                    >
                        <Icon name="bell" className="h-5 w-5" />
                        {unread > 0 && <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center border-2 border-[#12233F] bg-[#F97316] px-1 text-[10px] font-extrabold leading-none text-[#12233F]">{unread > 9 ? '9+' : unread}</span>}
                    </button>
                    <button type="button" onClick={() => setConfirmOut(true)} title="Keluar dari panel admin" className="flex items-center gap-2.5 border-2 border-transparent p-1 text-left transition-colors hover:border-[#12233F]/20 hover:bg-[#F7F4EA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] sm:px-2">
                        <span className="grid h-9 w-9 shrink-0 place-items-center border-2 border-[#12233F] bg-[#1B3A8C] text-xs font-extrabold text-white">{initials}</span>
                        <span className="hidden leading-tight sm:block"><b className="block max-w-32 truncate text-xs text-[#12233F]">{s.user?.name}</b><span className="text-[11px] text-gray-500">{s.user?.role}</span></span>
                        <Icon name="logout" className="h-4 w-4 shrink-0 text-[#F97316]" />
                    </button>
                </div>
            </header>

            {notifOpen && (
                <>
                    <button type="button" aria-label="Tutup notifikasi" tabIndex={-1} onClick={() => setNotifOpen(false)} className="fixed inset-0 z-40 cursor-default bg-[#12233F]/25 sm:bg-[#12233F]/10" />
                    <div role="dialog" aria-label="Notifikasi aktivitas admin" className="fixed right-3 top-[86px] z-50 w-[min(24rem,calc(100vw-1.5rem))] border-2 border-[#12233F] bg-[#F7F4EA] shadow-[6px_6px_0_#12233F] sm:right-6">
                        <div className="flex items-start justify-between gap-3 border-b-2 border-[#12233F] bg-white px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <span className="grid h-9 w-9 place-items-center border-2 border-[#12233F] bg-[#F97316] text-[#12233F]"><Icon name="bell" className="h-4 w-4" /></span>
                                <div>
                                    <h2 className="font-pixel text-2xl font-semibold leading-none text-[#1B3A8C]">Notifikasi</h2>
                                    <p className="mt-1 text-[11px] font-semibold text-gray-500">Aktivitas tambah, ubah, dan hapus trayek</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setNotifOpen(false)} aria-label="Tutup notifikasi" className="grid h-8 w-8 shrink-0 place-items-center border-2 border-[#12233F]/20 text-[#12233F] transition-colors hover:border-[#12233F] hover:bg-[#F7F4EA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"><Icon name="close" className="h-4 w-4" /></button>
                        </div>

                        <div className="max-h-[min(60vh,26rem)] overflow-y-auto">
                            {notifErr ? (
                                <div className="p-4">
                                    <p role="alert" className="border-l-4 border-red-700 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{notifErr}</p>
                                    <button type="button" onClick={() => { setNotifLoading(true); loadNotifs(true) }} className="mt-3 h-9 w-full border-2 border-[#12233F] bg-white text-xs font-extrabold text-[#12233F] transition-colors hover:bg-[#F7F4EA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]">Coba lagi</button>
                                </div>
                            ) : notifLoading && !notifs.length ? (
                                <p className="p-5 text-xs font-semibold text-gray-500">Memuat notifikasi…</p>
                            ) : !notifs.length ? (
                                <p className="m-4 border-2 border-dashed border-[#12233F]/25 bg-white px-3 py-6 text-center text-xs leading-5 text-gray-500">Belum ada aktivitas. Notifikasi muncul setelah rute ditambah, diubah, atau dihapus.</p>
                            ) : (
                                <ul className="divide-y-2 divide-[#12233F]/10">
                                    {notifs.map((n) => {
                                        const style = NOTIF_STYLE[n.kind] || NOTIF_STYLE.update
                                        return (
                                            <li key={n.id} className={`flex gap-3 px-4 py-3 ${(new Date(n.at).getTime() || 0) > seenTime ? 'bg-white/70' : ''}`}>
                                                <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center border-2 border-[#12233F] ${style.box}`}><Icon name={style.icon} className="h-4 w-4" /></span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-xs font-extrabold text-[#12233F]">{n.label}</p>
                                                        <span className="shrink-0 text-[10px] font-semibold text-gray-500">{relTime(n.at)}</span>
                                                    </div>
                                                    <p className="mt-0.5 truncate text-xs font-semibold text-[#1B3A8C]">{n.route}</p>
                                                    {n.note && <p className="truncate text-[11px] text-gray-500">{n.note}</p>}
                                                    <p className="mt-1 text-[11px] text-gray-500">oleh {n.actor}</p>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>

                        <p className="border-t-2 border-[#12233F]/10 px-4 py-2.5 text-[11px] leading-4 text-gray-500">Tercatat otomatis dari aksi admin di menu Manajemen Trayek.</p>
                    </div>
                </>
            )}

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