import Lenis from 'lenis'
import { registerScrollProvider } from './scrollTo'

/**
 * Smooth scroll (Lenis) untuk halaman TransGIS yang menggulir dokumen.
 *
 * Hanya dipakai di landing page: /maps memakai wheel event untuk zoom/pan
 * Leaflet, dan area admin punya wadah scroll sendiri (sidebar, panel notifikasi).
 * Posisi akhir mengikuti scroll-margin-top section tujuan (#tentang, #tarif)
 * sehingga tidak tertutup navbar setinggi 80px.
 */

let lenis = null
let unregister = null

export function initSmoothScroll() {
    if (lenis) return lenis

    lenis = new Lenis({
        duration: 1.2,
        lerp: 0.12,
        smoothWheel: true,
        // Di layar sentuh, scroll native lebih nyaman daripada simulasi.
        syncTouch: false,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
        autoRaf: true,
        // Tautan section ditangani manual supaya browser tidak lompat instan.
        anchors: false,
        stopInertiaOnNavigate: true,
        // Menghormati preferensi "kurangi animasi" sistem.
        respectReducedMotion: true,
    })

    document.addEventListener('click', handleAnchorClick)
    unregister = registerScrollProvider(scrollWithLenis)

    // Buka di section yang dituju bila URL membawa hash (#tarif).
    if (window.location.hash) {
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
        if (target) lenis.scrollTo(target, { offset: 0 })
    }

    return lenis
}

export function destroySmoothScroll() {
    document.removeEventListener('click', handleAnchorClick)
    if (unregister) {
        unregister()
        unregister = null
    }
    if (lenis) {
        lenis.destroy()
        lenis = null
    }
}

function scrollWithLenis(el) {
    if (lenis) lenis.scrollTo(el, { offset: 0 })
}

// Tautan section (#tarif, #tentang) digulir halus, bukan lompat instan.
function handleAnchorClick(event) {
    if (event.defaultPrevented) return
    if (event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    const link = event.target?.closest?.('a[href]')
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return

    let url
    try {
        url = new URL(link.href, window.location.href)
    } catch {
        return
    }

    if (url.origin !== window.location.origin) return
    if (!url.hash) return
    // Tautan ke halaman lain (mis. /maps) dibiarkan ke browser.
    if (url.pathname !== window.location.pathname) return

    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)))
    if (!target) return

    event.preventDefault()
    if (lenis) {
        lenis.scrollTo(target, { offset: 0 })
    } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`)
    // Beri tahu navbar agar penanda menu aktif ikut berubah.
    window.dispatchEvent(new Event('hashchange'))
}
