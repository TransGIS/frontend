import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { adminApi, FORM_DEFAULTS } from '../lib/adminApi'
import { Icon } from './AdminUi'
import { RouteMap } from './AdminRouteMap'

const TITLE = { biskita: 'BisKita Trans Pakuan', angkot: 'Trayek Angkot Bogor' }
const JARINGAN = ['BisKita Trans Pakuan', 'Angkutan Kota Bogor', 'Angkutan Kabupaten Bogor']
const KENDARAAN = ['bus', 'angkot', 'minibus']
const HEX = /^#[0-9a-f]{6}$/i
const inp = 'w-full h-10 rounded-lg border border-gray-200 bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:bg-white'

/* Baca GeoJSON: garis → jalur, titik → halte, properti fitur pertama → isian otomatis */
function parseGeo(text) {
    const fc = JSON.parse(text)
    const feats = fc.type === 'FeatureCollection' ? fc.features : fc.type === 'Feature' ? [fc] : [{ properties: {}, geometry: fc }]
    const parts = []
    const stops = []
    let props = null
    for (const f of feats) {
        const g = f.geometry
        const p = f.properties || {}
        if (!g) continue
        if (/LineString$/.test(g.type)) {
            const lines = g.type === 'LineString' ? [g.coordinates] : g.coordinates
            lines.forEach((l) => { if (l.length > 1) parts.push(l.map((c) => [c[1], c[0]])) })
            if (!props) props = p
        } else if (g.type === 'Point') {
            stops.push({ pos: [g.coordinates[1], g.coordinates[0]], name: p.name || `Halte ${stops.length + 1}` })
        }
    }
    if (!parts.length) throw new Error('Tidak ada garis (LineString) di file ini.')
    return { parts, stops, props: props || {} }
}

const Card = ({ title, children }) => (
    <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#1D4ED8] mb-4">{title}</h2>
        <div className="space-y-3.5">{children}</div>
    </section>
)
const F = ({ label, children }) => (
    <label className="block"><span className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</span>{children}</label>
)
const Select = ({ value, onChange, options }) => (
    <select value={value} onChange={onChange} className={inp}>
        {[...new Set([value, ...options].filter(Boolean))].map((o) => <option key={o}>{o}</option>)}
    </select>
)
const Color = ({ value, onChange, label }) => (
    <div className="flex gap-2">
        <input value={value} onChange={onChange} maxLength={7} className={inp} />
        <input type="color" value={HEX.test(value) ? value : '#000000'} onChange={onChange} aria-label={label}
            className="h-10 w-12 shrink-0 rounded-lg border border-gray-200 bg-white p-1 cursor-pointer" />
    </div>
)

export default function AdminTrayekForm() {
    const { kind: k, id } = useParams()
    const kind = TITLE[k] ? k : 'biskita'
    const edit = Boolean(id)
    const nav = useNavigate()
    const [f, setF] = useState(() => ({
        nama: '', kode: '', kodeLama: '', from: '', to: '', via: '', ...FORM_DEFAULTS[kind],
        color: '#2563EB', markerColor: '#F97316', parts: [], stops: [],
    }))
    const [loading, setLoading] = useState(edit)
    const [err, setErr] = useState('')
    const [busy, setBusy] = useState(false)
    const [fileName, setFileName] = useState('')
    const set = (key) => (e) => setF((p) => ({ ...p, [key]: e.target.value }))

    useEffect(() => {
        if (!edit) return
        adminApi.get(kind, id)
            .then((r) => setF((p) => ({ ...p, ...r })))
            .catch((e) => setErr(e.message))
            .finally(() => setLoading(false))
    }, [kind, id, edit])

    const onFile = async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        setErr('')
        try {
            const { parts, stops, props } = parseGeo(await file.text())
            setFileName(file.name)
            setF((p) => ({
                ...p, parts, stops,
                nama: p.nama || props.name || props.Nama || '',
                kode: p.kode || props.ref || '',
                from: p.from || props.from || '',
                to: p.to || props.to || '',
                via: p.via || props.via || '',
                color: HEX.test(props.colour || '') ? props.colour : p.color,
            }))
        } catch (x) {
            setErr(x instanceof SyntaxError ? 'File bukan GeoJSON yang valid.' : x.message)
        }
    }

    const submit = async (e) => {
        e.preventDefault()
        if (!f.kode.trim() || !f.from.trim()) return setErr('Kode trayek dan titik awal wajib diisi.')
        setBusy(true)
        setErr('')
        try {
            await adminApi.save(kind, edit ? id : null, f)
            nav(`/admin/trayek/${kind}`)
        } catch (x) {
            setErr(x.message)
            setBusy(false)
        }
    }

    if (loading) return <p className="text-sm text-gray-500">Memuat data trayek…</p>

    return (
        <div className="max-w-[1280px]">
            <nav aria-label="Breadcrumb" className="text-xs text-gray-500 flex flex-wrap gap-2">
                <Link to="/admin" className="hover:underline">Beranda</Link>›<span>Manajemen Trayek</span>›
                <Link to={`/admin/trayek/${kind}`} className="hover:underline">{TITLE[kind]}</Link>›
                <span className="text-blue-600">{edit ? 'Ubah Rute' : 'Input Rute Baru'}</span>
            </nav>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">{edit ? `Ubah Rute ${f.kode}` : 'Input Rute Baru'}</h1>
            <p className="text-sm text-gray-600 mt-1 mb-6">Lengkapi data rute, lalu unggah file GeoJSON untuk jalur dan titik halte.</p>

            <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] items-start">
                <div className="space-y-5">
                    <Card title="Informasi utama rute">
                        <F label="Nama Rute"><input className={inp} value={f.nama} onChange={set('nama')} placeholder="Terminal Bubulak–Cidangiang" /></F>
                        <div className="grid grid-cols-2 gap-3">
                            <F label="Kode Trayek *"><input className={inp} value={f.kode} onChange={set('kode')} placeholder="K1" /></F>
                            <F label="Kode Trayek Lama"><input className={inp} value={f.kodeLama} onChange={set('kodeLama')} placeholder="03" /></F>
                        </div>
                    </Card>

                    <Card title="Detail perjalanan">
                        <F label="Titik Awal *"><input className={inp} value={f.from} onChange={set('from')} placeholder="Terminal Bubulak" /></F>
                        <F label="Titik Akhir"><input className={inp} value={f.to} onChange={set('to')} placeholder="Cidangiang" /></F>
                        <F label="Via Jalan"><input className={inp} value={f.via} onChange={set('via')} placeholder="Sholeh Iskandar" /></F>
                    </Card>

                    <Card title="Operasional">
                        <F label="Jaringan Bus"><Select value={f.jaringan} onChange={set('jaringan')} options={JARINGAN} /></F>
                        <F label="Operator"><input className={inp} value={f.operator} onChange={set('operator')} /></F>
                        <F label="Jenis Kendaraan"><Select value={f.kendaraan} onChange={set('kendaraan')} options={KENDARAAN} /></F>
                    </Card>

                    <Card title="Pengaturan peta">
                        <F label="Warna Garis Rute"><Color value={f.color} onChange={set('color')} label="Pilih warna garis" /></F>
                        <F label="Warna Penanda Akhir"><Color value={f.markerColor} onChange={set('markerColor')} label="Pilih warna penanda" /></F>
                    </Card>

                    <Card title="Geospasial data">
                        <F label="Jalur Jalan (GeoJSON)">
                            <span className="flex items-center gap-3">
                                <span className="flex-1 min-w-0 truncate rounded-lg border border-gray-200 bg-slate-50 px-3 py-2.5 text-sm text-gray-600">
                                    {fileName || (f.parts.length ? 'Jalur tersimpan' : 'Belum ada file')}
                                </span>
                                <span className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold cursor-pointer">
                                    <Icon name="plus" />{f.parts.length ? 'Unggah Ulang' : 'Unggah'}
                                    <input type="file" accept=".geojson,.json,application/geo+json,application/json" onChange={onFile} className="sr-only" />
                                </span>
                            </span>
                        </F>
                        <p className="rounded-lg bg-slate-50 border border-gray-200 px-3 py-2.5 text-xs text-gray-600">
                            Titik Halte: <b className="text-gray-900">{f.stops.length}</b> halte • Jalur: <b className="text-gray-900">{f.parts.length}</b> segmen
                        </p>
                    </Card>

                    {err && <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-xl p-3">{err}</p>}
                    <div className="flex gap-3">
                        <Link to={`/admin/trayek/${kind}`} className="flex-1 h-11 rounded-xl border border-red-200 text-red-600 text-sm font-bold flex items-center justify-center hover:bg-red-50">Batal</Link>
                        <button type="submit" disabled={busy} className="flex-[2] h-11 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-70 text-white text-sm font-bold">
                            {busy ? 'Menyimpan…' : 'Simpan Rute'}
                        </button>
                    </div>
                </div>

                <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden lg:sticky lg:top-[88px]">
                    <h2 className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#1D4ED8] border-b border-gray-200">Visualisasi peta &amp; halte</h2>
                    <RouteMap className="h-[420px] lg:h-[calc(100vh-190px)] lg:min-h-[480px]" parts={f.parts} stops={f.stops} color={f.color} markerColor={f.markerColor} />
                </section>
            </form>
        </div>
    )
}