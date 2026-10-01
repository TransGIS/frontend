function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
                {/* Brand column */}
                <div className="sm:col-span-2 lg:col-span-1">
                    <a href="/" className="inline-flex items-center gap-2 mb-3 sm:mb-4">
                        <span className="text-2xl">📍</span>
                        <span className="text-xl font-bold">
                            <span className="text-[#1B3A8C]">Trans</span>
                            <span className="text-[#F97316]">GIS</span>
                        </span>
                    </a>
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-sm">
                        Platform Sistem Informasi Geografis (GIS) navigasi transportasi
                        publik Kota Bogor yang memberikan kepastian rute, tarif, dan
                        panduan perjalanan cerdas terintegrasi.
                    </p>
                </div>

                {/* Navigasi Utama */}
                <div>
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 sm:mb-4">
                        Navigasi Utama
                    </h3>
                    <ul className="space-y-2.5 sm:space-y-3">
                        {[
                            'Beranda',
                            'Peta Rute Interaktif',
                            'Info Tarif',
                            'Jadwal BisKita',
                            'Daftar Trayek Angkot',
                        ].map((item) => (
                            <li key={item}>
                                <a
                                    href="#"
                                    className="text-xs sm:text-sm text-gray-500 hover:text-[#1B3A8C] transition-colors"
                                >
                                    {item}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Pusat Mobilitas */}
                <div>
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 sm:mb-4">
                        Pusat Mobilitas
                    </h3>
                    <ul className="space-y-2.5 sm:space-y-3">
                        {[
                            'Kebun Raya Bogor',
                            'Terminal Baranangsiang',
                            'Terminal Bubulak',
                            'Kampus IPB University',
                        ].map((item) => (
                            <li key={item}>
                                <a
                                    href="#"
                                    className="text-xs sm:text-sm text-gray-500 hover:text-[#1B3A8C] transition-colors"
                                >
                                    {item}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Bantuan & Regulasi */}
                <div>
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 sm:mb-4">
                        Bantuan &amp; Regulasi
                    </h3>
                    <ul className="space-y-2.5 sm:space-y-3">
                        {[
                            'Pusat Pengaduan Trayek',
                            'Dishub Kota Bogor',
                            'Kebijakan Privasi',
                            'Syarat & Ketentuan',
                        ].map((item) => (
                            <li key={item}>
                                <a
                                    href="#"
                                    className="text-xs sm:text-sm text-gray-500 hover:text-[#1B3A8C] transition-colors"
                                >
                                    {item}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </footer>
    )
}

export default Footer