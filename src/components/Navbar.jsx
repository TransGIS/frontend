import { useEffect, useState } from 'react'

function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [hash, setHash] = useState(window.location.hash)
    const path = window.location.pathname

    // Perbarui penanda aktif saat hash berubah (klik link #tarif / tombol back)
    useEffect(() => {
        const onHash = () => setHash(window.location.hash)
        window.addEventListener('hashchange', onHash)
        return () => window.removeEventListener('hashchange', onHash)
    }, [])

    // "Info Tarif & Rute" bukan halaman baru, melainkan section #tarif di landing page
    const navLinks = [
        { href: '/', label: 'Home', active: path === '/' && hash !== '#tarif' },
        { href: '/maps', label: 'Peta Perjalanan', active: path === '/maps' },
        { href: '/#tarif', label: 'Info Tarif & Rute', active: path === '/' && hash === '#tarif' },
    ]

    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <a href="/" className="flex items-center gap-2">
                    <span className="text-2xl">📍</span>
                    <span className="text-xl font-bold">
                        <span className="text-[#1B3A8C]">Trans</span>
                        <span className="text-[#F97316]">GIS</span>
                    </span>
                </a>

                {/* Desktop Nav Links */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map(({ href, label, active }) => (
                        <a
                            key={href}
                            href={href}
                            className={`text-sm font-medium transition-colors ${active
                                ? 'text-[#F97316] border-b-2 border-[#F97316] pb-0.5'
                                : 'text-gray-700 hover:text-[#1B3A8C]'
                                }`}
                        >
                            {label}
                        </a>
                    ))}
                </nav>

                {/* Mobile Hamburger Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden p-2 rounded-lg text-gray-600 hover:text-[#1B3A8C] hover:bg-gray-100 focus:outline-none transition-colors"
                    aria-label="Toggle navigation menu"
                >
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Nav Dropdown */}
            {isOpen && (
                <nav className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-4 space-y-1 shadow-lg">
                    {navLinks.map(({ href, label, active }) => (
                        <a
                            key={href}
                            href={href}
                            onClick={() => setIsOpen(false)}
                            className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                                ? 'font-semibold text-[#F97316] bg-orange-50'
                                : 'text-gray-700 hover:text-[#1B3A8C] hover:bg-gray-50'
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