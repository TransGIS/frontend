import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminApi } from '../lib/adminApi'
import { Icon } from './AdminUi'
import { RouteMapModal } from './AdminRouteMap'

const PER = 5
const KIND = { biskita: ['BisKita Trans Pakuan', 'koridor', 'Koridor BisKita Trans Pakuan'], angkot: ['Trayek Angkot Bogor', 'trayek', 'Trayek Angkot Bogor'] }
const sel = 'h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-[#1D4ED8]'

export default function AdminTrayek() {
    const { kind = 'biskita' } = useParams()
    const k = KIND[kind] ? kind : 'biskita'
    const [title] = [KIND[k][0]]
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
        return (rows || []).filter((r) => !s || `${r.kode} ${r.from} ${r.to} ${r.via || ""}`.toLowerCase().includes(s))
    }, [rows, q])
    const pages = Math.max(1, Math.ceil(list.length / PER))
    const cur = Math.min(page, pages)
    const vis = list.slice((cur - 1) * PER, cur * PER)

    const confirmDelete = async () => {
        try { await adminApi.remove(k, toDelete.id); setToDelete(null); load() } catch (e) { setErr(e.message); setToDelete(null) }
    }

    return (
        <div className="max-w-[1100px]">
            <nav aria-label="Breadcrumb" className="text-xs text-gray-500 flex gap-2"><Link to="/admin" className="hover:underline">Beranda</Link>›<span>Manajemen Trayek</span>›<span className="text-blue-600">{title}</span></nav>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                <div><h1 className="text-2xl font-bold tracking-tight">Manajemen {title}</h1>
                    <p className="text-sm text-gray-600 mt-1 max-w-2xl">Pengelolaan data {KIND[k][1]}, rute operasional, titik halte, jadwal headway, dan armada Kota Bogor.</p></div>
                <Link to={`/admin/trayek/${k}/baru`} className="h-10 px-4 rounded-lg bg-[#EA580C] hover:bg-orange-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors"><Icon name="plus" />Tambah Rute / Halte</Link>
            </div>

            <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap gap-3">
                <label className="flex-1 min-w-[220px] flex items-center gap-2 h-10 rounded-lg border border-gray-200 bg-slate-50 px-3 focus-within:ring-2 focus-within:ring-[#1D4ED8]">
                    <Icon name="search" className="text-slate-400" />
                    <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Cari nomor koridor, nama trayek, atau terminal..." className="flex-1 bg-transparent text-xs outline-none placeholder-slate-400" />
                </label>
                <select className={sel} aria-label="Status"><option>Aktif Normal</option><option>Nonaktif</option></select>
                <select className={sel} aria-label="Arah layanan"><option>Arah Layanan: Semua</option><option>Pergi</option><option>Pulang</option></select>
                <button type="button" className={`${sel} inline-flex items-center gap-2 font-medium`}><Icon name="filter" />Filter Lanjutan</button>
                <button type="button" onClick={load} aria-label="Muat ulang" className={`${sel} px-2.5`}><Icon name="refresh" /></button>
            </div>

            <div className="mt-5 bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {err && <p role="alert" className="m-4 text-sm text-red-700 bg-red-50 rounded-xl p-3">{err}</p>}
                {!rows && !err ? <p className="p-6 text-sm text-gray-500">Memuat data trayek…</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[760px]">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-gray-600 border-b border-gray-200">
                                <tr><th className="py-4 pl-6 w-24">Kode</th><th>Nama Trayek / Hubungan Koridor</th><th className="text-center">Halte</th><th className="text-center">Estimasi</th><th>Tarif</th><th className="text-center pr-6">Aksi</th></tr>
                            </thead>
                            <tbody>
                                {vis.map((r) => (
                                    <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-slate-50/60">
                                        <td className="py-4 pl-6"><span className="inline-flex min-w-9 h-7 px-2 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: r.color }}>{r.kode}</span></td>
                                        <td className="py-3 pr-4"><p className="text-sm font-semibold">{r.from}{r.to && <><span className="text-gray-400"> ⇌ </span>{r.to}</>}</p>{r.via && <p className="text-xs text-gray-500 mt-0.5">Via {r.via}</p>}</td>
                                        <td className="text-center">{r.halte ? <><b className="text-sm block">{r.halte}</b><span className="text-[11px] text-gray-400">Shelter</span></> : <span className="text-xs text-gray-400">—</span>}</td>
                                        <td className="text-center"><span className="inline-block rounded bg-slate-100 px-2 py-1 text-xs font-semibold whitespace-nowrap">{r.estimasi}</span></td>
                                        <td className="text-sm font-semibold whitespace-nowrap">{r.tarif}</td>
                                        <td className="pr-6"><div className="flex justify-center gap-3 text-[#1D4ED8]">
                                            <button type="button" onClick={() => setMapRow(r)} aria-label={`Lihat peta ${r.kode}`} className="hover:text-blue-900"><Icon name="map" className="w-[18px] h-[18px]" /></button>
                                            <Link to={`/admin/trayek/${k}/${encodeURIComponent(r.id)}/ubah`} aria-label={`Ubah ${r.kode}`} className="text-gray-600 hover:text-gray-900"><Icon name="edit" className="w-[18px] h-[18px]" /></Link>
                                            <button type="button" onClick={() => setToDelete(r)} aria-label={`Hapus ${r.kode}`} className="text-red-500 hover:text-red-700"><Icon name="trash" className="w-[18px] h-[18px]" /></button>
                                        </div></td>
                                    </tr>
                                ))}
                                {rows && !vis.length && <tr><td colSpan={6} className="p-8 text-center text-sm text-gray-500">Tidak ada {KIND[k][1]} yang cocok dengan “{q}”.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
                {rows && (
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-gray-200 text-xs text-gray-600">
                        <p>Menampilkan <b>{list.length ? (cur - 1) * PER + 1 : 0} - {(cur - 1) * PER + vis.length}</b> dari <b>{list.length}</b> {KIND[k][2]}</p>
                        <div className="flex gap-1.5">
                            <button type="button" disabled={cur === 1} onClick={() => setPage(cur - 1)} className="h-8 px-3 rounded-md border border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed">Sebelumnya</button>
                            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                                <button key={n} type="button" onClick={() => setPage(n)} aria-current={n === cur ? 'page' : undefined} className={`h-8 w-8 rounded-md border font-semibold ${n === cur ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white' : 'border-gray-200 hover:bg-gray-50'}`}>{n}</button>
                            ))}
                            <button type="button" disabled={cur === pages} onClick={() => setPage(cur + 1)} className="h-8 px-3 rounded-md border border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed">Selanjutnya</button>
                        </div>
                    </div>
                )}
            </div>

            {mapRow && <RouteMapModal route={mapRow} onClose={() => setMapRow(null)} />}

            {toDelete && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setToDelete(null)}>
                    <div role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm">
                        <h2 className="font-bold">Hapus trayek {toDelete.kode}?</h2>
                        <p className="text-sm text-gray-600 mt-2">{toDelete.from}{toDelete.to && ` ⇌ ${toDelete.to}`} akan dihapus dari daftar. Tindakan ini tidak bisa dibatalkan.</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setToDelete(null)} className="h-10 px-4 rounded-lg border border-gray-200 text-sm font-medium">Batal</button>
                            <button type="button" onClick={confirmDelete} className="h-10 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold">Hapus trayek</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}