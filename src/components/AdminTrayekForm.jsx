import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { adminApi, FORM_DEFAULTS } from '../lib/adminApi'
import { Icon } from './AdminUi'
import { RouteMap } from './AdminRouteMap'

const TITLE = { biskita: 'BisKita Trans Pakuan', angkot: 'Trayek Angkot Bogor' }
const TIPE_TARIF = { flat: 'Flat (per penumpang)', jarak: 'Berdasarkan jarak' }
const STATUS = { aktif: 'Aktif Normal', nonaktif: 'Nonaktif' }
const HEX = /^#[0-9a-f]{6}$/i
const inp = 'w-full min-w-0 h-11 border-2 border-[#12233F]/25 bg-[#F7F4EA] px-3.5 text-sm font-medium text-[#12233F] outline-none transition-colors placeholder:font-normal placeholder:text-gray-400 hover:border-[#1B3A8C]/60 focus:border-[#1B3A8C] focus:bg-white focus:ring-2 focus:ring-[#1B3A8C]/15'
const selectInp = `${inp} cursor-pointer`

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

const Card = ({ icon, title, description, children }) => (
    <section className="overflow-hidden border-2 border-[#12233F] bg-white shadow-[4px_4px_0_#12233F]">
        <header className="flex items-start gap-3 border-b-2 border-[#12233F]/10 bg-[#F7F4EA] px-4 py-4 sm:px-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center border-2 border-[#12233F] bg-white text-[#F97316]"><Icon name={icon} className="h-5 w-5" /></span>
            <div>
                <h2 className="font-pixel text-2xl font-semibold leading-none text-[#1B3A8C]">{title}</h2>
                <p className="mt-1.5 text-xs leading-5 text-gray-500">{description}</p>
            </div>
        </header>
        <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
)

const F = ({ id, label, hint, children, className = '' }) => (
    <div className={className}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={id} className="text-xs font-extrabold text-[#12233F]">{label}</label>
            {hint && <span className="text-[11px] font-medium text-gray-400">{hint}</span>}
        </div>
        {children}
    </div>
)

const Color = ({ id, value, onChange, label }) => (
    <div className="flex gap-2">
        <input id={id} value={value} onChange={onChange} maxLength={7} className={inp} />
        <input type="color" value={HEX.test(value) ? value : '#000000'} onChange={onChange} aria-label={label}
            className="h-11 w-12 shrink-0 cursor-pointer border-2 border-[#12233F] bg-white p-1" />
    </div>
)

export default function AdminTrayekForm() {
    const { kind: k, id } = useParams()
    const kind = TITLE[k] ? k : 'biskita'
    const edit = Boolean(id)
    const nav = useNavigate()
    const [f, setF] = useState(() => ({
        nama: '', kode: '', from: '', to: '', via: '', ...FORM_DEFAULTS[kind],
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
            window.dispatchEvent(new Event('transgis:activity'))
            nav(`/admin/trayek/${kind}`)
        } catch (x) {
            setErr(x.message)
            setBusy(false)
        }
    }

    if (loading) return (
        <div className="flex min-h-60 max-w-[1280px] items-center justify-center border-2 border-[#12233F] bg-white p-8 shadow-[4px_4px_0_#12233F]">
            <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 place-items-center border-2 border-[#12233F] bg-[#F7F4EA] text-[#F97316]"><Icon name="refresh" className="h-5 w-5" /></span>
                <div><h1 className="font-pixel text-3xl font-semibold text-[#1B3A8C]">Memuat rute</h1><p className="mt-1 text-sm text-gray-500">Data trayek sedang diambil dari server.</p></div>
            </div>
        </div>
    )

    return (
        <div className="max-w-[1400px]">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <Link to="/admin/dasbor" className="font-semibold text-[#1B3A8C] transition-colors hover:text-[#F97316]">Beranda</Link><span aria-hidden="true">›</span><span>Manajemen Trayek</span><span aria-hidden="true">›</span>
                <Link to={`/admin/trayek/${kind}`} className="font-semibold text-[#1B3A8C] transition-colors hover:text-[#F97316]">{TITLE[kind]}</Link><span aria-hidden="true">›</span>
                <span className="font-semibold text-[#12233F]">{edit ? 'Ubah Rute' : 'Tambah Rute'}</span>
            </nav>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <span className="inline-flex items-center gap-2 border-2 border-[#12233F] bg-white px-3 py-1.5 text-xs font-extrabold text-[#1B3A8C]">
                        <Icon name={kind === 'biskita' ? 'bus' : 'van'} className="text-[#F97316]" />{TITLE[kind]}
                    </span>
                    <h1 className="mt-3 font-pixel text-4xl font-semibold leading-[1.05] text-[#1B3A8C] sm:text-5xl">{edit ? `Ubah Rute ${f.kode}` : 'Tambah Rute Baru'}</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">Lengkapi informasi layanan dan GeoJSON. Pratinjau di samping akan mengikuti data yang Anda isi.</p>
                </div>
                <Link to={`/admin/trayek/${kind}`} className="inline-flex h-11 items-center justify-center gap-2 border-2 border-[#12233F]/25 bg-white px-4 text-xs font-extrabold text-[#12233F] transition-colors hover:border-[#12233F] hover:bg-[#F7F4EA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]">
                    <Icon name="arrow" className="rotate-180" />Kembali ke daftar
                </Link>
            </div>

            <form onSubmit={submit} className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,500px)_minmax(0,1fr)]">
                <div className="space-y-6">
                    <Card icon="route" title="Informasi rute" description="Identitas trayek dan hubungan perjalanan yang akan terlihat oleh pengguna.">
                        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
                            <F id="route-name" label="Nama rute"><input id="route-name" className={inp} value={f.nama} onChange={set('nama')} placeholder="Terminal Bubulak–Cidangiang" /></F>
                            <F id="route-code" label="Kode trayek" hint="Wajib"><input id="route-code" className={inp} value={f.kode} onChange={set('kode')} placeholder="K1" /></F>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <F id="route-from" label="Titik awal" hint="Wajib"><input id="route-from" className={inp} value={f.from} onChange={set('from')} placeholder="Terminal Bubulak" /></F>
                            <F id="route-to" label="Titik akhir"><input id="route-to" className={inp} value={f.to} onChange={set('to')} placeholder="Cidangiang" /></F>
                        </div>
                        <F id="route-via" label="Via jalan" hint="Opsional"><input id="route-via" className={inp} value={f.via} onChange={set('via')} placeholder="Sholeh Iskandar" /></F>
                    </Card>

                    <Card icon="filter" title="Jadwal & tarif" description="Atur biaya, frekuensi, dan jam layanan trayek.">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <F id="route-fare" label="Tarif"><input id="route-fare" className={inp} value={f.tarif} onChange={set('tarif')} /></F>
                            <F id="route-fare-type" label="Tipe tarif">
                                <select id="route-fare-type" value={f.tipeTarif} onChange={set('tipeTarif')} className={selectInp}>
                                    {Object.entries(TIPE_TARIF).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                                </select>
                            </F>
                            <F id="route-interval" label="Interval" hint="Menit"><input id="route-interval" type="number" min="0" max="600" className={inp} value={f.intervalMenit} onChange={set('intervalMenit')} /></F>
                            <F id="route-status" label="Status layanan">
                                <select id="route-status" value={f.status} onChange={set('status')} className={selectInp}>
                                    {Object.entries(STATUS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                                </select>
                            </F>
                            <F id="route-open" label="Jam buka"><input id="route-open" type="time" className={inp} value={f.jamBuka} onChange={set('jamBuka')} /></F>
                            <F id="route-close" label="Jam tutup"><input id="route-close" type="time" className={inp} value={f.jamTutup} onChange={set('jamTutup')} /></F>
                        </div>
                        <F id="route-integration" label="Integrasi" hint="Pisahkan dengan koma"><input id="route-integration" className={inp} value={f.integrasi} onChange={set('integrasi')} placeholder="KRL Jabodetabek, Damri Bandara" /></F>
                    </Card>

                    <Card icon="map" title="Jalur & tampilan peta" description="Unggah geometri rute dan tentukan warna yang tampil pada peta.">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <F id="route-color" label="Warna garis rute"><Color id="route-color" value={f.color} onChange={set('color')} label="Pilih warna garis rute" /></F>
                            <F id="route-marker-color" label="Warna penanda akhir"><Color id="route-marker-color" value={f.markerColor} onChange={set('markerColor')} label="Pilih warna penanda akhir" /></F>
                        </div>
                        <div className="border-t-2 border-[#12233F]/10 pt-4">
                            <p className="mb-2 text-xs font-extrabold text-[#12233F]">Data geospasial</p>
                            <label className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-[#12233F]/30 bg-[#F7F4EA] px-4 py-6 text-center transition-colors focus-within:border-[#1B3A8C] focus-within:ring-2 focus-within:ring-[#1B3A8C]/15 hover:border-[#1B3A8C] hover:bg-[#EAF0FF]">
                                <input type="file" accept=".geojson,.json,application/geo+json,application/json" onChange={onFile} className="sr-only" />
                                <span className="grid h-10 w-10 place-items-center border-2 border-[#12233F] bg-white text-[#F97316]"><Icon name="plus" className="h-5 w-5" /></span>
                                <span className="mt-3 text-sm font-extrabold text-[#12233F]">{fileName || f.parts.length ? 'Ganti file GeoJSON' : 'Pilih file GeoJSON'}</span>
                                <span className="mt-1 text-xs leading-5 text-gray-500">.geojson atau .json · LineString untuk jalur, Point untuk halte</span>
                            </label>
                            <div className="mt-3 flex items-center gap-3 border-2 border-[#12233F]/15 bg-white px-3 py-2.5">
                                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-600">{fileName || (f.parts.length ? 'Jalur tersimpan di database' : 'Belum ada file yang dipilih')}</span>
                                {(fileName || f.parts.length > 0) && <span className="shrink-0 border border-emerald-700/25 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">Siap</span>}
                            </div>
                        </div>
                    </Card>

                    {err && <p role="alert" className="border-l-4 border-red-700 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">{err}</p>}

                    <div className="border-2 border-[#12233F] bg-white p-4 shadow-[4px_4px_0_#12233F]">
                        <p className="text-xs leading-5 text-gray-500">Kode trayek dan titik awal wajib diisi. Periksa kembali jalur pada pratinjau sebelum menyimpan.</p>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <Link to={`/admin/trayek/${kind}`} className="inline-flex h-11 items-center justify-center border-2 border-[#12233F] bg-white px-6 text-sm font-extrabold text-[#12233F] transition-colors hover:bg-[#F7F4EA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]">Batal</Link>
                            <button type="submit" disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 border-2 border-[#12233F] bg-[#1B3A8C] px-6 text-sm font-extrabold text-white shadow-[4px_4px_0_#F97316] transition-colors hover:bg-[#12233F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] disabled:cursor-wait disabled:opacity-60">
                                <Icon name={edit ? 'edit' : 'plus'} />{busy ? 'Menyimpan…' : edit ? 'Simpan Perubahan' : 'Simpan Rute'}
                            </button>
                        </div>
                    </div>
                </div>

                <aside aria-label="Pratinjau rute" className="overflow-hidden border-2 border-[#12233F] bg-white shadow-[4px_4px_0_#12233F] xl:sticky xl:top-24">
                    <header className="flex items-center gap-3 border-b-2 border-[#12233F] bg-[#12233F] px-4 py-4 text-white sm:px-5">
                        <span className="grid h-10 w-10 shrink-0 place-items-center border-2 border-white/60 text-[#F97316]"><Icon name="map" className="h-5 w-5" /></span>
                        <div className="min-w-0 flex-1"><h2 className="font-pixel text-2xl font-semibold leading-none">Pratinjau rute</h2><p className="mt-1 text-[11px] text-white/60">Jalur, halte, dan warna diperbarui langsung.</p></div>
                        <span className="hidden shrink-0 border border-[#12233F] bg-[#F97316] px-2 py-1 text-[10px] font-extrabold text-[#12233F] sm:block">Langsung</span>
                    </header>

                    <div className="border-b-2 border-[#12233F] bg-[#F7F4EA] p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                            <span className="grid h-11 min-w-12 shrink-0 place-items-center border-2 border-[#12233F] px-2 text-sm font-extrabold text-white" style={{ background: HEX.test(f.color) ? f.color : '#2563EB' }}>{f.kode || '—'}</span>
                            <div className="min-w-0"><p className="truncate text-sm font-extrabold text-[#12233F]">{f.from || 'Titik awal'}<span className="px-2 text-[#F97316]">⇌</span>{f.to || 'Titik akhir'}</p><p className="mt-1 truncate text-xs text-gray-500">{f.nama || TITLE[kind]}</p></div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="border-2 border-[#12233F]/15 bg-white px-3 py-2.5"><p className="text-[11px] font-semibold text-gray-500">Titik halte</p><p className="mt-0.5 font-pixel text-2xl font-semibold text-[#1B3A8C]">{f.stops.length}</p></div>
                            <div className="border-2 border-[#12233F]/15 bg-white px-3 py-2.5"><p className="text-[11px] font-semibold text-gray-500">Segmen jalur</p><p className="mt-0.5 font-pixel text-2xl font-semibold text-[#1B3A8C]">{f.parts.length}</p></div>
                        </div>
                    </div>

                    <RouteMap className="h-[360px] sm:h-[430px] xl:h-[calc(100vh-390px)] xl:min-h-[390px]" parts={f.parts} stops={f.stops} color={f.color} markerColor={f.markerColor} />
                    <footer className="flex flex-wrap gap-x-5 gap-y-2 border-t-2 border-[#12233F] bg-white px-4 py-3 text-[11px] font-semibold text-gray-500 sm:px-5">
                        <span className="flex items-center gap-2"><i aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-emerald-600" />Titik awal</span>
                        <span className="flex items-center gap-2"><i aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: HEX.test(f.markerColor) ? f.markerColor : '#F97316' }} />Titik akhir</span>
                        <span className="flex items-center gap-2"><i aria-hidden="true" className="h-2.5 w-2.5 rounded-full border border-[#1B3A8C] bg-white" />Halte</span>
                    </footer>
                </aside>
            </form>
        </div>
    )
}
