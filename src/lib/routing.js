/* ────────────────────────────────────────────────────────────
   Routing multi-rute (transit antar trayek) dengan Dijkstra
   Taruh di: src/pages/routing.js  (atau src/lib/routing.js)

   Model graf:
   - Node  = titik di sepanjang jalur (di-downsample tiap STEP_KM).
   - Edge "ride"  = node → node berikutnya di jalur yang sama.
                    Angkot yang hanya digambar 1 garis dianggap BOLAK-BALIK
                    (edge ride juga dibuat ke arah sebaliknya).
   - Edge "xfer"  = node → node terdekat di jalur LAIN (jalan kaki + tunggu).
   - Asal / tujuan = sumber & target virtual (jalan kaki ke/dari jalur).
   ──────────────────────────────────────────────────────────── */

import { ONEWAY_ZONES } from '../data/oneway-zones'

export const SPEED = { biskita: 18, angkot: 15 } // km/jam
export const WAIT_MIN = 5
export const MAX_WALK_KM = 0.8
export const DETOUR = 1.25 // faktor jalan kaki tidak lurus
const WALK_KMH = 4.8
const TRANSFER_KM = 0.35 // jarak maks pindah jalur
const STEP_KM = 0.2 // jarak antar node
const OPPOSITE_KM = 0.5 // toleransi ujung jalur dianggap "arah sebaliknya"
const OVERLAP_KM = 0.1 // jarak maks dua garis dianggap menimpa jalan yang sama
const LOOP_TURN_DEG = 270 // total belokan searah yang dianggap "berputar" (loop)
const LOOP_MIN_KM = 1 // panjang minimum loop
const LOOP_TRIM_DEG = 10 // belokan lebih kecil dari ini di ujung loop dianggap lurus
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

/* Apakah bagian jalur `o` adalah arah SEBALIKNYA dari `p`?
   (1) ujung awal o ≈ ujung akhir p dan sebaliknya, atau
   (2) o menimpa p (jalan yang sama) tetapi urutan titiknya terbalik. */
function isOpposite(p, o) {
    const pa = p.pts[0]
    const pb = p.pts[p.pts.length - 1]
    if (dist(o.pts[0], pb) < OPPOSITE_KM && dist(o.pts[o.pts.length - 1], pa) < OPPOSITE_KM) return true

    // (2) cuplik ±20 titik p, cari titik terdekat di o
    const SAMPLES = 20
    const step = Math.max(1, Math.floor(p.pts.length / SAMPLES))
    const hits = []
    let total = 0
    for (let k = 0; k < p.pts.length; k += step) {
        total++
        let bi = -1
        let bd = Infinity
        for (let j = 0; j < o.pts.length; j++) {
            const d = dist(p.pts[k], o.pts[j])
            if (d < bd) { bd = d; bi = j }
        }
        if (bd < OVERLAP_KM) hits.push(bi)
    }
    if (hits.length < total * 0.6 || hits.length < 2) return false
    return hits[0] > hits[hits.length - 1] // searah p → o berjalan mundur
}

const JOIN_KM = 0.03 // ujung-awal dua bagian dianggap tersambung bila < 30 m

/* Sambung bagian jalur yang ujung-awalnya bertemu (bukan arah sebaliknya),
   agar satu rute yang digambar terpotong jadi satu rangkaian utuh. */
function joinParts(parts) {
    const rest = parts.slice()
    const out = []
    const merge = (a, b) => {
        const pts = a.pts.concat(b.pts.slice(1))
        const cum = [0]
        for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]))
        return { pts, cum, dir: a.dir || b.dir }
    }
    while (rest.length) {
        let cur = rest.shift()
        for (; ;) {
            const tail = cur.pts[cur.pts.length - 1]
            const head = cur.pts[0]
            let i = rest.findIndex((o) => dist(tail, o.pts[0]) < JOIN_KM && !isOpposite(cur, o))
            if (i >= 0) { cur = merge(cur, rest.splice(i, 1)[0]); continue }
            i = rest.findIndex((o) => dist(o.pts[o.pts.length - 1], head) < JOIN_KM && !isOpposite(o, cur))
            if (i >= 0) { cur = merge(rest.splice(i, 1)[0], cur); continue }
            break
        }
        out.push(cur)
    }
    return out
}

/* Titik di dalam zona satu arah manual? */
function inOneWayZone(pos, ref) {
    return ONEWAY_ZONES.some(
        (z) =>
            !z.center &&
            (!z.refs || z.refs.includes(ref)) &&
            pos[0] >= z.bounds[0] && pos[1] >= z.bounds[1] &&
            pos[0] <= z.bounds[2] && pos[1] <= z.bounds[3],
    )
}

function wrongWay(a, b, ref) {
    return ONEWAY_ZONES.some((z) => {
        if (!z.center || (z.refs && !z.refs.includes(ref))) return false
        const [s, w, n, e] = z.bounds
        const inside = (p) => p[0] >= s && p[0] <= n && p[1] >= w && p[1] <= e
        if (!inside(a) || !inside(b)) return false
        const k = Math.cos(z.center[0] * RAD)
        const x = (a[1] - z.center[1]) * k
        const y = a[0] - z.center[0]
        const dx = (b[1] - a[1]) * k
        const dy = b[0] - a[0]
        const norm = Math.hypot(x, y) * Math.hypot(dx, dy)
        if (!norm) return false
        const sin = (x * dy - y * dx) / norm // >0 = berlawanan jarum jam
        return z.clockwise ? sin > 0.3 : sin < -0.3
    })
}

/* Deteksi bagian garis yang MEMUTAR (loop, mis. SSA Kebun Raya).
   Garis dianggap berputar bila total belokan searah dalam satu rentang
   ≥ LOOP_TURN_DEG derajat pada rentang ≥ LOOP_MIN_KM. Mengembalikan flag per node. */
function loopFlags(pos, cums) {
    const n = pos.length
    const flags = new Array(n).fill(false)
    if (n < 6) return flags
    const bearing = (a, b) => Math.atan2((b[1] - a[1]) * Math.cos(a[0] * RAD), b[0] - a[0]) / RAD
    const brg = []
    for (let i = 0; i < n - 1; i++) brg.push(bearing(pos[i], pos[i + 1]))
    // turn[i] = perubahan arah di node i (1..n-2), -180..180
    const turn = new Array(n).fill(0)
    for (let i = 1; i < n - 1; i++) {
        let d = brg[i] - brg[i - 1]
        while (d > 180) d -= 360
        while (d <= -180) d += 360
        turn[i] = d
    }
    for (let a = 0; a < n - 2; a++) {
        let acc = 0
        for (let b = a + 2; b < n; b++) {
            acc += turn[b - 1]
            if (Math.abs(acc) < LOOP_TURN_DEG || cums[b] - cums[a] < LOOP_MIN_KM) continue
            // pangkas bagian lurus di kedua ujung rentang
            let s = a
            let e = b
            while (s < e && Math.abs(turn[s + 1]) < LOOP_TRIM_DEG) s++
            while (e > s && Math.abs(turn[e - 1]) < LOOP_TRIM_DEG) e--
            for (let k = s; k <= e; k++) flags[k] = true
            break
        }
    }
    return flags
}

/* Kelompokkan bagian jalur per nomor rute (ref) + moda. Arah pergi & pulang
   sering tersimpan sebagai rute terpisah dengan ref yang sama. */
function groupPartsByRef(routes) {
    const m = new Map()
    routes.forEach((route) => {
        const k = `${route.kind}|${route.ref}`
        if (!m.has(k)) m.set(k, [])
        route.parts.forEach((part) => m.get(k).push(part))
    })
    return m
}

/* ── Bangun graf dari daftar rute (dipanggil sekali per set rute) ── */
export function buildGraph(routes) {
    const nodes = []
    const adj = []
    const rs = routes.map((r) => ({ ...r, parts: joinParts(r.parts) }))
    const byRef = groupPartsByRef(rs)

    const loops = [] // bagian jalur satu arah yang terdeteksi (untuk diagnosa)

    rs.forEach((route) => {
        route.parts.forEach((part, pi) => {
            const key = `${route.id}#${pi}`
            // Angkot 1 garis = bolak-balik. Kalau arah sebaliknya sudah digambar
            // (di rute ini ATAU rute lain dengan nomor yang sama), jalur ini tetap
            // searah — tidak boleh dinaiki mundur.
            const bidir =
                route.kind === 'angkot' &&
                !byRef.get(`${route.kind}|${route.ref}`).some((o) => o !== part && isOpposite(part, o))
            const n = part.pts.length
            const ids = [] // node milik bagian jalur ini, berurutan
            const ws = [] // ws[k] = bobot menit ids[k-1] → ids[k]
            let prev = -1
            let lastCum = 0
            for (let i = 0; i < n; i++) {
                const isLast = i === n - 1
                if (prev !== -1 && !isLast && part.cum[i] - lastCum < STEP_KM) continue
                const id = nodes.length
                nodes.push({ pos: part.pts[i], route, part, key, i })
                adj.push([])
                let w = 0
                if (prev !== -1) {
                    const km = part.cum[i] - part.cum[nodes[prev].i]
                    w = (km / SPEED[route.kind]) * 60
                    adj[prev].push({ to: id, type: 'ride', w })
                }
                ids.push(id)
                ws.push(w)
                prev = id
                lastCum = part.cum[i]
            }

            if (!bidir || ids.length < 2) return

            // Jalur balik hanya di bagian yang BUKAN loop / zona satu arah
            const cums = ids.map((id) => part.cum[nodes[id].i])
            const oneWay = loopFlags(ids.map((id) => nodes[id].pos), cums)
            ids.forEach((id, k) => { if (!oneWay[k] && inOneWayZone(nodes[id].pos, route.ref)) oneWay[k] = true })

            for (let k = 1; k < ids.length; k++) {
                if (oneWay[k - 1] && oneWay[k]) continue
                adj[ids[k]].push({ to: ids[k - 1], type: 'ride', w: ws[k] })
            }

            // catat bagian satu arah (rentang berurutan) untuk diagnosa
            for (let k = 0; k < ids.length; k++) {
                if (!oneWay[k]) continue
                let e = k
                while (e + 1 < ids.length && oneWay[e + 1]) e++
                loops.push({ ref: route.ref, route: route.id, fromKm: cums[k], toKm: cums[e], fromId: ids[k], toId: ids[e] })
                k = e
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

    // Buang edge naik yang salah arah di zona dengan arah putar wajib
    adj.forEach((edges, u) => {
        adj[u] = edges.filter(
            (e) => e.type !== 'ride' || !wrongWay(nodes[u].pos, nodes[e.to].pos, nodes[u].route.ref),
        )
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
                    // Jangan pindah antar arah pada nomor rute yang sama (A→B lalu
                    // "pindah" ke arah sebaliknya = bolak-balik tanpa guna).
                    if (o.route.ref === nd.route.ref && o.route.kind === nd.route.kind) continue
                    const d = dist(nd.pos, o.pos)
                    if (d > TRANSFER_KM) continue
                    const cur = best.get(o.key)
                    if (!cur || d < cur.d) best.set(o.key, { to: c, d })
                }
            }
        }
        for (const b of best.values()) adj[id].push({ to: b.to, type: 'xfer', d: b.d })
    })

    return { nodes, adj, loops }
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
        // Angkot bisa dinaiki ke arah sebaliknya dari urutan titik di GeoJSON
        l.reversed = l.iB < l.iA
        l.km = Math.abs(l.part.cum[l.iB] - l.part.cum[l.iA])
        // titik jalur yang dilewati, selalu berurutan dari naik → turun
        l.ridePts = l.reversed
            ? l.part.pts.slice(l.iB, l.iA + 1).reverse()
            : l.part.pts.slice(l.iA, l.iB + 1)
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