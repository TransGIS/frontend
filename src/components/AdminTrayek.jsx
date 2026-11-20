import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminApi } from '../lib/adminApi'
import { Icon } from './AdminUi'
import { RouteMapModal } from './AdminRouteMap'

const PER = 5
const KIND = { biskita: ['BisKita Trans Pakuan', 'koridor', 'Koridor BisKita Trans Pakuan'], angkot: ['Trayek Angkot Bogor', 'trayek', 'Trayek Angkot Bogor'] }
const sel = 'h-11 border-2 border-[#12233F]/25 bg-white px-3 text-xs font-semibold text-[#12233F] outline-none transition-colors hover:border-[#1B3A8C] focus:border-[#1B3A8C] focus:ring-2 focus:ring-[#1B3A8C]/15'

export default function AdminTrayek() {
    const { kind = 'biskita' } = useParams()
    const k = KIND[kind] ? kind : 'biskita'
    const title = KIND[k][0]
    const [rows, setRows] = useState(null)
    const [err, setErr] = useState('')
    const [q, setQ] = useState('')
    const [page, setPage] = useState(1)
    const [toDelete, setToDelete] = useState(null)
    const [mapRow, setMapRow] = useState(null)

    const load = () => { setRows(null); setErr(''); adminApi.trayek(k).then((r) => setRows(r.items)).catch((e) => setErr(e.message)) }
    useEffect(() => { load(); setQ(''); setPage(1) }, [k])

    const list = useMemo(() => {
        const s = q.trim().toLowerCase()
        return (rows || []).filter((r) => !s || `${r.kode} ${r.from} ${r.to} ${r.via || ''}`.toLowerCase().includes(s))
    }, [rows, q])
    const pages = Math.max(1, Math.ceil(list.length / PER))
    const cur = Math.min(page, pages)
    const vis = list.slice((cur - 1) * PER, cur * PER)

    const confirmDelete = async () => {
        try { await adminApi.remove(k, toDelete.id); setToDelete(null); load() } catch (e) { setErr(e.message); setToDelete(null) }
    }

    return (
        <div className="max-w-[1200px]">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <Link to="/admin/dasbor" className="font-semibold text-[#1B3A8C] hover:text-[#F97316]">Beranda</Link><span aria-hidden="true">›</span><span>Manajemen Trayek</span><span aria-hidden="true">›</span><span className="font-semibold text-[#12233F]">{title}</span>
            </nav>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="max-w-3xl font-pixel text-4xl font-semibold leading-[1.05] text-[#1B3A8C] sm:text-5xl">Manajemen {title}</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">Kelola data {KIND[k][1]}, rute operasional, titik halte, jadwal, dan armada Kota Bogor.</p>
                </div>
                <Link to={`/admin/trayek/${k}/baru`} className="inline-flex h-11 w-full items-center justify-center gap-2 border-2 border-[#12233F] bg-[#1B3A8C] px-4 text-xs font-extrabold text-white shadow-[4px_4px_0_#F97316] transition-colors hover:bg-[#12233F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] sm:w-auto"><Icon name="plus" />Tambah Rute / Halte</Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-3 border-2 border-[#12233F] bg-white p-4 shadow-[4px_4px_0_#12233F]">
                <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2.5 border-2 border-[#12233F]/25 bg-[#F7F4EA] px-3 transition-colors focus-within:border-[#1B3A8C] focus-within:ring-2 focus-within:ring-[#1B3A8C]/15">
                    <Icon name="search" className="shrink-0 text-[#F97316]" />
                    <input aria-label="Cari trayek" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Cari nomor koridor, nama trayek, atau terminal..." className="min-w-0 flex-1 bg-transparent text-xs font-medium text-[#12233F] outline-none placeholder:font-normal placeholder:text-gray-400" />
                </label>
                <select className={sel} aria-label="Status"><option>Aktif Normal</option><option>Nonaktif</option></select>
                <select className={sel} aria-label="Arah layanan"><option>Arah Layanan: Semua</option><option>Pergi</option><option>Pulang</option></select>
                <button type="button" className={`${sel} inline-flex items-center justify-center gap-2`}><Icon name="filter" className="text-[#F97316]" />Filter Lanjutan</button>
                <button type="button" onClick={load} aria-label="Muat ulang" className={`${sel} grid w-11 place-items-center px-0`}><Icon name="refresh" /></button>
            </div>

            <div className="mt-6 border-2 border-[#12233F] bg-white shadow-[4px_4px_0_#12233F]">
                {err && <p role="alert" className="m-4 border-l-4 border-red-700 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">{err}</p>}
                {!rows && !err ? <p className="p-6 text-sm font-semibold text-gray-500">Memuat data trayek…</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[780px] text-left">
                            <thead className="border-b-2 border-[#12233F] bg-[#12233F] text-xs font-extrabold text-white">
                                <tr><th className="w-24 py-4 pl-6">Kode</th><th>Nama Trayek / Hubungan Koridor</th><th className="text-center">Halte</th><th className="text-center">Estimasi</th><th>Tarif</th><th className="pr-6 text-center">Aksi</th></tr>
                            </thead>
                            <tbody>
                                {vis.map((r) => (
                                    <tr key={r.id} className="border-b-2 border-[#12233F]/10 transition-colors last:border-0 hover:bg-[#F7F4EA]">
                                        <td className="py-4 pl-6"><span className="inline-flex h-8 min-w-10 items-center justify-center border-2 border-[#12233F] px-2 text-xs font-extrabold text-white" style={{ background: r.color }}>{r.kode}</span></td>
                                        <td className="py-3 pr-4"><p className="text-sm font-extrabold leading-5 text-[#12233F]">{r.from}{r.to && <><span className="text-[#F97316]"> ⇌ </span>{r.to}</>}</p>{r.via && <p className="mt-1 text-xs text-gray-500">Via {r.via}</p>}</td>
                                        <td className="text-center">{r.halte ? <><b className="block text-sm text-[#12233F]">{r.halte}</b><span className="text-[11px] text-gray-400">halte</span></> : <span className="text-xs text-gray-400">—</span>}</td>
                                        <td className="text-center"><span className="inline-block whitespace-nowrap border border-[#12233F]/20 bg-[#F7F4EA] px-2 py-1 text-xs font-bold text-[#12233F]">{r.estimasi}</span></td>
                                        <td className="whitespace-nowrap text-sm font-extrabold text-[#12233F]">{r.tarif}</td>
                                        <td className="pr-6"><div className="flex justify-center gap-2">
                                            <button type="button" onClick={() => setMapRow(r)} aria-label={`Lihat peta ${r.kode}`} title={`Lihat peta ${r.kode}`} className="grid h-9 w-9 place-items-center border-2 border-[#12233F]/20 text-[#1B3A8C] transition-colors hover:border-[#12233F] hover:bg-[#EAF0FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"><Icon name="map" className="h-[18px] w-[18px]" /></button>
                                            <Link to={`/admin/trayek/${k}/${encodeURIComponent(r.id)}/ubah`} aria-label={`Ubah ${r.kode}`} title={`Ubah ${r.kode}`} className="grid h-9 w-9 place-items-center border-2 border-[#12233F]/20 text-gray-600 transition-colors hover:border-[#12233F] hover:bg-white hover:text-[#12233F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"><Icon name="edit" className="h-[18px] w-[18px]" /></Link>
                                            <button type="button" onClick={() => setToDelete(r)} aria-label={`Hapus ${r.kode}`} title={`Hapus ${r.kode}`} className="grid h-9 w-9 place-items-center border-2 border-red-200 text-red-600 transition-colors hover:border-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"><Icon name="trash" className="h-[18px] w-[18px]" /></button>
                                        </div></td>
                                    </tr>
                                ))}
                                {rows && !vis.length && <tr><td colSpan={6} className="p-8 text-center text-sm text-gray-500">Tidak ada {KIND[k][1]} yang cocok dengan “{q}”.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
                {rows && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#12233F] bg-[#F7F4EA] px-5 py-4 text-xs text-gray-600">
                        <p>Menampilkan <b className="text-[#12233F]">{list.length ? (cur - 1) * PER + 1 : 0}–{(cur - 1) * PER + vis.length}</b> dari <b className="text-[#12233F]">{list.length}</b> {KIND[k][2]}</p>
                        <div className="flex flex-wrap gap-1.5">
                            <button type="button" disabled={cur === 1} onClick={() => setPage(cur - 1)} className="h-9 border-2 border-[#12233F]/20 bg-white px-3 font-bold transition-colors hover:border-[#12233F] disabled:cursor-not-allowed disabled:text-gray-300">Sebelumnya</button>
                            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                                <button key={n} type="button" onClick={() => setPage(n)} aria-label={`Halaman ${n}`} aria-current={n === cur ? 'page' : undefined} className={`h-9 w-9 border-2 font-extrabold ${n === cur ? 'border-[#12233F] bg-[#1B3A8C] text-white shadow-[2px_2px_0_#F97316]' : 'border-[#12233F]/20 bg-white text-[#12233F] hover:border-[#12233F]'}`}>{n}</button>
                            ))}
                            <button type="button" disabled={cur === pages} onClick={() => setPage(cur + 1)} className="h-9 border-2 border-[#12233F]/20 bg-white px-3 font-bold transition-colors hover:border-[#12233F] disabled:cursor-not-allowed disabled:text-gray-300">Selanjutnya</button>
                        </div>
                    </div>
                )}
            </div>

            {mapRow && <RouteMapModal route={mapRow} onClose={() => setMapRow(null)} />}

            {toDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#12233F]/55 p-4" onClick={() => setToDelete(null)}>
                    <div role="alertdialog" aria-modal="true" aria-labelledby="delete-route-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-sm border-2 border-[#12233F] bg-[#F7F4EA] p-6 shadow-[6px_6px_0_#12233F]">
                        <span className="grid h-11 w-11 place-items-center border-2 border-[#12233F] bg-red-100 text-red-700"><Icon name="trash" className="h-5 w-5" /></span>
                        <h2 id="delete-route-title" className="mt-4 font-pixel text-3xl font-semibold text-[#1B3A8C]">Hapus trayek {toDelete.kode}?</h2>
                        <p className="mt-2 text-sm leading-6 text-gray-600">{toDelete.from}{toDelete.to && ` ⇌ ${toDelete.to}`} akan dihapus dari daftar. Tindakan ini tidak bisa dibatalkan.</p>
                        <div className="mt-6 flex gap-3">
                            <button type="button" onClick={() => setToDelete(null)} className="h-11 flex-1 border-2 border-[#12233F] bg-white text-sm font-extrabold text-[#12233F] transition-colors hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]">Batal</button>
                            <button type="button" onClick={confirmDelete} className="h-11 flex-1 border-2 border-[#12233F] bg-red-700 text-sm font-extrabold text-white transition-colors hover:bg-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]">Hapus trayek</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
