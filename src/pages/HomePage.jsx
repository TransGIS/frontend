import { useState } from 'react'

// --- Color tokens (TransGIS brand) ---
// Primary blue: #1B3A8C  Hero bg: #1A3FA0  Orange accent: #F97316
// Green CTA: #16A34A  White: #FFFFFF  Gray text: #6B7280

function HomePage() {
    const [activeTab, setActiveTab] = useState('trayek') // 'petunjuk' | 'trayek'
    const [activeMode, setActiveMode] = useState('biskita') // 'biskita' | 'angkot'
    const [tujuan, setTujuan] = useState('')
    const [asal, setAsal] = useState('')

    const isTrayek = activeTab === 'trayek'
    const isPetunjuk = activeTab === 'petunjuk'

    return (
        <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-800">
            {/* ── HERO ── */}
            <section className="bg-[#1A3FA0] flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 text-center">
                {/* Heading */}
                <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight max-w-2xl mb-3 sm:mb-4">
                    Tentukan Perjalanan di Bogor{' '}
                    <span className="inline sm:block">
                        dengan <span className="text-[#F97316]">TransGIS</span>
                    </span>
                </h1>
                <p className="text-blue-200 text-sm sm:text-base md:text-lg max-w-xl mb-8 sm:mb-12 leading-relaxed px-2">
                    Panduan navigasi cerdas terintegrasi: BisKita, Trayek Angkot,{' '}
                    <br className="hidden sm:inline" />
                    serta estimasi rute tercepat dan tarif akurat di Kota Bogor.
                </p>

                {/* Search Card */}
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-4 sm:p-6 md:p-8">
                    {/* Tab switcher */}
                    <div className="flex justify-center mb-5 sm:mb-6">
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
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-5 text-left">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                Pilihan Moda:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto flex-1">
                                <button
                                    type="button"
                                    onClick={() => setActiveMode('biskita')}
                                    className={`px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg sm:rounded-full text-xs sm:text-sm font-medium border transition-all text-center ${activeMode === 'biskita'
                                        ? 'bg-[#1B3A8C] text-white border-[#1B3A8C]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#1B3A8C]'
                                        }`}
                                >
                                    BisKita Trans Pakuan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveMode('angkot')}
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
                                <div className="flex items-center border border-gray-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 focus-within:ring-2 focus-within:ring-[#1B3A8C] focus-within:border-transparent transition-all">
                                    <span className="text-[#16A34A] mr-2.5 sm:mr-3 text-base shrink-0">📍</span>
                                    <input
                                        type="text"
                                        value={asal}
                                        onChange={(e) => setAsal(e.target.value)}
                                        placeholder="Pilih lokasi asal... (cth: Stasiun Bogor)"
                                        className="flex-1 bg-transparent text-gray-700 text-xs sm:text-sm outline-none placeholder-gray-400 min-w-0"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tujuan */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                Tujuan
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                                <div className="flex-1 flex items-center border border-gray-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 focus-within:ring-2 focus-within:ring-[#1B3A8C] focus-within:border-transparent transition-all">
                                    <span className="text-[#F97316] mr-2.5 sm:mr-3 text-base shrink-0">📍</span>
                                    <input
                                        type="text"
                                        value={tujuan}
                                        onChange={(e) => setTujuan(e.target.value)}
                                        placeholder={
                                            isTrayek
                                                ? activeMode === 'biskita'
                                                    ? 'Pilih koridor... (cth: K5)'
                                                    : 'Pilih trayek angkot... (cth: 01)'
                                                : 'Pilih tujuan... (cth: Kebun Raya)'
                                        }
                                        className="flex-1 bg-transparent text-gray-700 text-xs sm:text-sm outline-none placeholder-gray-400 min-w-0"
                                    />
                                </div>

                                {/* Cari Rute button */}
                                <button
                                    type="button"
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white px-6 py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all whitespace-nowrap shadow-md shrink-0"
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
                                    Cari Rute
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


        </div>
    )
}

export default HomePage