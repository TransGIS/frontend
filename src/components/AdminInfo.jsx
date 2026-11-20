import { Link, Navigate, useParams } from 'react-router-dom'
import { Icon } from './AdminUi'

const TITLE = { biskita: 'BisKita Trans Pakuan', angkot: 'Trayek Angkot Bogor' }

/* Halaman placeholder — UI info tarif & rute akan menyusul. */
export default function AdminInfo() {
    const { kind } = useParams()
    if (!TITLE[kind]) return <Navigate to="/admin/dasbor" replace />
    return (
        <div className="max-w-[1100px]">
            <nav aria-label="Breadcrumb" className="text-xs text-gray-500 flex gap-2"><Link to="/admin/dasbor" className="hover:underline">Beranda</Link>›<span>Info Tarif &amp; Rute</span>›<span className="text-blue-600">{TITLE[kind]}</span></nav>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">Info Tarif &amp; Rute — {TITLE[kind]}</h1>
            <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <span className="mx-auto w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Icon name={kind === 'biskita' ? 'bus' : 'van'} className="w-6 h-6" /></span>
                <p className="mt-4 text-sm font-bold text-gray-800">Halaman sedang disiapkan</p>
                <p className="mt-1 text-sm text-gray-500">Tampilan info tarif &amp; rute untuk {TITLE[kind]} akan menyusul.</p>
            </div>
        </div>
    )
}