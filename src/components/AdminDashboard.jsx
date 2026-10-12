import { useEffect, useState } from 'react'
import { adminApi } from '../lib/adminApi'
import { Icon } from './AdminUi'

const TYPE = { 'Penambahan Rute': 'bg-emerald-50 text-emerald-700 border-emerald-200', 'Perubahan Rute': 'bg-blue-50 text-blue-700 border-blue-200', 'Penghapusan Rute': 'bg-orange-50 text-orange-700 border-orange-200' }

function Stat({ title, icon, tone, value, unit, badge, foot, footRight }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
            <div className="flex items-start justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-700">{title}</p>
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone.bg} ${tone.text}`}><Icon name={icon} className="w-5 h-5" /></span>
            </div>
            <p className="mt-3 flex items-baseline gap-2"><span className={`text-4xl font-bold ${tone.text}`}>{value}</span><span className="text-xs text-gray-500">{unit}</span>
                {badge && <span className={`text-[11px] font-semibold rounded px-1.5 py-0.5 ${tone.bg}`}>{badge}</span>}</p>
            <p className="mt-auto pt-5 flex justify-between text-xs text-gray-500"><span>{foot}</span><span className="text-gray-400">{footRight}</span></p>
        </div>
    )
}

function Chart({ series }) {
    const W = 640, H = 200, X0 = 50, top = 40
    const max = Math.max(...series.map((s) => s[1]))
    const pts = series.map(([, v], i) => [X0 + (i * (W - 2 * X0)) / (series.length - 1), top + (1 - v / max) * (H - top - 10)])
    const peak = series.findIndex((s) => s[1] === max)
    const d = pts.map((p, i) => {
        if (!i) return `M${p[0]},${p[1]}`
        const q = pts[i - 1], mx = (q[0] + p[0]) / 2
        return `C${mx},${q[1]} ${mx},${p[1]} ${p[0]},${p[1]}`
    }).join(' ')
    return (
        <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full" role="img" aria-label="Grafik pengunjung web 7 hari">
            <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2563EB" stopOpacity=".3" /><stop offset="1" stopColor="#2563EB" stopOpacity="0" /></linearGradient></defs>
            <path d={`${d} L${pts.at(-1)[0]},${H} L${pts[0][0]},${H} Z`} fill="url(#fill)" />
            <path d={d} fill="none" stroke="#2563EB" strokeWidth="3" />
            {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="5" fill="#fff" stroke="#2563EB" strokeWidth="2.5" />)}
            <g transform={`translate(${pts[peak][0] - 50},${pts[peak][1] - 34})`}><rect width="100" height="24" rx="4" fill="#111827" /><text x="50" y="16" textAnchor="middle" fontSize="11" fill="#fff" fontFamily="monospace">{max}k (Puncak)</text></g>
            {series.map(([l, v], i) => (
                <g key={l} textAnchor="middle"><text x={pts[i][0]} y={H + 18} fontSize="12" fontWeight={i === peak ? 700 : 500} fill={i === peak ? '#111827' : '#6B7280'}>{l}</text>
                    <text x={pts[i][0]} y={H + 33} fontSize="10" fontFamily="monospace" fill={i === peak ? '#EA580C' : '#9CA3AF'}>{v}k</text></g>
            ))}
        </svg>
    )
}

export default function AdminDashboard() {
    const [d, setD] = useState(null)
    const [err, setErr] = useState('')
    useEffect(() => { adminApi.dashboard().then(setD).catch((e) => setErr(e.message)) }, [])
    if (err) return <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-xl p-4">Data dashboard gagal dimuat: {err}</p>
    if (!d) return <p className="text-sm text-gray-500">Memuat ringkasan…</p>
    const peak = d.series.reduce((a, b) => (b[1] > a[1] ? b : a))
    return (
        <div className="max-w-[1100px]">
            <h1 className="text-2xl font-bold tracking-tight">Ringkasan Sistem Transportasi</h1>
            <p className="text-sm text-gray-600 mb-6">Pemantauan Trayek Angkutan Massal &amp; Angkot Kota Bogor berbasis Geografis</p>

            <div className="grid gap-5 md:grid-cols-3">
                <Stat title="Total Rute BisKita" icon="bus" tone={{ bg: 'bg-orange-50', text: 'text-orange-600' }} value={d.biskita.total} unit="Rute" badge={d.biskita.baru ? `+${d.biskita.baru} Baru` : undefined} foot={<>Tarif Flat: <b className="text-gray-800">{d.biskita.tarif}</b></>} />
                <Stat title="Total Rute Angkot" icon="van" tone={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }} value={d.angkot.total} unit="Trayek Resmi" badge={d.angkot.baru ? `+${d.angkot.baru} Baru` : undefined} foot={<>Tarif: <b className="text-gray-800">{d.angkot.tarif}</b></>} />
                <Stat title="Pengunjung Web" icon="users" tone={{ bg: 'bg-blue-50', text: 'text-blue-600' }} value={d.visitors.total} badge={`+${d.visitors.delta}%`} foot="Dalam 7 Hari Terakhir" footRight="Portal Publik" />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
                <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><h2 className="text-base font-bold uppercase">Statistik Pengunjung Web</h2><p className="text-xs text-gray-500">Tren traffic dan aktivitas kunjungan portal web TransGIS harian</p></div>
                        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-xs font-medium"><span className="rounded bg-white px-3 py-1 font-bold shadow-sm">7 Hari</span><span className="px-3 py-1 text-gray-500">30 Hari</span><span className="px-3 py-1 text-gray-500">Bulan Ini</span></div>
                    </div>
                    <p className="mt-5 mb-3 text-xs"><span className="inline-block w-3 h-3 bg-blue-600 mr-2 align-middle" /><b>Pengunjung Web (Kunjungan Portal)</b><span className="text-gray-400"> • Rata-rata {(d.series.reduce((a, s) => a + s[1], 0) / d.series.length).toFixed(1)}k sesi per hari</span></p>
                    <Chart series={d.series} />
                    <p className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 flex gap-2"><Icon name="trend" className="w-4 h-4 text-blue-600 shrink-0" />Kunjungan tertinggi terjadi pada hari {peak[0]} ({peak[1]}k sesi/hari).</p>
                </section>

                <section className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h2 className="flex items-center gap-3 font-bold"><span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Icon name="route" /></span>Riwayat Rute</h2>
                    <ul className="mt-5 space-y-3">
                        {d.history.map((h) => (
                            <li key={h.title} className="rounded-xl bg-slate-50 border border-gray-100 p-3.5">
                                <div className="flex items-start justify-between gap-2"><p className="text-sm font-bold leading-snug">{h.title}</p><span className={`shrink-0 text-[11px] font-semibold border rounded-full px-2 py-0.5 ${TYPE[h.type]}`}>{h.type}</span></div>
                                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{h.note}</p>
                            </li>
                        ))}
                    </ul>
                    <button type="button" className="mt-4 w-full h-10 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors">Lihat semua perubahan ›</button>
                </section>
            </div>
        </div>
    )
}