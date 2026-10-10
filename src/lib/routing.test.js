import { describe, it, expect } from 'vitest'
import { buildGraph, planTrips } from './routing'

describe('Dijkstra routing', () => {
    const routeA = {
        id: 'A', ref: 'K1', kind: 'biskita', from: 'Sta. Bogor', to: 'Terminal Bubulak',
        color: '#f00', fare: 'Rp 4.000',
        parts: [{
            pts: [[-6.60, 106.79], [-6.60, 106.80], [-6.60, 106.81]],
            cum: [0, 1.1, 2.2],
            dir: null
        }]
    }
    const routeB = {
        id: 'B', ref: 'K2', kind: 'biskita', from: 'Terminal Bubulak', to: 'IPB',
        color: '#00f', fare: 'Rp 4.000',
        parts: [{
            pts: [[-6.60, 106.81], [-6.61, 106.82], [-6.62, 106.83]],
            cum: [0, 1.5, 3.0],
            dir: null
        }]
    }

    const g = buildGraph([routeA, routeB])

    it('membangun graf dengan node yang benar', () => {
        expect(g.nodes.length).toBeGreaterThan(0)
    })

    it('menemukan rute langsung (tanpa transit)', () => {
        const A = [-6.60, 106.789]
        const B = [-6.60, 106.809] // masih di routeA
        const plans = planTrips(g, A, B)
        expect(plans.length).toBeGreaterThan(0)
        expect(plans[0].transfers).toBe(0)
    })

    it('menemukan rute dengan 1 transit antar jalur', () => {
        const A = [-6.60, 106.789] // dekat awal routeA
        const B = [-6.62, 106.831] // dekat akhir routeB
        const plans = planTrips(g, A, B)
        expect(plans.length).toBeGreaterThan(0)
        expect(plans[0].transfers).toBe(1)
        expect(plans[0].legs.map(l => l.route.ref)).toEqual(['K1', 'K2'])
    })

    it('tidak menemukan rute kalau titik terlalu jauh', () => {
        const A = [-7.5, 108.0] // jauh dari semua jalur
        const B = [-6.62, 106.831]
        const plans = planTrips(g, A, B)
        expect(plans.length).toBe(0)
    })
})

describe('Angkot 1 garis = bolak-balik', () => {
    const angkot = {
        id: '07', ref: '07', kind: 'angkot', from: 'Ciawi', to: 'Baranangsiang',
        color: '#0a0', fare: 'Rp 5.000-7.000',
        parts: [{
            pts: [[-6.60, 106.79], [-6.60, 106.80], [-6.60, 106.81]],
            cum: [0, 1.1, 2.2],
            dir: 'Baranangsiang'
        }]
    }
    const g = buildGraph([angkot])
    const west = [-6.60, 106.789]
    const east = [-6.60, 106.809]

    it('bisa dinaiki searah urutan titik', () => {
        const plans = planTrips(g, west, east)
        expect(plans.length).toBeGreaterThan(0)
        expect(plans[0].legs[0].reversed).toBe(false)
    })

    it('bisa dinaiki ke arah sebaliknya', () => {
        const plans = planTrips(g, east, west)
        expect(plans.length).toBeGreaterThan(0)
        const leg = plans[0].legs[0]
        expect(leg.reversed).toBe(true)
        expect(leg.km).toBeGreaterThan(0)
        // titik rute berurutan dari tempat naik (timur) ke tempat turun (barat)
        expect(leg.ridePts[0][1]).toBeGreaterThan(leg.ridePts[leg.ridePts.length - 1][1])
    })

    it('BisKita 1 garis tetap searah (tidak diubah)', () => {
        const bus = { ...angkot, id: 'K9', ref: 'K9', kind: 'biskita' }
        const gb = buildGraph([bus])
        expect(planTrips(gb, east, west)).toEqual([])
    })

    it('tidak membuat edge ganda bila arah sebaliknya sudah digambar', () => {
        const back = {
            pts: [[-6.60, 106.81], [-6.60, 106.80], [-6.60, 106.79]],
            cum: [0, 1.1, 2.2],
            dir: 'Ciawi'
        }
        const two = { ...angkot, parts: [angkot.parts[0], back] }
        const g2 = buildGraph([two])
        const rides = g2.adj.flat().filter((e) => e.type === 'ride').length
        const g1 = buildGraph([{ ...angkot, kind: 'biskita' }])
        const rides1 = g1.adj.flat().filter((e) => e.type === 'ride').length
        expect(rides).toBe(rides1 * 2) // 2 bagian × edge searah saja
    })
})

/* ── Arah pergi & pulang yang sudah digambar tidak boleh bisa dinaiki bolak-balik ── */
describe('Angkot 2 arah (pergi & pulang digambar terpisah)', () => {
    // garis lurus timur-barat di lat -6.60, titik tiap 0.001° (~110 m)
    const line = (from, to) => {
        const pts = []
        const step = from < to ? 0.001 : -0.001
        for (let x = from; step > 0 ? x <= to + 1e-9 : x >= to - 1e-9; x += step) pts.push([-6.60, +x.toFixed(4)])
        const cum = [0]
        for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + 0.111)
        return { pts, cum, dir: null }
    }
    const mk = (id, part) => ({
        id, ref: '07', kind: 'angkot', from: 'A', to: 'B', color: '#0a0', fare: 'Rp 5.000-7.000', parts: [part],
    })
    const west = [-6.60, 106.779]
    const east = [-6.60, 106.826]

    it('pergi & pulang sebagai rute terpisah (ref sama): tidak ada jalur mundur', () => {
        const go = mk('07-pergi', line(106.78, 106.825))
        const back = mk('07-pulang', line(106.825, 106.78))
        const g = buildGraph([go, back])
        const plans = planTrips(g, east, west)
        expect(plans.length).toBeGreaterThan(0)
        expect(plans[0].legs[0].route.id).toBe('07-pulang')
        expect(plans[0].legs[0].reversed).toBe(false)
        expect(planTrips(g, west, east)[0].legs[0].route.id).toBe('07-pergi')
    })

    it('ujung berbeda >0,5 km tapi menimpa jalan yang sama tetap dianggap arah sebaliknya', () => {
        const go = mk('07-pergi', line(106.78, 106.825))
        const back = mk('07-pulang', line(106.8195, 106.7855)) // pendek, ujung menjorok ~0,6 km
        const g = buildGraph([go, back])
        const plans = planTrips(g, [-6.60, 106.8185], [-6.60, 106.7865])
        expect(plans.length).toBeGreaterThan(0)
        expect(plans.every((p) => p.legs.every((l) => l.reversed === false))).toBe(true)
    })

    it('tidak ada edge pindah antar arah pada nomor rute yang sama', () => {
        const go = mk('07-pergi', line(106.78, 106.825))
        const back = mk('07-pulang', line(106.825, 106.78))
        const g = buildGraph([go, back])
        const bad = g.adj.some((edges, u) =>
            edges.some((e) => e.type === 'xfer' && g.nodes[e.to].route.ref === g.nodes[u].route.ref),
        )
        expect(bad).toBe(false)
    })
})

/* ── Loop satu arah (mis. SSA Kebun Raya) pada angkot 1 garis ── */
import { ONEWAY_ZONES } from '../data/oneway-zones'

describe('Angkot 1 garis dengan loop satu arah', () => {
    const KM = 0.009 // ≈ derajat per km
    // jalur lurus ke timur sepanjang 3 km, lalu memutar penuh (radius 0,5 km) di ujungnya
    const build = () => {
        const pts = []
        for (let x = 0; x <= 3; x += 0.1) pts.push([-6.60, 106.75 + x * KM])
        const cx = 106.75 + 3 * KM + 0.5 * KM
        const R = 0.5 * KM
        for (let a = 180; a <= 180 + 360; a += 15) {
            const t = (a * Math.PI) / 180
            pts.push([-6.60 + R * Math.sin(t), cx + R * Math.cos(t)])
        }
        const cum = [0]
        for (let i = 1; i < pts.length; i++) {
            const dy = (pts[i][0] - pts[i - 1][0]) / KM
            const dx = (pts[i][1] - pts[i - 1][1]) / KM
            cum.push(cum[i - 1] + Math.hypot(dx, dy))
        }
        return {
            id: '05', ref: '05', kind: 'angkot', from: 'Cimahpar', to: 'Ramayana',
            color: '#0a0', fare: 'Rp 5.000-7.000', parts: [{ pts, cum, dir: 'Ramayana' }],
        }
    }
    const route = build()
    const g = buildGraph([route])

    it('mendeteksi bagian yang berputar sebagai satu arah', () => {
        expect(g.loops.length).toBe(1)
        const lp = g.loops[0]
        expect(lp.toKm - lp.fromKm).toBeGreaterThan(2) // sebagian besar keliling (~3,1 km)
        expect(lp.fromKm).toBeGreaterThan(2.5) // bagian lurus di awal TIDAK ikut
    })

    it('tidak ada edge mundur di dalam loop', () => {
        const { fromId, toId } = g.loops[0]
        for (let u = fromId; u <= toId; u++) {
            const back = g.adj[u].filter((e) => e.type === 'ride' && e.to < u && e.to >= fromId)
            expect(back).toEqual([])
        }
    })

    it('bagian lurus di luar loop tetap bisa dinaiki bolak-balik', () => {
        const west = [-6.60, 106.75 + 0.2 * KM]
        const east = [-6.60, 106.75 + 2.5 * KM]
        const plans = planTrips(g, east, west)
        expect(plans.length).toBeGreaterThan(0)
        expect(plans[0].legs[0].reversed).toBe(true)
    })

    it('zona satu arah manual memblokir jalur balik di dalam kotak', () => {
        const straight = {
            id: '09', ref: '09', kind: 'angkot', from: 'A', to: 'B', color: '#0a0', fare: 'x',
            parts: [{
                pts: Array.from({ length: 31 }, (_, i) => [-6.60, 106.75 + i * 0.1 * KM]),
                cum: Array.from({ length: 31 }, (_, i) => i * 0.1),
                dir: 'B',
            }],
        }
        const east = [-6.60, 106.75 + 2.8 * KM]
        const west = [-6.60, 106.75 + 0.2 * KM]
        expect(planTrips(buildGraph([straight]), east, west).length).toBeGreaterThan(0)

        ONEWAY_ZONES.push({ name: 'uji', bounds: [-6.61, 106.75, -6.59, 106.75 + 3 * KM] })
        try {
            expect(planTrips(buildGraph([straight]), east, west)).toEqual([])
            expect(planTrips(buildGraph([straight]), west, east).length).toBeGreaterThan(0)
        } finally {
            ONEWAY_ZONES.pop()
        }
    })
})