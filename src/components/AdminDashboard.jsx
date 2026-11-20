import { useEffect, useState } from 'react'
import { adminApi } from '../lib/adminApi'
import { FilterSelect, Icon } from './AdminUi'
import AdminVisitorChart from './AdminVisitorChart'

const TYPE = {
    'Penambahan Rute': 'border-emerald-700 bg-emerald-50 text-emerald-800',
    'Perubahan Rute': 'border-[#1B3A8C] bg-[#EAF0FF] text-[#1B3A8C]',
    'Penghapusan Rute': 'border-[#C2410C] bg-orange-50 text-[#9A3412]',
}

const RANGES = {
    '7d': { label: '7 hari', description: 'tujuh hari terakhir' },
    '1m': { label: '1 bulan', description: '30 hari terakhir' },
    '6m': { label: '6 bulan', description: '182 hari terakhir' },
    '1y': { label: '1 tahun', description: '365 hari terakhir' },
}
const RANGE_OPTIONS = Object.entries(RANGES).map(([value, item]) => ({ value, label: item.label, hint: item.description }))

const deltaOf = (value) => (value ? `${value > 0 ? '+' : ''}${value}%` : undefined)
const longDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

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

export default function AdminDashboard() {
    const [d, setD] = useState(null)
    const [err, setErr] = useState('')
    const [range, setRange] = useState('7d')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true
        setLoading(true)
        setErr('')
        adminApi.dashboard(range)
            .then((data) => { if (active) setD(data) })
            .catch((e) => { if (active) setErr(e.message) })
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [range])

    if (err && !d) return <p role="alert" className="border-2 border-red-800 bg-red-50 p-4 text-sm font-semibold text-red-800 shadow-[3px_3px_0_#7F1D1D]">Data dashboard gagal dimuat: {err}</p>
    if (!d) return <p className="border-2 border-[#12233F] bg-white p-5 text-sm font-semibold text-gray-600 shadow-[3px_3px_0_#12233F]">Memuat ringkasan…</p>

    const unique = d.unique || { total: 0, delta: 0 }
    const visits = d.visits || { total: 0, delta: 0 }
    const currentRange = d.range || range
    const series = Array.isArray(d.series) ? d.series : []
    const validSeries = series.length > 0 && series.every((point) => typeof point?.date === 'string'
        && Number.isFinite(point.visits) && Number.isFinite(point.unique))
    const peak = validSeries ? series.reduce((a, b) => (b.visits > a.visits ? b : a), series[0]) : null
    const hasData = visits.total > 0 || unique.total > 0

    return (
        <div className="max-w-[1200px]">
            <div className="mb-7">
                <h1 className="font-pixel text-4xl font-semibold leading-tight text-[#1B3A8C] sm:text-5xl">Ringkasan Transportasi</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">Pantau data BisKita, angkot, kunjungan portal, dan perubahan rute Kota Bogor.</p>
            </div>

            {err && <p role="alert" className="mb-5 border-2 border-red-800 bg-red-50 p-3 text-xs font-semibold text-red-800">Periode baru gagal dimuat: {err}. Data sebelumnya tetap ditampilkan.</p>}

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Stat title="Total Rute BisKita" icon="bus" tone={{ bg: 'bg-orange-100', text: 'text-[#C2410C]' }} value={d.biskita.total} unit="Rute" badge={d.biskita.baru ? `+${d.biskita.baru} baru` : undefined} foot={<>Tarif: <b className="text-[#12233F]">{d.biskita.tarif}</b></>} />
                <Stat title="Total Rute Angkot" icon="van" tone={{ bg: 'bg-emerald-100', text: 'text-emerald-800' }} value={d.angkot.total} unit="Trayek resmi" badge={d.angkot.baru ? `+${d.angkot.baru} baru` : undefined} foot={<>Tarif: <b className="text-[#12233F]">{d.angkot.tarif}</b></>} />
                <Stat title="Kunjungan Web" icon="trend" tone={{ bg: 'bg-[#EAF0FF]', text: 'text-[#1B3A8C]' }} value={visits.total} badge={deltaOf(visits.delta)} foot={`${RANGES[currentRange].label} terakhir`} footRight="Per pembukaan tab" />
                <Stat title="Pengunjung Unik" icon="users" tone={{ bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]' }} value={unique.total} badge={deltaOf(unique.delta)} foot={unique.total ? 'Cookie anonim' : 'Belum ada persetujuan cookie'} footRight={RANGES[currentRange].label} />
            </div>

            <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <section className="min-w-0 border-2 border-[#12233F] bg-white p-5 shadow-[4px_4px_0_#12233F] sm:p-6" aria-busy={loading}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="font-pixel text-3xl font-semibold text-[#1B3A8C]">Statistik Pengunjung</h2>
                            <p className="mt-1 text-xs leading-5 text-gray-500">Kunjungan dan pengunjung unik portal publik TransGIS, {RANGES[currentRange].description}.</p>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <span className="text-xs font-extrabold text-[#12233F]">Periode</span>
                            <FilterSelect
                                label="Periode statistik"
                                icon="calendar"
                                value={range}
                                options={RANGE_OPTIONS}
                                onChange={setRange}
                                align="right"
                                disabled={loading}
                                className="w-44"
                            />
                            {loading && <span className="text-xs font-semibold text-gray-500">Memuat…</span>}
                        </div>
                    </div>

                    <p className="mb-3 mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                        <span className="flex items-center gap-2"><span className="inline-block h-3 w-6 border-b-[3px] border-[#1B3A8C]" /><b>Kunjungan</b></span>
                        <span className="flex items-center gap-2"><span className="inline-block h-3 w-6 border-b-[3px] border-[#F97316]" /><b>Pengunjung unik harian</b></span>
                        {visits.total > 0 && <span className="text-gray-500">Rata-rata {(visits.total / Math.max(1, series.length)).toFixed(1)} kunjungan per hari</span>}
                    </p>

                    {!validSeries ? (
                        <p role="alert" className="border-2 border-red-800 bg-red-50 px-4 py-8 text-center text-sm leading-6 text-red-800">Format data statistik belum sesuai. Restart backend, lalu muat ulang halaman ini.</p>
                    ) : hasData ? (
                        <>
                            <AdminVisitorChart series={series} range={currentRange} />
                            {visits.total > 0 && <p className="mt-3 flex gap-2 border-t-2 border-[#12233F]/10 pt-3 text-xs leading-5 text-gray-600"><Icon name="trend" className="h-4 w-4 shrink-0 text-[#F97316]" />Kunjungan tertinggi terjadi pada {longDate(peak.date)} dengan {peak.visits} kunjungan.</p>}
                        </>
                    ) : (
                        <p className="border-2 border-dashed border-[#12233F]/25 bg-[#F7F4EA] px-4 py-10 text-center text-sm leading-6 text-gray-500">Belum ada kunjungan pada periode ini. Grafik terisi otomatis saat halaman publik dibuka.</p>
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