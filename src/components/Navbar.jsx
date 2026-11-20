import { useEffect, useState } from 'react'

function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [hash, setHash] = useState(window.location.hash)
    const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 24)
    const path = window.location.pathname
    const isHome = path === '/'
    const solid = !isHome || isScrolled || isOpen

    // Perbarui penanda aktif saat hash berubah (klik link section / tombol back)
    useEffect(() => {
        const onHash = () => setHash(window.location.hash)
        window.addEventListener('hashchange', onHash)
        return () => window.removeEventListener('hashchange', onHash)
    }, [])

    // Hanya navbar landing yang transparan di puncak dan menjadi putih saat scroll
    useEffect(() => {
        if (!isHome) return
        const onScroll = () => setIsScrolled(window.scrollY > 24)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [isHome])

    const navLinks = [
        { href: '/', label: 'Beranda', active: isHome && hash !== '#tarif' && hash !== '#tentang' },
        { href: '/#tentang', label: 'Tentang', active: isHome && hash === '#tentang' },
        { href: '/#tarif', label: 'Info Tarif & Rute', active: isHome && hash === '#tarif' },
        { href: '/maps', label: 'Peta Perjalanan', active: path === '/maps' },
    ]

    return (
        <header className={`${isHome ? 'fixed' : 'sticky'} inset-x-0 top-0 z-50 border-b transition-colors duration-200 ${solid
            ? 'border-[#12233F]/10 bg-white shadow-[0_2px_0_rgba(18,35,63,0.08)]'
            : 'border-transparent bg-transparent'
            }`}>
            <div className={`max-w-6xl mx-auto flex ${isHome ? 'h-20' : 'h-16'} items-center justify-between px-4 sm:px-6`}>
                <a href="/" className="flex items-center gap-3" aria-label="TransGIS, kembali ke beranda">
                    <span className={`grid h-9 w-9 place-items-center border-2 bg-[#1B3A8C] ${solid
                        ? 'border-[#12233F] shadow-[3px_3px_0_#12233F]'
                        : 'border-white'
                        }`}>
                        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M5 17V7c0-2 2-3 7-3s7 1 7 3v10M5 13h14M8 8h8M8 17v3M16 17v3" />
                            <path d="M8 16h.01M16 16h.01" strokeWidth="3" />
                        </svg>
                    </span>
                    <span className="font-pixel text-2xl font-semibold leading-none">
                        <span className={solid ? 'text-[#1B3A8C]' : 'text-white [text-shadow:2px_2px_0_rgba(18,35,63,0.8)]'}>Trans</span>
                        <span className="text-[#F97316] [text-shadow:2px_2px_0_rgba(18,35,63,0.45)]">GIS</span>
                    </span>
                </a>

                <nav className="hidden md:flex items-center gap-1.5" aria-label="Navigasi utama">
                    {navLinks.map(({ href, label, active }) => (
                        <a
                            key={href}
                            href={href}
                            aria-current={active ? 'page' : undefined}
                            className={`group relative px-3 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] ${active
                                ? 'text-[#F97316] hover:bg-[#F97316]/10'
                                : solid
                                    ? 'text-[#12233F] hover:bg-[#12233F]/5 hover:text-[#1B3A8C]'
                                    : 'text-white [text-shadow:0_1px_8px_rgba(18,35,63,0.9)] hover:bg-white/15'
                                }`}
                        >
                            {label}
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none absolute inset-x-3 bottom-0 h-[2px] origin-left bg-[#F97316] transition-transform duration-300 ease-out ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                            />
                        </a>
                    ))}
                </nav>

                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`border-2 p-2 transition-colors md:hidden ${solid
                        ? 'border-[#12233F] text-[#12233F] hover:bg-gray-100'
                        : 'border-white text-white hover:bg-white/10'
                        }`}
                    aria-label={isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                    aria-expanded={isOpen}
                    aria-controls="mobile-navigation"
                >
                    {isOpen ? (
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {isOpen && (
                <nav id="mobile-navigation" className="space-y-1 border-t-2 border-[#12233F] bg-white px-4 pb-4 pt-3 md:hidden" aria-label="Navigasi seluler">
                    {navLinks.map(({ href, label, active }) => (
                        <a
                            key={href}
                            href={href}
                            onClick={() => setIsOpen(false)}
                            className={`block border-l-4 px-3 py-2.5 text-sm font-semibold transition-colors ${active
                                ? 'border-[#F97316] bg-orange-50 text-[#F97316]'
                                : 'border-transparent text-[#12233F] hover:border-[#1B3A8C] hover:bg-gray-50'
                                }`}
                        >
                            {label}
                        </a>
                    ))}
                </nav>
            )}
        </header>
    )
}

export default Navbar
