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