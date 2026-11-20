import { useEffect, useState } from 'react'
import { adminApi } from '../lib/adminApi'
import { Icon } from './AdminUi'

const TYPE = {
    'Penambahan Rute': 'border-emerald-700 bg-emerald-50 text-emerald-800',
    'Perubahan Rute': 'border-[#1B3A8C] bg-[#EAF0FF] text-[#1B3A8C]',
    'Penghapusan Rute': 'border-[#C2410C] bg-orange-50 text-[#9A3412]',
}

const deltaOf = (value) => (value ? `${value > 0 ? '+' : ''}${value}%` : undefined)

function Stat({ title, icon, tone, value, unit, badge, foot, footRight }) {
    return (
        <article className="flex flex-col border-2 border-[#12233F] bg-white p-5 shadow-[4px_4px_0_#12233F]">
            <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-extrabold leading-5 text-[#12233F]">{title}</h2>
                <span className={`grid h-10 w-10 shrink-0 place-items-center border-2 border-[#12233F] ${tone.bg} ${tone.text}`}><Icon name={icon} className="h-5 w-5" /></span>
            </div>
            <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className={`font-pixel text-5xl font-semibold leading-none ${tone.text}`}>{value}</span>
                {unit && <span className="text-xs font-semibold text-gray-500">{unit}</span>}
                {badge && <span className="border border-[#12233F]/25 bg-[#F7F4EA] px-1.5 py-0.5 text-[11px] font-extrabold text-[#12233F]">{badge}</span>}
            </p>
            <p className="mt-auto flex flex-wrap justify-between gap-2 border-t-2 border-[#12233F]/10 pt-4 text-xs text-gray-500"><span>{foot}</span>{footRight && <span className="font-semibold text-[#1B3A8C]">{footRight}</span>}</p>
        </article>
    )
}

function Chart({ series }) {
    const W = 640, H = 200, X0 = 50, top = 40
    const visits = series.map((s) => s[1] || 0)
    const uniques = series.map((s) => s[2] || 0)
    const max = Math.max(1, ...visits, ...uniques)
    const x = (i) => (series.length > 1 ? X0 + (i * (W - 2 * X0)) / (series.length - 1) : W / 2)
    const y = (v) => top + (1 - v / max) * (H - top - 10)
    const curve = (vals) => vals.map((v, i) => {
        if (!i) return `M${x(0)},${y(v)}`
        const qx = x(i - 1), qy = y(vals[i - 1]), px = x(i), py = y(v), mx = (qx + px) / 2
        return `C${mx},${qy} ${mx},${py} ${px},${py}`
    }).join(' ')
    const line = curve(visits)
    const peak = visits.indexOf(Math.max(...visits))
    const hasUnique = uniques.some((v) => v > 0)
    return (
        <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full" role="img" aria-label="Grafik kunjungan dan pengunjung unik 7 hari">
            <path d={`${line} L${x(visits.length - 1)},${H} L${x(0)},${H} Z`} fill="#1B3A8C" fillOpacity=".08" />
            {hasUnique && <path d={curve(uniques)} fill="none" stroke="#F97316" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" />}
            <path d={line} fill="none" stroke="#1B3A8C" strokeWidth="3" />
            {hasUnique && uniques.map((v, i) => <circle key={`u${i}`} cx={x(i)} cy={y(v)} r="3.5" fill="#F97316" stroke="#12233F" strokeWidth="1.5" />)}
            {visits.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="5" fill={i === peak ? '#F97316' : '#fff'} stroke="#12233F" strokeWidth="2" />)}
            <g transform={`translate(${x(peak) - 50},${Math.max(0, y(visits[peak]) - 34)})`}>
                <rect width="100" height="24" fill="#12233F" />
                <text x="50" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="'Plus Jakarta Sans', sans-serif">{visits[peak]} kunjungan</text>
            </g>
            {series.map(([l, v], i) => (
                <g key={l} textAnchor="middle" fontFamily="'Plus Jakarta Sans', sans-serif">
                    <text x={x(i)} y={H + 18} fontSize="12" fontWeight={i === peak ? 800 : 500} fill={i === peak ? '#12233F' : '#6B7280'}>{l}</text>
                    <text x={x(i)} y={H + 33} fontSize="10" fontWeight="700" fill={i === peak ? '#C2410C' : '#9CA3AF'}>{v}</text>
                </g>
            ))}
        </svg>
    )
}

export default function AdminDashboard() {
    const [d, setD] = useState(null)
    const [err, setErr] = useState('')
    useEffect(() => { adminApi.dashboard().then(setD).catch((e) => setErr(e.message)) }, [])
    if (err) return <p role="alert" className="border-2 border-red-800 bg-red-50 p-4 text-sm font-semibold text-red-800 shadow-[3px_3px_0_#7F1D1D]">Data dashboard gagal dimuat: {err}</p>
    if (!d) return <p className="border-2 border-[#12233F] bg-white p-5 text-sm font-semibold text-gray-600 shadow-[3px_3px_0_#12233F]">Memuat ringkasan…</p>

    const unique = d.unique || { total: 0, delta: 0 }
    const visits = d.visits || d.visitors || { total: 0, delta: 0 }
    const peak = d.series.reduce((a, b) => (b[1] > a[1] ? b : a))
    const hasData = visits.total > 0 || unique.total > 0

    return (
        <div className="max-w-[1200px]">
            <div className="mb-7">
                <h1 className="font-pixel text-4xl font-semibold leading-tight text-[#1B3A8C] sm:text-5xl">Ringkasan Transportasi</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">Pantau data BisKita, angkot, kunjungan portal, dan perubahan rute Kota Bogor.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Stat title="Total Rute BisKita" icon="bus" tone={{ bg: 'bg-orange-100', text: 'text-[#C2410C]' }} value={d.biskita.total} unit="Rute" badge={d.biskita.baru ? `+${d.biskita.baru} baru` : undefined} foot={<>Tarif: <b className="text-[#12233F]">{d.biskita.tarif}</b></>} />
                <Stat title="Total Rute Angkot" icon="van" tone={{ bg: 'bg-emerald-100', text: 'text-emerald-800' }} value={d.angkot.total} unit="Trayek resmi" badge={d.angkot.baru ? `+${d.angkot.baru} baru` : undefined} foot={<>Tarif: <b className="text-[#12233F]">{d.angkot.tarif}</b></>} />
                <Stat title="Kunjungan Web" icon="trend" tone={{ bg: 'bg-[#EAF0FF]', text: 'text-[#1B3A8C]' }} value={visits.total} badge={deltaOf(visits.delta)} foot="7 hari terakhir" footRight="Per pembukaan tab" />
                <Stat title="Pengunjung Unik" icon="users" tone={{ bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]' }} value={unique.total} badge={deltaOf(unique.delta)} foot={unique.total ? 'Cookie anonim' : 'Belum ada persetujuan cookie'} footRight="7 hari" />
            </div>

            <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <section className="min-w-0 border-2 border-[#12233F] bg-white p-5 shadow-[4px_4px_0_#12233F] sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="font-pixel text-3xl font-semibold text-[#1B3A8C]">Statistik Pengunjung</h2>
                            <p className="mt-1 text-xs leading-5 text-gray-500">Kunjungan dan pengunjung unik portal publik TransGIS, tujuh hari terakhir.</p>
                        </div>
                        <span className="border-2 border-[#12233F] bg-[#F97316] px-3 py-1 text-xs font-extrabold text-[#12233F]">7 hari</span>
                    </div>

                    <p className="mb-3 mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                        <span className="flex items-center gap-2"><span className="inline-block h-3 w-6 border-b-[3px] border-[#1B3A8C]" /><b>Kunjungan</b></span>
                        <span className="flex items-center gap-2"><span className="inline-block h-3 w-6 border-b-[3px] border-dashed border-[#F97316]" /><b>Pengunjung unik</b></span>
                        {visits.total > 0 && <span className="text-gray-500">Rata-rata {(visits.total / Math.max(1, d.series.length)).toFixed(1)} kunjungan per hari</span>}
                    </p>

                    {hasData ? (
                        <>
                            <Chart series={d.series} />
                            <p className="mt-3 flex gap-2 border-t-2 border-[#12233F]/10 pt-3 text-xs leading-5 text-gray-600"><Icon name="trend" className="h-4 w-4 shrink-0 text-[#F97316]" />Kunjungan tertinggi terjadi pada {peak[0]} dengan {peak[1]} kunjungan.</p>
                        </>
                    ) : (
                        <p className="border-2 border-dashed border-[#12233F]/25 bg-[#F7F4EA] px-4 py-10 text-center text-sm leading-6 text-gray-500">Belum ada kunjungan portal. Grafik terisi otomatis saat halaman publik dibuka.</p>
                    )}

                    {visits.total > 0 && unique.total === 0 && (
                        <p className="mt-3 border-l-4 border-[#F97316] bg-[#F7F4EA] px-3 py-2 text-xs leading-5 text-gray-600">Pengunjung unik belum terisi karena belum ada pengunjung yang menyetujui cookie.</p>
                    )}
                </section>

                <section className="border-2 border-[#12233F] bg-white p-5 shadow-[4px_4px_0_#12233F]">
                    <h2 className="flex items-center gap-3 font-pixel text-3xl font-semibold text-[#1B3A8C]"><span className="grid h-10 w-10 place-items-center border-2 border-[#12233F] bg-[#F97316] text-[#12233F]"><Icon name="route" /></span>Riwayat Rute</h2>
                    {d.history.length ? (
                        <ul className="mt-5 space-y-3">
                            {d.history.map((h) => (
                                <li key={h.title} className="border-2 border-[#12233F]/15 bg-[#F7F4EA] p-3.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-extrabold leading-snug text-[#12233F]">{h.title}</p>
                                        <span className={`shrink-0 border px-2 py-0.5 text-[10px] font-extrabold ${TYPE[h.type]}`}>{h.type}</span>
                                    </div>
                                    <p className="mt-2 text-xs leading-5 text-gray-600">{h.note}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-5 border-2 border-dashed border-[#12233F]/25 bg-[#F7F4EA] p-4 text-sm leading-6 text-gray-500">Belum ada aktivitas perubahan rute.</p>
                    )}
                </section>
            </div>
        </div>
    )
}