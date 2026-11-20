import { useEffect, useState } from 'react'

const PRELOADER_SESSION_KEY = 'transgis_preloader_seen'

export function shouldShowPreloader() {
  const navigation = window.performance.getEntriesByType('navigation')[0]
  if (navigation?.type === 'reload') return true
  try {
    return window.sessionStorage.getItem(PRELOADER_SESSION_KEY) !== '1'
  } catch {
    return true
  }
}

export function markPreloaderSeen() {
  try {
    window.sessionStorage.setItem(PRELOADER_SESSION_KEY, '1')
  } catch {
    // Preloader tetap berfungsi bila penyimpanan sesi dibatasi browser.
  }
}

function TransitLoaderScene() {
  return (
    <svg
      viewBox="0 0 640 260"
      className="transgis-preloader-scene"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <g fill="#FBBF24">
        <rect x="526" y="24" width="42" height="42" />
        <rect x="534" y="16" width="26" height="58" />
        <rect x="518" y="32" width="58" height="26" />
      </g>

      <g className="transgis-loader-cloud" fill="#DCEAF7">
        <rect x="72" y="44" width="88" height="14" />
        <rect x="88" y="32" width="48" height="12" />
        <rect x="58" y="52" width="116" height="8" />
      </g>
      <g className="transgis-loader-cloud transgis-loader-cloud-late" fill="#E8E1CC">
        <rect x="372" y="58" width="66" height="12" />
        <rect x="386" y="48" width="34" height="10" />
        <rect x="360" y="64" width="92" height="7" />
      </g>

      <g fill="#DDE5D6">
        <path d="M0 198V170H18V158H36V144H54V128H72V114H90V128H108V142H126V156H144V170H162V198Z" />
        <path d="M112 198V178H132V164H152V148H172V134H192V148H212V162H232V178H252V198Z" />
        <path d="M388 198V174H408V158H428V140H448V122H468V138H488V154H508V170H528V198Z" />
        <path d="M496 198V178H516V164H536V148H556V132H576V148H596V164H616V178H640V198Z" />
      </g>
      <g fill="#C3D0BA">
        <path d="M0 198V184H28V172H56V160H84V172H112V184H140V198Z" />
        <path d="M360 198V184H388V172H416V160H444V172H472V184H500V198Z" />
      </g>

      <g transform="translate(448 0)" stroke="#12233F" strokeWidth="3" strokeLinejoin="miter">
        <path d="M12 96H4V86H10V76H16V66H24V54H34V68H30V78H26V88H20V96Z" fill="#FFFFFF" />
        <path d="M14 96H28L34 178H8Z" fill="#FFFFFF" />
        <path d="M23 98H28L34 178H24Z" fill="#94A3B8" stroke="none" />
        <rect x="4" y="176" width="34" height="12" fill="#FFFFFF" />
        <rect x="0" y="188" width="42" height="10" fill="#94A3B8" />
        <rect x="8" y="180" width="26" height="4" fill="#F97316" stroke="none" />
      </g>
      <g fill="#12233F">
        <rect x="522" y="132" width="6" height="68" />
        <rect x="500" y="102" width="50" height="36" />
      </g>
      <rect x="505" y="107" width="40" height="26" fill="#FFFFFF" />
      <text x="517" y="128" fill="#1B3A8C" fontFamily="Pixelify Sans, monospace" fontSize="24">H</text>

      <rect x="0" y="200" width="640" height="38" fill="#CBD5E1" />
      <rect x="0" y="198" width="640" height="4" fill="#12233F" />
      <rect x="0" y="236" width="640" height="4" fill="#12233F" />
      <g className="transgis-loader-dashes" fill="#FFFFFF">
        {Array.from({ length: 17 }, (_, index) => (
          <rect key={index} x={index * 48 - 48} y="215" width="28" height="5" />
        ))}
      </g>

      <g className="transgis-loader-angkot" stroke="#12233F" strokeWidth="4">
        <rect x="106" y="118" width="90" height="12" fill="#16A34A" />
        <rect x="90" y="128" width="136" height="58" fill="#16A34A" />
        <rect x="104" y="140" width="30" height="23" fill="#DCEAF7" />
        <rect x="142" y="140" width="30" height="23" fill="#DCEAF7" />
        <rect x="180" y="140" width="32" height="34" fill="#DCEAF7" />
        <rect x="90" y="169" width="136" height="8" fill="#F97316" />
        <rect x="106" y="176" width="24" height="23" fill="#12233F" />
        <rect x="184" y="176" width="24" height="23" fill="#12233F" />
        <rect x="112" y="183" width="12" height="9" fill="#94A3B8" stroke="none" />
        <rect x="190" y="183" width="12" height="9" fill="#94A3B8" stroke="none" />
        <rect x="218" y="151" width="12" height="10" fill="#FBBF24" />
        <text x="145" y="180" fill="#FFFFFF" stroke="none" fontFamily="Pixelify Sans, monospace" fontSize="15">02</text>
      </g>

      <g className="transgis-loader-bus" stroke="#12233F" strokeWidth="4">
        <rect x="272" y="82" width="114" height="14" fill="#1B3A8C" />
        <rect x="250" y="94" width="182" height="91" fill="#1B3A8C" />
        <rect x="266" y="108" width="36" height="30" fill="#DCEAF7" />
        <rect x="310" y="108" width="36" height="30" fill="#DCEAF7" />
        <rect x="354" y="108" width="36" height="30" fill="#DCEAF7" />
        <rect x="398" y="108" width="22" height="52" fill="#DCEAF7" />
        <rect x="250" y="147" width="182" height="11" fill="#F97316" />
        <rect x="274" y="174" width="28" height="25" fill="#12233F" />
        <rect x="378" y="174" width="28" height="25" fill="#12233F" />
        <rect x="282" y="182" width="12" height="9" fill="#94A3B8" stroke="none" />
        <rect x="386" y="182" width="12" height="9" fill="#94A3B8" stroke="none" />
        <rect x="422" y="164" width="14" height="10" fill="#FBBF24" />
        <text x="303" y="178" fill="#FFFFFF" stroke="none" fontFamily="Pixelify Sans, monospace" fontSize="17">BISKITA</text>
      </g>
    </svg>
  )
}

export default function Preloader({ onFinish }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const minimumDuration = reducedMotion ? 250 : 1300
    const startedAt = performance.now()
    const previousOverflow = document.body.style.overflow
    let disposed = false
    let exitTimer
    let minimumTimer

    document.body.style.overflow = 'hidden'

    const finishWhenReady = () => {
      const remaining = Math.max(0, minimumDuration - (performance.now() - startedAt))
      minimumTimer = window.setTimeout(() => {
        if (disposed) return
        if (reducedMotion) {
          onFinish()
          return
        }
        setLeaving(true)
        exitTimer = window.setTimeout(onFinish, 220)
      }, remaining)
    }

    if (document.readyState === 'complete') finishWhenReady()
    else window.addEventListener('load', finishWhenReady, { once: true })

    return () => {
      disposed = true
      window.removeEventListener('load', finishWhenReady)
      window.clearTimeout(minimumTimer)
      window.clearTimeout(exitTimer)
      document.body.style.overflow = previousOverflow
    }
  }, [onFinish])

  return (
    <div
      className={`transgis-preloader${leaving ? ' is-leaving' : ''}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy="true"
    >
      <div className="transgis-preloader-content">
        <TransitLoaderScene />
        <h1 className="font-pixel mt-5 text-6xl leading-none sm:text-7xl" aria-label="TransGIS">
          <span className="text-[#1B3A8C]">Trans</span><span className="text-[#F97316]">GIS</span>
        </h1>
        <div className="mt-6 flex items-center justify-center gap-2" aria-hidden="true">
          <span className="transgis-loader-dot bg-[#1B3A8C]" />
          <span className="transgis-loader-dot bg-[#F97316] [animation-delay:140ms]" />
          <span className="transgis-loader-dot bg-[#16A34A] [animation-delay:280ms]" />
        </div>
        <p className="mt-4 text-sm text-[#12233F]/65 sm:text-base">Menyiapkan rute perjalananmu</p>
      </div>
    </div>
  )
}
