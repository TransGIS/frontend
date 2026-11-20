const NAV_ITEMS = [
    { href: '/', label: 'Beranda' },
    { href: '/maps', label: 'Peta perjalanan' },
    { href: '/#tentang', label: 'Tentang proyek' },
    { href: '/#tarif', label: 'Info tarif & rute' },
]

function Footer() {
    return (
        <footer className="site-footer border-t-2 border-[#12233F] bg-[#12233F] text-[#F7F4EA]">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-14 md:grid-cols-[1.35fr_0.75fr_1fr] lg:px-8">
                <div className="max-w-md">
                    <a href="/" className="inline-flex items-center gap-3" aria-label="TransGIS, kembali ke beranda">
                        <span className="grid h-10 w-10 place-items-center border-2 border-[#F7F4EA] bg-[#1B3A8C] shadow-[3px_3px_0_#F97316]">
                            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M5 17V7c0-2 2-3 7-3s7 1 7 3v10M5 13h14M8 8h8M8 17v3M16 17v3" />
                                <path d="M8 16h.01M16 16h.01" strokeWidth="3" />
                            </svg>
                        </span>
                        <span className="font-pixel text-3xl font-semibold leading-none">
                            <span className="text-white">Trans</span><span className="text-[#F97316]">GIS</span>
                        </span>
                    </a>
                    <p className="mt-5 text-sm leading-7 text-[#F7F4EA]/70">
                        Cari rute BisKita dan angkot, lengkap dengan titik transit, jalan kaki, estimasi waktu, dan tarif.
                    </p>
                </div>

                <nav aria-label="Navigasi footer">
                    <h2 className="font-pixel text-2xl font-semibold text-white">Jelajahi</h2>
                    <ul className="mt-4 space-y-3">
                        {NAV_ITEMS.map((item) => (
                            <li key={item.href}>
                                <a
                                    href={item.href}
                                    className="inline-block text-sm text-[#F7F4EA]/75 underline decoration-transparent underline-offset-4 transition-colors hover:text-[#F97316] hover:decoration-[#F97316] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                                >
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="md:justify-self-end">
                    <h2 className="font-pixel text-2xl font-semibold text-white">Mau ke mana?</h2>
                    <p className="mt-3 max-w-xs text-sm leading-6 text-[#F7F4EA]/70">
                        Pilih asal dan tujuan. TransGIS bantu susun rutenya.
                    </p>
                    <a
                        href="/maps"
                        className="press-pixel press-pixel-cream mt-5 inline-flex items-center gap-3 border-2 border-[#F7F4EA] bg-[#F97316] px-5 py-3 text-sm font-extrabold text-[#12233F] shadow-[4px_4px_0_#F7F4EA] hover:bg-[#F7F4EA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12233F]"
                    >
                        Buka peta perjalanan
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                    </a>
                </div>
            </div>

            <div className="border-t border-[#F7F4EA]/15">
                <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs leading-5 text-[#F7F4EA]/55 sm:flex-row sm:items-center sm:px-6 lg:px-8">
                    <p>© {new Date().getFullYear()} TransGIS.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
