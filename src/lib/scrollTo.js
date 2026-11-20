/**
 * Jembatan gulir halaman.
 *
 * Backend smooth scroll (Lenis) mendaftarkan dirinya di sini saat aktif.
 * Sebelum itu — atau bila paket lenis belum terpasang — gulir memakai
 * scroll bawaan browser, sehingga aplikasi tidak pernah gagal dimuat.
 */

let provider = null

export function registerScrollProvider(next) {
    provider = next
    return () => {
        if (provider === next) provider = null
    }
}

/**
 * Gulir ke elemen tertentu. Posisi akhir mengikuti scroll-margin-top elemen
 * tujuan sehingga section tidak tertutup navbar.
 */
export function scrollToTarget(el) {
    if (!el) return
    if (provider) {
        provider(el)
        return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
