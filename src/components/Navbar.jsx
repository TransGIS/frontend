import { useState } from 'react'

function Navbar() {
    const [isOpen, setIsOpen] = useState(false)

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
                    <a
                        href="/"
                        className="text-sm font-medium text-[#F97316] border-b-2 border-[#F97316] pb-0.5"
                    >
                        Home
                    </a>
                    <a
                        href="/peta"
                        className="text-sm font-medium text-gray-700 hover:text-[#1B3A8C] transition-colors"
                    >
                        Peta Perjalanan
                    </a>
                    <a
                        href="/tarif"
                        className="text-sm font-medium text-gray-700 hover:text-[#1B3A8C] transition-colors"
                    >
                        Info Tarif &amp; Rute
                    </a>
                </nav>

                {/* Mobile Hamburger Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden p-2 rounded-lg text-gray-600 hover:text-[#1B3A8C] hover:bg-gray-100 focus:outline-none transition-colors"
                    aria-label="Toggle navigation menu"
                >
                    {isOpen ? (
                        // Icon Close (X)
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    ) : (
                        // Icon Hamburger
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Nav Dropdown */}
            {isOpen && (
                <nav className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-4 space-y-1 shadow-lg">
                    <a
                        href="/"
                        className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-[#F97316] bg-orange-50"
                    >
                        Home
                    </a>
                    <a
                        href="/peta"
                        className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-[#1B3A8C] hover:bg-gray-50 transition-colors"
                    >
                        Peta Perjalanan
                    </a>
                    <a
                        href="/tarif"
                        className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-[#1B3A8C] hover:bg-gray-50 transition-colors"
                    >
                        Info Tarif &amp; Rute
                    </a>
                </nav>
            )}
        </header>
    )
}

export default Navbar