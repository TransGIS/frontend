import { useEffect, useState } from 'react'
import RouteInfoSection from '../components/RouteInfoSection'
import PlaceInput from '../components/PlaceInput'
import { mapsUrl, searchPlaces } from '../lib/geocode'
import { trackPageView } from '../lib/routeData'
import heroBg from '../../../hero-section.jpeg'

// --- Color tokens (TransGIS brand) ---
// Primary blue: #1B3A8C  Hero bg: #1A3FA0  Orange accent: #F97316
// Green CTA: #16A34A  White: #FFFFFF  Gray text: #6B7280

const JOURNEY_STEPS = [
    {
        marker: 'Asal',
        title: 'Tentukan titik berangkat',
        text: 'Ketik nama tempat atau pilih titik langsung pada peta.',
        color: 'bg-[#F97316]',
    },
    {
        marker: 'Naik',
        title: 'Pilih BisKita atau angkot',
        text: 'Bandingkan pilihan rute, perkiraan waktu tempuh, dan tarif.',
        color: 'bg-[#1B3A8C]',
    },
    {
        marker: 'Pindah',
        title: 'Lihat titik turun dan transit',
        text: 'Ikuti saran perpindahan bila perjalanan membutuhkan lebih dari satu kendaraan.',
        color: 'bg-[#1B3A8C]',
    },
    {
        marker: 'Tujuan',
        title: 'Lanjutkan dengan jalan kaki',
        text: 'Lihat jalur kaki yang menghubungkan titik turun dengan tujuan akhir.',
        color: 'bg-[#16A34A]',
    },
]

function ProjectInfoSection() {
    return (
        <section id="tentang" aria-labelledby="tentang-transgis-title" className="scroll-mt-16 bg-white px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                    <div className="lg:col-span-5 lg:pt-2">
                        <p className="text-sm font-semibold text-[#1B3A8C]">Tentang TransGIS</p>
                        <h2 id="tentang-transgis-title" className="mt-3 max-w-md text-3xl sm:text-4xl font-extrabold leading-[1.15] tracking-tight text-[#12233F]">
                            Bukan sekadar peta trayek. Satu rencana sampai tujuan.
                        </h2>
                        <p className="mt-5 max-w-lg text-base leading-7 text-gray-600">
                            TransGIS adalah proyek Sistem Informasi Geografis berbasis web untuk transportasi publik Kota Bogor. BisKita Trans Pakuan dan trayek angkot dipertemukan dalam satu pencarian perjalanan.
                        </p>
                        <p className="mt-5 max-w-lg border-l-2 border-[#F97316] pl-4 text-base font-medium leading-7 text-[#12233F]">
                            Naik apa, turun di mana, dan bagaimana melanjutkan perjalanan—dijawab dalam satu alur.
                        </p>
                        <p className="mt-4 max-w-lg text-base leading-7 text-gray-600">
                            Proyek ini dibuat untuk membantu warga dan pengunjung yang tidak hafal setiap trayek agar dapat menyiapkan perjalanan dengan lebih yakin.
                        </p>
                        <a
                            href="/maps"
                            className="inline-block mt-7 border-b-2 border-[#F97316] pb-1 text-sm font-bold text-[#1B3A8C] hover:text-[#F97316] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A8C] focus-visible:ring-offset-4 transition-colors"
                        >
                            Rencanakan perjalanan
                        </a>
                    </div>

                    <div className="lg:col-span-7 lg:border-l lg:border-slate-200 lg:pl-16">
                        <h3 className="border-b border-slate-200 pb-4 text-lg font-bold text-[#12233F]">
                            Satu pencarian, empat keputusan perjalanan
                        </h3>
                        <ol className="mt-7">
                            {JOURNEY_STEPS.map((step, index) => (
                                <li key={step.title} className="relative grid grid-cols-[1rem_1fr] gap-4 pb-7 last:pb-0">
                                    {index < JOURNEY_STEPS.length - 1 && (
                                        <span aria-hidden="true" className="absolute left-[5px] top-4 bottom-0 w-px bg-slate-300" />
                                    )}
                                    <span aria-hidden="true" className={`relative mt-1.5 h-3 w-3 rounded-full ring-4 ring-white ${step.color}`} />
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500">{step.marker}</p>
                                        <h4 className="mt-1 text-base font-bold text-gray-900">{step.title}</h4>
                                        <p className="mt-1.5 max-w-xl text-sm leading-6 text-gray-600">{step.text}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

                <div className="mt-14 grid md:grid-cols-3 gap-x-10 gap-y-8 border-t border-slate-200 pt-8">
                    <article>
                        <h3 className="text-base font-bold text-[#12233F]">Dua moda, satu rencana</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            BisKita dan angkot dapat dipadukan dalam satu hasil pencarian, termasuk titik transit dan lanjutan jalan kaki.
                        </p>
                    </article>
                    <article>
                        <h3 className="text-base font-bold text-[#12233F]">Data yang bisa dirawat</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            Informasi trayek dikelola melalui dasbor admin agar dapat diperbarui ketika layanan berubah.
                        </p>
                    </article>
                    <article>
                        <h3 className="text-base font-bold text-[#12233F]">Estimasi yang jelas batasnya</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            Waktu dan tarif adalah perkiraan, bukan pelacakan kendaraan langsung. Lalu lintas dan kebijakan operator dapat mengubah perjalanan.
                        </p>
                    </article>
                </div>

                <div className="mt-10 border-t border-slate-200 pt-5 grid gap-3 text-xs leading-5 text-gray-500 md:grid-cols-2 md:gap-10">
                    <p>
                        <span className="font-semibold text-gray-700">Teknologi: </span>
                        React, Leaflet, OpenStreetMap, algoritma Dijkstra, Node.js, dan MongoDB.
                    </p>
                    <p>
                        <span className="font-semibold text-gray-700">Sumber data: </span>
                        Peta dan jalur pejalan kaki memanfaatkan OpenStreetMap; informasi trayek disimpan dalam database proyek.
                    </p>
                </div>
            </div>
        </section>
    )
}

function HomePage() {
    const [activeTab, setActiveTab] = useState('trayek') // 'petunjuk' | 'trayek'
    const [activeMode, setActiveMode] = useState('biskita') // 'biskita' | 'angkot'
    const [tujuan, setTujuan] = useState('') // filter trayek (tab Trayek)

    // Tab Petunjuk Arah: teks yang diketik + lokasi yang dipilih dari saran
    const [asalText, setAsalText] = useState('')
    const [asalPlace, setAsalPlace] = useState(null)
    const [tujuanText, setTujuanText] = useState('')
    const [tujuanPlace, setTujuanPlace] = useState(null)
    const [searching, setSearching] = useState(false)
    const [formError, setFormError] = useState('')

    const isTrayek = activeTab === 'trayek'
    const isPetunjuk = activeTab === 'petunjuk'

    // Catat kunjungan halaman ke backend (data nyata untuk dashboard admin)
    useEffect(() => { trackPageView() }, [])

    // Buka langsung ke section bila URL berisi #tarif (mis. dari halaman /maps)
    useEffect(() => {
        if (!window.location.hash) return
        const t = setTimeout(() => {
            document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
        return () => clearTimeout(t)
    }, [])

    const scrollToTarif = () => document.getElementById('tarif')?.scrollIntoView({ behavior: 'smooth' })

    // Petunjuk Arah: ubah teks → koordinat (bila belum memilih saran), lalu buka /maps
    const goDirections = async () => {
        if (searching) return
        setFormError('')
        if (!asalText.trim() || !tujuanText.trim()) {
            setFormError('Isi lokasi asal dan tujuan terlebih dahulu.')
            return
        }
        setSearching(true)
        try {
            // berurutan (bukan paralel) agar tidak melebihi batas 1 permintaan/detik Nominatim
            const asal = asalPlace ?? (await searchPlaces(asalText, undefined, 1))[0]
            if (!asal) return setFormError(`Lokasi asal “${asalText.trim()}” tidak ditemukan di sekitar Bogor.`)
            const tujuan = tujuanPlace ?? (await searchPlaces(tujuanText, undefined, 1))[0]
            if (!tujuan) return setFormError(`Lokasi tujuan “${tujuanText.trim()}” tidak ditemukan di sekitar Bogor.`)
            window.location.assign(mapsUrl([asal.lat, asal.lng], [tujuan.lat, tujuan.lng]))
        } catch {
            setFormError('Pencarian lokasi gagal. Periksa koneksi lalu coba lagi.')
        } finally {
            setSearching(false)
        }
    }

    return (
        <div className="flex flex-col font-sans bg-gray-50 text-gray-800">
            {/* ── HERO ── */}
            <section
                className="bg-[#1A3FA0] bg-cover bg-center flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 lg:min-h-[calc(100vh-4rem)] text-center"
                style={{ backgroundImage: `url(${heroBg})` }}
            >
                {/* Heading */}
                <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight max-w-4xl [text-shadow:0_2px_18px_rgba(10,24,58,0.55)]">
                    Tentukan Perjalanan di Bogor{' '}
                    <span className="whitespace-nowrap">
                        dengan <span className="text-[#1B3A8C]">Trans</span><span className="text-[#F97316]">GIS</span>
                    </span>
                </h1>
                <p className="text-white/95 text-sm sm:text-base md:text-lg max-w-2xl mt-3 sm:mt-4 leading-relaxed [text-shadow:0_1px_12px_rgba(10,24,58,0.5)]">
                    Panduan navigasi cerdas terintegrasi: BisKita, Trayek Angkot,
                    serta estimasi rute tercepat dan tarif akurat di Kota Bogor.
                </p>

                {/* Search Card */}
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mt-6 sm:mt-8 p-4 sm:p-6">
                    {/* Tab switcher */}
                    <div className="flex justify-center mb-4 sm:mb-5">
                        <div className="w-full sm:w-auto flex bg-gray-100 rounded-xl sm:rounded-full p-1 gap-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('petunjuk')}
                                className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 rounded-lg sm:rounded-full text-xs sm:text-sm font-semibold transition-all ${isPetunjuk
                                    ? 'bg-[#1B3A8C] text-white shadow'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Petunjuk Arah
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('trayek')}
                                className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 rounded-lg sm:rounded-full text-xs sm:text-sm font-semibold transition-all ${isTrayek
                                    ? 'bg-[#1B3A8C] text-white shadow'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Trayek
                            </button>
                        </div>
                    </div>

                    {/* Mode selector (only on Trayek tab) */}
                    {isTrayek && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 text-left">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                Pilihan Moda:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto flex-1">
                                <button
                                    type="button"
                                    onClick={() => { setActiveMode('biskita'); setTujuan('') }}
                                    className={`px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg sm:rounded-full text-xs sm:text-sm font-medium border transition-all text-center ${activeMode === 'biskita'
                                        ? 'bg-[#1B3A8C] text-white border-[#1B3A8C]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#1B3A8C]'
                                        }`}
                                >
                                    BisKita Trans Pakuan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setActiveMode('angkot'); setTujuan('') }}
                                    className={`px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg sm:rounded-full text-xs sm:text-sm font-medium border transition-all text-center ${activeMode === 'angkot'
                                        ? 'bg-[#1B3A8C] text-white border-[#1B3A8C]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#1B3A8C]'
                                        }`}
                                >
                                    Angkot Bogor (01–32)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Input fields */}
                    <div className="flex flex-col gap-4 text-left">
                        {/* Asal (only for Petunjuk Arah) */}
                        {isPetunjuk && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Asal
                                </label>
                                <PlaceInput
                                    value={asalText}
                                    selected={asalPlace}
                                    onChange={(t) => { setAsalText(t); setAsalPlace(null); setFormError('') }}
                                    onSelect={(p) => { setAsalPlace(p); setAsalText(p.name); setFormError('') }}
                                    onSubmit={goDirections}
                                    pinClass="text-[#16A34A]"
                                    placeholder="Pilih lokasi asal... (cth: Stasiun Bogor)"
                                />
                            </div>
                        )}

                        {/* Tujuan */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                Tujuan
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                                {isTrayek ? (
                                    <div className="flex-1 flex items-center border border-gray-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 focus-within:ring-2 focus-within:ring-[#1B3A8C] focus-within:border-transparent transition-all">
                                        <span className="text-[#F97316] mr-2.5 sm:mr-3 text-base shrink-0">📍</span>
                                        <input
                                            type="text"
                                            value={tujuan}
                                            onChange={(e) => setTujuan(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') scrollToTarif() }}
                                            placeholder={activeMode === 'biskita' ? 'Pilih koridor... (cth: K5)' : 'Pilih trayek angkot... (cth: 01)'}
                                            className="flex-1 bg-transparent text-gray-700 text-xs sm:text-sm outline-none placeholder-gray-400 min-w-0"
                                        />
                                    </div>
                                ) : (
                                    <PlaceInput
                                        className="flex-1"
                                        value={tujuanText}
                                        selected={tujuanPlace}
                                        onChange={(t) => { setTujuanText(t); setTujuanPlace(null); setFormError('') }}
                                        onSelect={(p) => { setTujuanPlace(p); setTujuanText(p.name); setFormError('') }}
                                        onSubmit={goDirections}
                                        placeholder="Pilih tujuan... (cth: Kebun Raya)"
                                    />
                                )}

                                {/* Cari Rute button */}
                                <button
                                    type="button"
                                    onClick={isTrayek ? scrollToTarif : goDirections}
                                    disabled={searching}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait text-white px-6 py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all whitespace-nowrap shadow-md shrink-0"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                                        />
                                    </svg>
                                    {searching ? 'Mencari…' : 'Cari Rute'}
                                </button>
                            </div>
                            {isPetunjuk && formError && (
                                <p role="alert" className="mt-2 text-xs text-red-600">{formError}</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TENTANG PROYEK ── */}
            <ProjectInfoSection />

            {/* ── INFO TARIF & RUTE ── mengikuti pilihan moda & kolom Tujuan di atas */}
            <RouteInfoSection mode={activeMode} query={isTrayek ? tujuan : ''} />
        </div>
    )
}

export default HomePage