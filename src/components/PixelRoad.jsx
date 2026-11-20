export function RoadMarker({ number, label }) {
    return (
        <div className="road-strip relative" aria-hidden="true">
            <div className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 border-2 border-[#12233F] font-pixel text-lg shadow-[3px_3px_0_#12233F] sm:left-8 xl:left-[calc((100%_-_72rem)_/_2)]">
                <span className="bg-[#1B3A8C] px-3 py-1 text-white">{number}</span>
                <span className="bg-[#F97316] px-4 py-1 text-[#12233F]">{label}</span>
            </div>
        </div>
    )
}

export function PixelTransitScene() {
    return (
        <svg
            viewBox="0 0 640 430"
            className="pixel-panel block h-auto w-full"
            role="img"
            aria-labelledby="pixel-transit-title pixel-transit-desc"
            shapeRendering="crispEdges"
        >
            <title id="pixel-transit-title">Ilustrasi pixel perjalanan TransGIS di Bogor</title>
            <desc id="pixel-transit-desc">Peta bergaya pixel dengan halte, bus, angkot, titik transit, dan jalur jalan kaki menuju tujuan.</desc>
            <rect width="640" height="430" fill="#F7F4EA" />

            <g fill="#E8E1CC">
                <rect x="36" y="38" width="126" height="82" />
                <rect x="202" y="38" width="148" height="82" />
                <rect x="468" y="38" width="136" height="82" />
                <rect x="36" y="154" width="82" height="104" />
                <rect x="210" y="150" width="92" height="74" />
                <rect x="474" y="148" width="130" height="70" />
                <rect x="174" y="322" width="134" height="72" />
                <rect x="478" y="330" width="126" height="64" />
            </g>

            <path d="M52 336H170V264H292V192H424V104H580" fill="none" stroke="#FFFFFF" strokeWidth="46" />
            <path d="M52 336H170V264H292V192H424V104H580" fill="none" stroke="#CBD5E1" strokeWidth="34" />
            <path d="M52 336H170V264H292V192H424V104H580" fill="none" stroke="#1B3A8C" strokeWidth="12" />
            <path d="M52 336V378H132" fill="none" stroke="#16A34A" strokeWidth="7" strokeDasharray="14 10" />

            <g stroke="#12233F" strokeWidth="4">
                <rect x="42" y="326" width="20" height="20" fill="#F97316" />
                <rect x="282" y="182" width="20" height="20" fill="#F97316" />
                <rect x="570" y="94" width="20" height="20" fill="#16A34A" />
            </g>

            <g fontFamily="Pixelify Sans, monospace" fontSize="18" fill="#12233F">
                <rect x="30" y="282" width="92" height="32" fill="#FFFFFF" stroke="#12233F" strokeWidth="3" />
                <text x="43" y="305">Halte</text>
                <rect x="230" y="126" width="108" height="32" fill="#FFFFFF" stroke="#12233F" strokeWidth="3" />
                <text x="243" y="149">Transit</text>
                <rect x="478" y="42" width="112" height="32" fill="#FFFFFF" stroke="#12233F" strokeWidth="3" />
                <text x="491" y="65">Tujuan</text>
            </g>

            <g stroke="#12233F" strokeWidth="4">
                <rect x="360" y="244" width="174" height="82" fill="#1B3A8C" />
                <rect x="374" y="230" width="130" height="16" fill="#1B3A8C" />
                <rect x="374" y="256" width="38" height="28" fill="#DCEAF7" />
                <rect x="420" y="256" width="38" height="28" fill="#DCEAF7" />
                <rect x="466" y="256" width="38" height="28" fill="#DCEAF7" />
                <rect x="512" y="256" width="14" height="52" fill="#F97316" />
                <rect x="360" y="292" width="174" height="12" fill="#F97316" />
                <rect x="378" y="318" width="26" height="18" fill="#12233F" />
                <rect x="486" y="318" width="26" height="18" fill="#12233F" />
            </g>
            <g fontFamily="Pixelify Sans, monospace" fontSize="18" fill="#12233F">
                <rect x="372" y="348" width="152" height="32" fill="#FFFFFF" stroke="#12233F" strokeWidth="3" />
                <text x="385" y="371">BisKita</text>
            </g>

            <g stroke="#12233F" strokeWidth="4">
                <rect x="116" y="158" width="104" height="58" fill="#16A34A" />
                <rect x="128" y="168" width="28" height="22" fill="#DCEAF7" />
                <rect x="164" y="168" width="28" height="22" fill="#DCEAF7" />
                <rect x="198" y="168" width="14" height="34" fill="#F97316" />
                <rect x="128" y="208" width="20" height="16" fill="#12233F" />
                <rect x="184" y="208" width="20" height="16" fill="#12233F" />
            </g>

            <g fill="#12233F">
                <rect x="76" y="146" width="12" height="72" />
                <rect x="66" y="136" width="32" height="12" />
                <rect x="72" y="124" width="20" height="12" />
                <rect x="60" y="216" width="44" height="10" />
            </g>
            <g fill="#F97316">
                <rect x="562" y="270" width="16" height="16" />
                <rect x="546" y="286" width="16" height="16" />
                <rect x="94" y="66" width="14" height="14" />
            </g>
        </svg>
    )
}
