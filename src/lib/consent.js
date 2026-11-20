/* Persetujuan cookie + ID pengunjung anonim.
   - Pilihan user disimpan di localStorage agar banner tidak muncul terus.
   - Cookie `transgis_vid` hanya dibuat SETELAH user menekan "Terima"; isinya
     UUID acak — tanpa nama, email, IP, atau pelacakan iklan.
   - Tanpa cookie, kunjungan tetap tercatat; hanya metrik "pengunjung unik"
     yang tidak bertambah. */
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const CHOICE_KEY = 'transgis_cookie_choice'
export const VID_COOKIE = 'transgis_vid'

const readCookie = (name) => {
    if (typeof document === 'undefined') return ''
    const hit = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))
    return hit ? decodeURIComponent(hit.slice(name.length + 1)) : ''
}

const writeCookie = (name, value, days) => {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${days * 86400}; SameSite=Lax`
}

const dropCookie = (name) => {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

/** null = belum memilih, 'accepted' | 'rejected' = pilihan tersimpan. */
export function getConsent() {
    try { return localStorage.getItem(CHOICE_KEY) } catch { return null }
}

export function setConsent(value) {
    try { localStorage.setItem(CHOICE_KEY, value) } catch { /* mode privat: banner bisa muncul lagi */ }
    if (value !== 'accepted') dropCookie(VID_COOKIE)
}

/** ID anonim untuk hari ini; string kosong bila belum/tidak menyetujui cookie. */
export function visitorId() {
    if (getConsent() !== 'accepted') return ''
    let vid = readCookie(VID_COOKIE)
    if (!/^[A-Za-z0-9-]{8,64}$/.test(vid)) {
        vid = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
        writeCookie(VID_COOKIE, vid, 365)
    }
    return vid
}

/** Daftarkan kunjungan unik hari ini. Aman dipanggil berkali-kali (backend upsert). */
export function registerVisitor() {
    const vid = visitorId()
    if (!vid) return
    fetch(`${API}/api/public/visitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vid }),
    }).catch(() => {})
}