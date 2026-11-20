import { useState } from 'react'
import { getConsent, setConsent, registerVisitor } from '../lib/consent'

/* Banner persetujuan cookie (bukan modal): tidak menghalangi halaman.
   Muncul sekali sampai user memilih; pilihan disimpan di localStorage. */
export default function CookieConsent() {
    const [open, setOpen] = useState(() => getConsent() === null)
    const [detail, setDetail] = useState(false)
    if (!open) return null

    const choose = (value) => {
        setConsent(value)
        if (value === 'accepted') registerVisitor()
        setOpen(false)
    }

    return (
        <section
            aria-labelledby="cookie-title"
            className="fixed inset-x-3 bottom-3 z-[1400] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[380px]"
        >
            <div className="border-2 border-[#12233F] bg-[#F7F4EA] shadow-[5px_5px_0_#12233F]">
                <div className="flex items-center justify-between gap-3 border-b-2 border-[#12233F] bg-[#12233F] px-4 py-2">
                    <h2 id="cookie-title" className="font-pixel text-base leading-none text-[#F7F4EA]">Cookie pengunjung</h2>
                    <span className="border border-[#F7F4EA]/35 px-1.5 py-0.5 text-[10px] font-bold leading-4 text-[#F7F4EA]/80">anonim</span>
                </div>

                <div className="p-4">
                    <p className="text-[13px] leading-6 text-[#12233F]">
                        Kami memakai <b>satu cookie berisi ID acak</b> untuk menghitung pengunjung unik. Tidak ada nama, email, atau pelacakan iklan.
                    </p>

                    {detail && (
                        <ul className="mt-3 space-y-1.5 border-t-2 border-[#12233F]/10 pt-3 text-xs leading-5 text-gray-600">
                            <li><b className="text-[#12233F]">transgis_vid</b> — ID acak (UUID), berlaku 1 tahun, hanya dibaca backend TransGIS.</li>
                            <li>Pilihanmu disimpan di browser ini, bukan di server.</li>
                            <li>Menolak? Kunjungan tetap dihitung; hanya statistik pengunjung unik yang tidak bertambah.</li>
                        </ul>
                    )}

                    <button
                        type="button"
                        onClick={() => setDetail((v) => !v)}
                        aria-expanded={detail}
                        className="mt-2 text-xs font-bold text-[#1B3A8C] underline decoration-[#F97316] decoration-2 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                    >
                        {detail ? 'Sembunyikan detail' : 'Lihat detail'}
                    </button>

                    <div className="mt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={() => choose('rejected')}
                            className="press-pixel press-pixel-sm flex-1 border-2 border-[#12233F] bg-white px-3 py-2 text-xs font-extrabold text-[#12233F] shadow-[3px_3px_0_#12233F] hover:bg-[#EFEAD9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                        >
                            Tolak
                        </button>
                        <button
                            type="button"
                            onClick={() => choose('accepted')}
                            className="press-pixel press-pixel-sm flex-1 border-2 border-[#12233F] bg-[#F97316] px-3 py-2 text-xs font-extrabold text-[#12233F] shadow-[3px_3px_0_#12233F] hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A8C]"
                        >
                            Terima
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}