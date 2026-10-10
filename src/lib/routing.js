/* ────────────────────────────────────────────────────────────
   Routing multi-rute (transit antar trayek) dengan Dijkstra
   Taruh di: src/pages/routing.js  (atau src/lib/routing.js)

   Model graf:
   - Node  = titik di sepanjang jalur (di-downsample tiap STEP_KM).
   - Edge "ride"  = node → node berikutnya di jalur yang sama (searah).
   - Edge "xfer"  = node → node terdekat di jalur LAIN (jalan kaki + tunggu).
   - Asal / tujuan = sumber & target virtual (jalan kaki ke/dari jalur).
   ──────────────────────────────────────────────────────────── */

export const SPEED = { biskita: 18, angkot: 15 } // km/jam
export const WAIT_MIN = 5
export const MAX_WALK_KM = 1.5
export const DETOUR = 1.25 // faktor jalan kaki tidak lurus
const WALK_KMH = 4.8
const TRANSFER_KM = 0.35 // jarak maks pindah jalur
const STEP_KM = 0.2 // jarak antar node
const FARE_NUM = { biskita: [4000, 4000], angkot: [5000, 7000] }

// Tiap profil = satu "gaya" pencarian → hasil beragam
const PROFILES = [
    { walkMul: 1, xferPen: 0 }, // tercepat
    { walkMul: 1, xferPen: 12 }, // hindari transit
    { walkMul: 3, xferPen: 3 }, // hindari jalan kaki
]

const RAD = Math.PI / 180
export function dist(a, b) {
    const dLat = (b[0] - a[0]) * RAD
    const dLng = (b[1] - a[1]) * RAD
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLng / 2) ** 2
    return 12742 * Math.asin(Math.sqrt(h))
}
const walkMin = (km) => ((km * DETOUR) / WALK_KMH) * 60

/* ── Min-heap untuk priority queue Dijkstra ── */
class MinHeap {
    constructor() { this.a = [] }
    get size() { return this.a.length }
    push(k, v) {
        const a = this.a
        a.push([k, v])
        let i = a.length - 1
        while (i > 0) {
            const p = (i - 1) >> 1
            if (a[p][0] <= a[i][0]) break
                ;[a[p], a[i]] = [a[i], a[p]]
            i = p
        }
    }
    pop() {
        const a = this.a
        const top = a[0]
        const last = a.pop()
        if (a.length) {
            a[0] = last
            let i = 0
            for (; ;) {
                const l = 2 * i + 1
                const r = l + 1
                let m = i
                if (l < a.length && a[l][0] < a[m][0]) m = l
                if (r < a.length && a[r][0] < a[m][0]) m = r
                if (m === i) break
                    ;[a[m], a[i]] = [a[i], a[m]]
                i = m
            }
        }
        return top
    }
}

/* ── Bangun graf dari daftar rute (dipanggil sekali per set rute) ── */
export function buildGraph(routes) {
    const nodes = []
    const adj = []

    routes.forEach((route) => {
        route.parts.forEach((part, pi) => {
            const key = `${route.id}#${pi}`
            const n = part.pts.length
            let prev = -1
            let lastCum = 0
            for (let i = 0; i < n; i++) {
                const isLast = i === n - 1
                if (prev !== -1 && !isLast && part.cum[i] - lastCum < STEP_KM) continue
                const id = nodes.length
                nodes.push({ pos: part.pts[i], route, part, key, i })
                adj.push([])
                if (prev !== -1) {
                    const km = part.cum[i] - part.cum[nodes[prev].i]
                    adj[prev].push({ to: id, type: 'ride', w: (km / SPEED[route.kind]) * 60 })
                }
                prev = id
                lastCum = part.cum[i]
            }
        })
    })

    // Grid spasial agar pencarian node tetangga cepat (sel ≈ 440 m > TRANSFER_KM)
    const CELL = 0.004
    const grid = new Map()
    const cellKey = (x, y) => `${x},${y}`
    nodes.forEach((nd, id) => {
        const k = cellKey(Math.floor(nd.pos[0] / CELL), Math.floor(nd.pos[1] / CELL))
        if (!grid.has(k)) grid.set(k, [])
        grid.get(k).push(id)
    })

    // Edge transfer: dari tiap node ke node TERDEKAT di tiap jalur lain
    nodes.forEach((nd, id) => {
        const cx = Math.floor(nd.pos[0] / CELL)
        const cy = Math.floor(nd.pos[1] / CELL)
        const best = new Map()
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const cell = grid.get(cellKey(cx + dx, cy + dy))
                if (!cell) continue
                for (const c of cell) {
                    const o = nodes[c]
                    if (o.key === nd.key) continue
                    const d = dist(nd.pos, o.pos)
                    if (d > TRANSFER_KM) continue
                    const cur = best.get(o.key)
                    if (!cur || d < cur.d) best.set(o.key, { to: c, d })
                }
            }
        }
        for (const b of best.values()) adj[id].push({ to: b.to, type: 'xfer', d: b.d })
    })

    return { nodes, adj }
}

/* ── Node terdekat per jalur dalam jarak jalan maksimum ── */
function nearestPerPart(g, P) {
    const m = new Map()
    g.nodes.forEach((nd, id) => {
        const d = dist(nd.pos, P)
        if (d > MAX_WALK_KM) return
        const c = m.get(nd.key)
        if (!c || d < c.d) m.set(nd.key, { id, d })
    })
    return [...m.values()]
}

/* ── Dijkstra ── */
function search(g, starts, ends, { walkMul, xferPen }, banned) {
    const { nodes, adj } = g
    const N = nodes.length
    const dst = new Float64Array(N).fill(Infinity)
    const prev = new Int32Array(N).fill(-1)
    const heap = new MinHeap()

    for (const s of starts) {
        if (banned.has(nodes[s.id].route.id)) continue
        const w = walkMin(s.d) * walkMul + WAIT_MIN
        if (w < dst[s.id]) { dst[s.id] = w; heap.push(w, s.id) }
    }

    let best = Infinity
    let bestNode = -1
    while (heap.size) {
        const [du, u] = heap.pop()
        if (du > dst[u]) continue
        if (du >= best) break
        const e = ends.get(u)
        if (e != null) {
            const t = du + walkMin(e) * walkMul
            if (t < best) { best = t; bestNode = u }
        }
        for (const ed of adj[u]) {
            if (banned.has(nodes[ed.to].route.id)) continue
            const w = ed.type === 'ride' ? ed.w : walkMin(ed.d) * walkMul + WAIT_MIN + xferPen
            const nd = du + w
            if (nd < dst[ed.to]) { dst[ed.to] = nd; prev[ed.to] = u; heap.push(nd, ed.to) }
        }
    }
    if (bestNode < 0) return null
    const path = []
    for (let v = bestNode; v !== -1; v = prev[v]) path.push(v)
    return path.reverse()
}

/* ── Ubah path node → objek plan (waktu & jarak NYATA, bukan bobot profil) ── */
function toPlan(g, path, A, B, t0) {
    const legs = []
    let cur = null
    for (const id of path) {
        const nd = g.nodes[id]
        if (cur && cur.key === nd.key) { cur.to = nd; continue }
        cur = { key: nd.key, route: nd.route, part: nd.part, from: nd, to: nd }
        legs.push(cur)
    }

    let t = t0
    let at = A
    let walkKm = 0
    let rideKm = 0
    const fare = { lo: 0, hi: 0 }
    for (const l of legs) {
        l.iA = l.from.i
        l.iB = l.to.i
        l.km = l.part.cum[l.iB] - l.part.cum[l.iA]
        l.rideMin = (l.km / SPEED[l.route.kind]) * 60
        const wk = dist(at, l.from.pos) * DETOUR
        l.walk = { km: wk, min: (wk / WALK_KMH) * 60, from: at, to: l.from.pos }
        t += (l.walk.min + WAIT_MIN) * 60000
        l.boardAt = t
        t += l.rideMin * 60000
        l.alightAt = t
        at = l.to.pos
        walkKm += wk
        rideKm += l.km
        fare.lo += FARE_NUM[l.route.kind][0]
        fare.hi += FARE_NUM[l.route.kind][1]
    }
    const ek = dist(at, B) * DETOUR
    const endWalk = { km: ek, min: (ek / WALK_KMH) * 60, from: at, to: B }
    t += endWalk.min * 60000
    walkKm += ek

    return {
        legs,
        endWalk,
        total: (t - t0) / 60000,
        depart: legs[0].boardAt,
        arrive: t,
        walkKm,
        rideKm,
        transfers: legs.length - 1,
        fare,
        sig: legs.map((l) => l.route.id).join('>'),
    }
}

/* ── API utama: kembalikan hingga 4 opsi rute (boleh transit) ── */
export function planTrips(g, A, B) {
    if (!g.nodes.length) return []
    const startList = nearestPerPart(g, A)
    const endList = nearestPerPart(g, B)
    if (!startList.length || !endList.length) return []
    const ends = new Map(endList.map((e) => [e.id, e.d]))
    const t0 = Date.now()
    const found = new Map()

    const run = (profile, banned = new Set()) => {
        const path = search(g, startList, ends, profile, banned)
        if (!path) return null
        const p = toPlan(g, path, A, B, t0)
        if (p.rideKm < 0.3) return null
        if (!found.has(p.sig)) found.set(p.sig, p)
        return p
    }

    const base = run(PROFILES[0])
    PROFILES.slice(1).forEach((pr) => run(pr))
    // Alternatif: larang tiap rute pada jalur tercepat, cari ulang
    if (base) base.legs.forEach((l) => run(PROFILES[0], new Set([l.route.id])))

    const all = [...found.values()].sort((x, y) => x.total - y.total)
    if (!all.length) return []
    const top = all.filter((p) => p.total <= all[0].total * 1.8).slice(0, 4)

    top[0].tag = 'Tercepat'
    const rest = top.slice(1)
    const fewT = rest.filter((p) => p.transfers < top[0].transfers).sort((x, y) => x.transfers - y.transfers || x.total - y.total)[0]
    if (fewT) fewT.tag = 'Sedikit Transit'
    const fewW = rest.filter((p) => !p.tag && p.walkKm < top[0].walkKm).sort((x, y) => x.walkKm - y.walkKm)[0]
    if (fewW) fewW.tag = 'Sedikit Jalan'
    return top
}