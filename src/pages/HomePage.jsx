import { useEffect, useState } from 'react'
import RouteInfoSection from '../components/RouteInfoSection'
import PlaceInput from '../components/PlaceInput'
import { PixelTransitScene, RoadMarker } from '../components/PixelRoad'
import { mapsUrl, searchPlaces } from '../lib/geocode'
import { trackPageView } from '../lib/routeData'
import heroBg from '../../../hero-section.jpeg'

// --- Color tokens (TransGIS brand) ---
// Primary blue: #1B3A8C  Hero bg: #1A3FA0  Orange accent: #F97316
// Green CTA: #16A34A  White: #FFFFFF  Gray text: #6B7280

const JOURNEY_STEPS = [
    {
        marker: '01',
        title: 'Tentukan asal',
        text: 'Ketik tempat atau tandai peta.',
        color: 'bg-[#F97316]',
    },
    {
        marker: '02',
        title: 'Pilih kendaraan',
        text: 'Bandingkan BisKita dan angkot.',
        color: 'bg-[#1B3A8C]',
    },
    {
        marker: '03',
        title: 'Turun & transit',
        text: 'Lihat titik pindah dengan jelas.',
        color: 'bg-[#F97316]',
    },
    {
        marker: '04',
        title: 'Sampai tujuan',
        text: 'Ikuti jalur jalan kaki terakhir.',
        color: 'bg-[#16A34A]',
    },
]

function ProjectInfoSection() {
    return (
        <section id="tentang" aria-labelledby="tentang-transgis-title" className="scroll-mt-20 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
                    <div className="lg:col-span-5">
                        <p className="font-pixel text-xl font-semibold text-[#1B3A8C]">Tentang TransGIS</p>
                        <h2 id="tentang-transgis-title" className="mt-3 max-w-md font-pixel text-4xl font-semibold leading-[1.08] text-[#12233F] sm:text-5xl">
                            Satu pencarian. Sampai tujuan.
                        </h2>
                        <p className="mt-5 max-w-md text-[15px] leading-7 text-gray-600">
                            TransGIS memadukan BisKita, angkot, dan jalan kaki untuk membantu warga Bogor memilih rute, titik transit, serta estimasi waktu dan tarif dalam satu pencarian.
                        </p>
                        <a
                            href="/maps"
                            className="mt-6 inline-flex items-center gap-2 border-2 border-[#12233F] bg-white px-5 py-3 text-sm font-bold text-[#1B3A8C] shadow-[4px_4px_0_#12233F] transition-colors hover:bg-[#F97316] hover:text-[#12233F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A8C] focus-visible:ring-offset-4"
                        >
                            Rencanakan perjalanan
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M5 12h14M13 6l6 6-6 6" />
                            </svg>
                        </a>
                    </div>

                    <div className="lg:col-span-7">
                        <PixelTransitScene />
                    </div>
                </div>

                <div className="mt-14 border-2 border-[#12233F] bg-white shadow-[5px_5px_0_#12233F]">
                    <div className="border-b-2 border-[#12233F] px-5 py-4 sm:px-6">
                        <h3 className="font-pixel text-2xl font-semibold text-[#12233F] sm:text-3xl">
                            Empat langkah, satu rute
                        </h3>
                    </div>
                    <ol className="grid sm:grid-cols-2 lg:grid-cols-4">
                        {JOURNEY_STEPS.map((step, index) => (
                            <li
                                key={step.title}
                                className={`border-[#12233F] p-5 ${index < 3 ? 'border-b-2 lg:border-b-0 lg:border-r-2' : ''} ${index === 2 ? 'sm:border-b-0' : ''} ${index % 2 === 0 ? 'sm:border-r-2' : ''}`}
                            >
                                <div className="flex items-start gap-4">
                                    <span className={`grid h-10 w-10 shrink-0 place-items-center border-2 border-[#12233F] font-pixel text-lg font-semibold text-white ${step.color}`}>
                                        {step.marker}
                                    </span>
                                    <div>
                                        <h4 className="text-sm font-bold text-[#12233F]">{step.title}</h4>
                                        <p className="mt-1 text-sm leading-6 text-gray-600">{step.text}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="mt-5 grid gap-2 text-xs leading-5 text-gray-500 sm:grid-cols-2 sm:gap-8">
                    <p>Waktu dan tarif merupakan estimasi, bukan pelacakan kendaraan langsung.</p>
                    <p className="sm:text-right">Trayek tersimpan di database proyek; peta memakai OpenStreetMap.</p>
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
        <div className="landing-page flex flex-col">
            {/* ── HERO ── */}
            <section
                className="relative flex min-h-[100svh] flex-col items-center justify-center bg-[#1A3FA0] bg-cover bg-center px-4 pb-20 pt-28 text-center sm:px-6 sm:pt-32 lg:px-8"
                style={{ backgroundImage: `url(${heroBg})` }}
            >
                {/* Heading */}
                <h1 className="max-w-5xl font-pixel text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.08] text-white [text-shadow:3px_3px_0_rgba(18,35,63,0.8)]">
                    Tentukan Perjalanan di Bogor{' '}
                    <span className="mt-2 block whitespace-nowrap">
                        dengan <span className="text-[#1B3A8C]">Trans</span><span className="text-[#F97316]">GIS</span>
                    </span>
                </h1>
                <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-white [text-shadow:0_2px_10px_rgba(10,24,58,0.8)] sm:text-base sm:leading-7">
                    Cari rute BisKita dan angkot, lengkap dengan titik transit, jalan kaki, estimasi waktu, dan tarif.
                </p>

                {/* Search Card */}
                <div className="hero-search pixel-panel mt-8 w-full max-w-3xl bg-[#F7F4EA] p-4 text-left text-[#12233F] sm:p-6">
                    {/* Tab switcher */}
                    <div className="grid grid-cols-2 border-2 border-[#12233F] bg-white" role="tablist" aria-label="Jenis pencarian">
                        <button
                            type="button"
                            role="tab"
                            id="tab-petunjuk"
                            aria-selected={isPetunjuk}
                            aria-controls="home-search-panel"
                            onClick={() => setActiveTab('petunjuk')}
                            className={`border-r-2 border-[#12233F] px-3 py-3 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F97316] ${isPetunjuk
                                ? 'bg-[#1B3A8C] text-white'
                                : 'bg-white text-gray-600 hover:bg-[#EAF0FF] hover:text-[#1B3A8C]'
                                }`}
                        >
                            Petunjuk Arah
                        </button>
                        <button
                            type="button"
                            role="tab"
                            id="tab-trayek"
                            aria-selected={isTrayek}
                            aria-controls="home-search-panel"
                            onClick={() => setActiveTab('trayek')}
                            className={`px-3 py-3 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F97316] ${isTrayek
                                ? 'bg-[#1B3A8C] text-white'
                                : 'bg-white text-gray-600 hover:bg-[#EAF0FF] hover:text-[#1B3A8C]'
                                }`}
                        >
                            Cari Trayek
                        </button>
                    </div>

                    {/* Mode selector (only on Trayek tab) */}
                    {isTrayek && (
                        <fieldset className="mt-5">
                            <legend className="text-sm font-extrabold text-[#12233F]">Pilih moda</legend>
                            <div className="mt-2 grid grid-cols-2 gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    aria-pressed={activeMode === 'biskita'}
                                    onClick={() => { setActiveMode('biskita'); setTujuan('') }}
                                    className={`relative flex min-h-[68px] items-center justify-center gap-2 border-2 px-3 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] sm:justify-start sm:gap-3 ${activeMode === 'biskita'
                                        ? 'border-[#12233F] bg-[#1B3A8C] text-white shadow-[3px_3px_0_#F97316]'
                                        : 'border-[#12233F]/25 bg-white text-gray-600 hover:border-[#1B3A8C] hover:text-[#1B3A8C]'
                                        }`}
                                >
                                    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                        <path d="M5 17V7c0-2 2-3 7-3s7 1 7 3v10M5 13h14M8 8h8M8 17v3M16 17v3" />
                                        <path d="M8 16h.01M16 16h.01" strokeWidth="3" />
                                    </svg>
                                    <span className="text-left">
                                        <span className="block text-sm font-extrabold">BisKita</span>
                                        <span className="mt-0.5 hidden text-xs opacity-75 sm:block">Trans Pakuan</span>
                                    </span>
                                    {activeMode === 'biskita' && (
                                        <svg viewBox="0 0 24 24" className="absolute right-1.5 top-1.5 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                            <path d="M5 12l4 4L19 6" />
                                        </svg>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    aria-pressed={activeMode === 'angkot'}
                                    onClick={() => { setActiveMode('angkot'); setTujuan('') }}
                                    className={`relative flex min-h-[68px] items-center justify-center gap-2 border-2 px-3 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] sm:justify-start sm:gap-3 ${activeMode === 'angkot'
                                        ? 'border-[#12233F] bg-[#1B3A8C] text-white shadow-[3px_3px_0_#F97316]'
                                        : 'border-[#12233F]/25 bg-white text-gray-600 hover:border-[#1B3A8C] hover:text-[#1B3A8C]'
                                        }`}
                                >
                                    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                        <path d="M4 16V8l2-4h12l2 4v8M4 11h16M7 16v2M17 16v2M7 8h10" />
                                        <path d="M7 14h.01M17 14h.01" strokeWidth="3" />
                                    </svg>
                                    <span className="text-left">
                                        <span className="block text-sm font-extrabold">Angkot</span>
                                        <span className="mt-0.5 hidden text-xs opacity-75 sm:block">Trayek 01–32</span>
                                    </span>
                                    {activeMode === 'angkot' && (
                                        <svg viewBox="0 0 24 24" className="absolute right-1.5 top-1.5 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                            <path d="M5 12l4 4L19 6" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </fieldset>
                    )}

                    {/* Input fields */}
                    <div
                        id="home-search-panel"
                        role="tabpanel"
                        aria-labelledby={isTrayek ? 'tab-trayek' : 'tab-petunjuk'}
                        className="mt-5 text-left"
                    >
                        <div className={`grid gap-4 ${isPetunjuk ? 'sm:grid-cols-2' : ''}`}>
                            {isPetunjuk && (
                                <div>
                                    <label htmlFor="home-asal" className="mb-2 block text-sm font-extrabold text-[#12233F]">
                                        Dari mana?
                                    </label>
                                    <PlaceInput
                                        id="home-asal"
                                        value={asalText}
                                        selected={asalPlace}
                                        onChange={(t) => { setAsalText(t); setAsalPlace(null); setFormError('') }}
                                        onSelect={(p) => { setAsalPlace(p); setAsalText(p.name); setFormError('') }}
                                        onSubmit={goDirections}
                                        pinClass="text-[#16A34A]"
                                        placeholder="Contoh: Stasiun Bogor"
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor="home-tujuan" className="mb-2 block text-sm font-extrabold text-[#12233F]">
                                    {isTrayek ? 'Cari trayek' : 'Mau ke mana?'}
                                </label>
                                {isTrayek ? (
                                    <div className="flex min-h-[50px] items-center rounded-lg border-2 border-[#12233F]/25 bg-white px-3.5 transition-colors focus-within:border-[#1B3A8C] focus-within:ring-2 focus-within:ring-[#1B3A8C]/15">
                                        <svg viewBox="0 0 24 24" className="mr-3 h-5 w-5 shrink-0 text-[#F97316]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <circle cx="11" cy="11" r="7" />
                                            <path d="m20 20-4-4" />
                                        </svg>
                                        <input
                                            id="home-tujuan"
                                            type="text"
                                            value={tujuan}
                                            onChange={(e) => setTujuan(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') scrollToTarif() }}
                                            placeholder={activeMode === 'biskita' ? 'Nomor koridor atau lokasi' : 'Nomor trayek atau lokasi'}
                                            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#12233F] outline-none placeholder:font-normal placeholder:text-gray-400"
                                        />
                                    </div>
                                ) : (
                                    <PlaceInput
                                        id="home-tujuan"
                                        value={tujuanText}
                                        selected={tujuanPlace}
                                        onChange={(t) => { setTujuanText(t); setTujuanPlace(null); setFormError('') }}
                                        onSelect={(p) => { setTujuanPlace(p); setTujuanText(p.name); setFormError('') }}
                                        onSubmit={goDirections}
                                        placeholder="Contoh: Kebun Raya"
                                    />
                                )}
                            </div>
                        </div>

                        {isPetunjuk && formError && (
                            <p role="alert" className="mt-3 text-sm font-medium text-red-700">{formError}</p>
                        )}

                        <div className="mt-4 flex sm:justify-end">
                            <button
                                type="button"
                                onClick={isTrayek ? scrollToTarif : goDirections}
                                disabled={searching}
                                className="flex min-h-[50px] w-full items-center justify-center gap-2 border-2 border-[#12233F] bg-[#16A34A] px-6 py-3 text-sm font-extrabold text-white shadow-[3px_3px_0_#12233F] transition-colors hover:bg-[#15803D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                    <circle cx="11" cy="11" r="7" />
                                    <path d="m20 20-4-4" />
                                </svg>
                                {searching ? 'Mencari…' : isTrayek ? 'Lihat Trayek' : 'Cari Rute'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TENTANG PROYEK ── */}
            <RoadMarker number="01" label="Kenalan" />
            <ProjectInfoSection />

            {/* ── INFO TARIF & RUTE ── mengikuti pilihan moda & kolom Tujuan di atas */}
            <RoadMarker number="02" label="Pilih trayek" />
            <RouteInfoSection mode={activeMode} query={isTrayek ? tujuan : ''} />
        </div>
    )
}

export default HomePage