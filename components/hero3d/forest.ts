import * as THREE from "three"
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js"

import type { DeviceProfile } from "@/lib/renderer"
import { FOREST, SHRUB } from "./constants"
import type { WoodTextures } from "./textures"

/**
 * 森。**安土山は森に覆われた山**なので、岩肌と砂の山のままでは
 * 暗くしても採石場か砂漠にしか見えなかった。
 *
 * 一番効くのは**尾根の輪郭**。滑らかな多角形の稜線が、ぎざぎざの樹冠の線に
 * 変わった瞬間に「日本の山」になる。夜なので、木 1 本ずつの作り込みは要らない。
 * 形（杉の紡錘・広葉樹の丸い樹冠）と、下ほど暗い陰と、月が樹冠の上面を
 * 照らす陰影だけで読める。
 *
 * 縮尺に注意。1 単位 = 240mm なので、15〜20m の杉は 60〜80 単位になる。
 * 天主（約 110）の 3/4 もあるので、控えめに振ってある（FOREST）。
 *
 * 杉と広葉樹でそれぞれ 1 本の InstancedMesh。**ドローコールは 2 本**で済む。
 */

export type ForestHandle = {
  group: THREE.Group
  /** 風の揺れ。レンダーループから時間を渡す */
  update: (t: number) => void
  dispose: () => void
}

/** 決まった種で乱数を出す。見た目のばらつきを毎回同じにする */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash2(x: number, y: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + 1013904223
  h = (h ^ (h >>> 13)) >>> 0
  h = Math.imul(h, 1274126177) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** 林と空き地の斑。低い周波数の値ノイズ */
function groveNoise(x: number, z: number, s: number = FOREST.groveScale, salt = 0): number {
  const xi = Math.floor(x / s) + salt
  const zi = Math.floor(z / s) - salt
  const xf = x / s - xi
  const zf = z / s - zi
  const u = xf * xf * (3 - 2 * xf)
  const v = zf * zf * (3 - 2 * zf)
  const a = hash2(xi, zi)
  const b = hash2(xi + 1, zi)
  const c = hash2(xi, zi + 1)
  const d = hash2(xi + 1, zi + 1)
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * 森の濃さ（0 = 何も無い、1 = 閉じた林）。
 *
 * **木の配置と、地面の色（林床の暗さ・terrain.ts）の両方がこの 1 つを見る。**
 * 別々に決めると、木の無い所だけ地面が暗い、といった食い違いが起きる。
 *
 * @param slope 勾配（高さの変化 / 水平距離）
 */
export function forestCover(x: number, z: number, slope: number): number {
  const F = FOREST
  const r = Math.hypot(x, z)
  const ring = smooth(F.innerRadius, F.innerRadius + 40, r) * (1 - smooth(F.outerRadius - 60, F.outerRadius, r))
  const flat = 1 - smooth(F.maxSlope * 0.6, F.maxSlope, slope)
  const trees = ring > 0 ? ring * smooth(F.clearing - 0.07, F.clearing + 0.07, groveNoise(x, z)) * flat : 0
  // 灌木の下も暗くする（木ほどではない）
  return Math.max(trees, shrubCover(x, z, slope) * SHRUB.floorWeight)
}

/** 灌木の濃さ（0..1）。城のまわりの斜面だけ */
export function shrubCover(x: number, z: number, slope: number): number {
  const S = SHRUB
  const r = Math.hypot(x, z)
  const ring = smooth(S.innerRadius, S.innerRadius + 16, r) * (1 - smooth(S.outerRadius - 30, S.outerRadius, r))
  if (ring <= 0) return 0
  const patch = smooth(S.clearing - 0.08, S.clearing + 0.08, groveNoise(x, z, S.patchScale, 97))
  const flat = 1 - smooth(FOREST.maxSlope * 0.6, FOREST.maxSlope, slope)
  return ring * patch * flat
}

/**
 * 頂点を半径方向にわずかに揺らし、陰の濃淡を頂点色に焼く。
 * 完全な回転体のままだと、並べたときに型抜きの量産品に見える
 */
function roughen(
  source: THREE.BufferGeometry,
  amount: number,
  seed: number,
  bottom: number
): THREE.BufferGeometry {
  // 継ぎ目で分かれた頂点を 1 つにまとめる。まとめないと法線が面ごとに割れて、
  // 角張った多面体（ローポリの作り物）に見える
  source.deleteAttribute("normal")
  source.deleteAttribute("uv")
  const geo = mergeVertices(source)
  source.dispose()

  const rnd = mulberry32(seed)
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  let minY = Infinity
  let maxY = -Infinity
  for (let i = 0; i < pos.count; i++) {
    minY = Math.min(minY, pos.getY(i))
    maxY = Math.max(maxY, pos.getY(i))
  }
  for (let i = 0; i < pos.count; i++) {
    const o = 1 + (rnd() - 0.5) * 2 * amount
    pos.setXYZ(i, pos.getX(i) * o, pos.getY(i), pos.getZ(i) * o)
    // 下ほど暗い。樹冠の内側と根元は、上からの光も空の光も届かない
    const t = (pos.getY(i) - minY) / Math.max(maxY - minY, 1e-6)
    const c = bottom + (1 - bottom) * Math.pow(t, 0.7)
    colors[i * 3] = c
    colors[i * 3 + 1] = c
    colors[i * 3 + 2] = c
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

// ---------------------------------------------------------------------------
// 1 本ぶんの形。**幹・芯・枝葉の 3 つをマテリアルの番号で分けて 1 つにまとめる**
// （InstancedMesh にマテリアルの配列を渡し、描き分ける）
// ---------------------------------------------------------------------------

type Part = { pos: number[]; nor: number[]; uv: number[]; col: number[]; sway: number[]; idx: number[] }
const newPart = (): Part => ({ pos: [], nor: [], uv: [], col: [], sway: [], idx: [] })
type V3 = [number, number, number]
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

/** three のジオメトリを部品に足す。uvScale で樹皮を幹に巻く回数を決める */
function appendGeometry(p: Part, g: THREE.BufferGeometry, dark: number, uvScale: [number, number] = [1, 1]) {
  const base = p.pos.length / 3
  const pos = g.attributes.position
  const nor = g.attributes.normal
  const uv = g.attributes.uv
  const col = g.attributes.color
  for (let i = 0; i < pos.count; i++) {
    p.pos.push(pos.getX(i), pos.getY(i), pos.getZ(i))
    p.nor.push(nor.getX(i), nor.getY(i), nor.getZ(i))
    p.uv.push(uv ? uv.getX(i) * uvScale[0] : 0, uv ? uv.getY(i) * uvScale[1] : 0)
    const c = (col ? col.getX(i) : 1) * dark
    p.col.push(c, c, c)
    p.sway.push(0)
  }
  if (g.index) for (let i = 0; i < g.index.count; i++) p.idx.push(base + g.index.getX(i))
  else for (let i = 0; i < pos.count; i++) p.idx.push(base + i)
  g.dispose()
}

/**
 * 枝葉の板を 1 枚足す。base（付け根）から d の向きへ長さ L、幅 W。
 * 法線は付け根と先で別々に渡す（樹冠を 1 つの塊として陰影をつけるため）
 */
function addCard(
  p: Part,
  base: V3, d: V3, w: V3, L: number, W: number,
  rect: [number, number, number, number],
  nBase: V3, nTip: V3,
  cBase: number, cTip: number,
  sBase: number, sTip: number
) {
  const i0 = p.pos.length / 3
  const [u0, v0, u1, v1] = rect
  const put = (o: V3, n: V3, u: number, v: number, c: number, s: number) => {
    p.pos.push(o[0], o[1], o[2])
    p.nor.push(n[0], n[1], n[2])
    p.uv.push(u, v)
    p.col.push(c, c, c)
    p.sway.push(s)
  }
  const hw = W / 2
  const tip: V3 = [base[0] + d[0] * L, base[1] + d[1] * L, base[2] + d[2] * L]
  put([base[0] - w[0] * hw, base[1] - w[1] * hw, base[2] - w[2] * hw], nBase, u0, v0, cBase, sBase)
  put([tip[0] - w[0] * hw, tip[1] - w[1] * hw, tip[2] - w[2] * hw], nTip, u1, v0, cTip, sTip)
  put([tip[0] + w[0] * hw, tip[1] + w[1] * hw, tip[2] + w[2] * hw], nTip, u1, v1, cTip, sTip)
  put([base[0] + w[0] * hw, base[1] + w[1] * hw, base[2] + w[2] * hw], nBase, u0, v1, cBase, sBase)
  p.idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3)
}

/** 3 つの部品を 1 つのジオメトリにまとめる。番号 0 = 幹、1 = 芯、2 = 枝葉 */
function assemble(parts: [Part, Part, Part]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [], sway: number[] = []
  const idx: number[] = []
  parts.forEach((p, m) => {
    const base = pos.length / 3
    const start = idx.length
    pos.push(...p.pos); nor.push(...p.nor); uv.push(...p.uv); col.push(...p.col); sway.push(...p.sway)
    for (const i of p.idx) idx.push(base + i)
    geo.addGroup(start, idx.length - start, m)
  })
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2))
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3))
  geo.setAttribute("aSway", new THREE.Float32BufferAttribute(sway, 1))
  geo.setIndex(idx)
  return geo
}

/** 杉の樹冠の半径（高さの比）。以前の円錐と同じ紡錘形 */
const CEDAR_PROFILE: Array<[number, number]> = [
  [0.1, 0.13], [0.3, 0.19], [0.48, 0.18], [0.66, 0.14], [0.84, 0.08], [1.0, 0.0],
]
function cedarRadius(y: number): number {
  for (let i = 0; i < CEDAR_PROFILE.length - 1; i++) {
    const [y0, r0] = CEDAR_PROFILE[i]
    const [y1, r1] = CEDAR_PROFILE[i + 1]
    if (y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0)
  }
  return 0
}

/**
 * 杉。高さ 1 に正規化。
 *   幹   … 樹皮の円柱（下 1/2 ほどが樹冠の下から見える）
 *   芯   … 暗い紡錘形。枝葉の板の隙間から空が抜けすぎないように、樹冠の密度を支える
 *   枝葉 … 枝 1 本ぶんの板を段状に。幹から外へ伸び、先がわずかに垂れる
 */
function cedarGeometry(lod: 0 | 1 = 0): THREE.BufferGeometry {
  const rnd = mulberry32(11)
  // 遠景用（lod 1）は板を減らし、そのぶん 1 枚を大きくして樹冠の密度を保つ
  const PER_TIER = lod === 0 ? 5 : 3
  const STEP = lod === 0 ? 0.05 : 0.075
  const SCALE = lod === 0 ? 1 : 1.3
  const trunk = newPart()
  const core = newPart()
  const leaf = newPart()

  const tg = new THREE.CylinderGeometry(0.011, 0.019, 0.55, 6, 1, true)
  tg.translate(0, 0.275, 0)
  appendGeometry(trunk, tg, 1, [2, 10])

  // 芯は細く。大きいと枝葉の板がほとんど隠れ、暗く滑らかな紡錘形に見えた。
  // 奥の暗がりとして、板の隙間から空が抜けすぎない程度にだけ効かせる
  const profile = [
    [0.0, 0.14], [0.055, 0.18], [0.08, 0.33], [0.075, 0.5], [0.055, 0.68], [0.03, 0.84], [0.0, 0.94],
  ].map(([r, y]) => new THREE.Vector2(r, y))
  appendGeometry(core, roughen(new THREE.LatheGeometry(profile, lod === 0 ? 6 : 5), 0.18, 11, 0.35), 0.7)

  const up: V3 = [0, 1, 0]
  let tier = 0
  for (let y = 0.13; y <= 0.95; y += STEP, tier++) {
    // 梢の近くは半径が 0 に向かうので、板が消えないよう下限を置く
    const R = Math.max(cedarRadius(y), 0.035)
    for (let k = 0; k < PER_TIER; k++) {
      const th = tier * 1.1 + (k * Math.PI * 2) / PER_TIER + (rnd() - 0.5) * 0.7
      // 下の枝ほど垂れる。梢の枝は上を向かせて、尖った先端を作る
      const droop = y > 0.84 ? -0.5 - rnd() * 0.3 : 0.12 + (1 - y) * 0.3 + rnd() * 0.12
      const h: V3 = [Math.cos(th), 0, Math.sin(th)]
      const d = norm([h[0] * Math.cos(droop), -Math.sin(droop), h[2] * Math.cos(droop)])
      // 板の幅の向き。枝の軸まわりに傾けて、横から見ても板の縁が揃わないようにする
      const side: V3 = [-Math.sin(th), 0, Math.cos(th)]
      const roll = (rnd() - 0.5) * 1.8
      const dx: V3 = [
        d[1] * side[2] - d[2] * side[1],
        d[2] * side[0] - d[0] * side[2],
        d[0] * side[1] - d[1] * side[0],
      ]
      const w = norm([
        side[0] * Math.cos(roll) + dx[0] * Math.sin(roll),
        side[1] * Math.cos(roll) + dx[1] * Math.sin(roll),
        side[2] * Math.cos(roll) + dx[2] * Math.sin(roll),
      ])
      const L = R * (1.3 + rnd() * 0.3) * SCALE
      const row = rnd() < 0.5 ? 0 : 0.5
      const lift = 0.75 + 0.25 * y
      addCard(
        leaf,
        [h[0] * 0.012, y, h[2] * 0.012], d, w, L, L * 0.5,
        [0, row, 1, row + 0.5],
        norm([h[0] * 0.4 + up[0] * 0.6, up[1] * 0.6, h[2] * 0.4]),
        norm([h[0], 0.45, h[2]]),
        0.45 * lift, 1.0 * lift,
        0.1 * y, y
      )
    }
  }
  // 梢の十字の板はやめた。上向きの法線で空の光を強く受け、木の先端が水色の「×」印に光った
  return assemble([trunk, core, leaf])
}

/**
 * 広葉樹・灌木。高さ 1 に正規化。樹冠は丸い塊を 3 つ寄せた形で、
 * その表面に葉の塊の板を外向きに並べる。
 * @param withTrunk 灌木は幹を見せない
 */
function broadleafGeometry(withTrunk: boolean, seed: number): THREE.BufferGeometry {
  const rnd = mulberry32(seed)
  const trunk = newPart()
  const core = newPart()
  const leaf = newPart()

  if (withTrunk) {
    const tg = new THREE.CylinderGeometry(0.02, 0.034, 0.5, 6, 1, true)
    tg.translate(0, 0.25, 0)
    appendGeometry(trunk, tg, 1, [2, 5])
  }

  const blobs: Array<[number, number, number, number]> = [
    // x, y, z, 半径
    [0, 0.58, 0, 0.34],
    [0.2, 0.46, 0.08, 0.25],
    [-0.16, 0.48, -0.12, 0.26],
  ]
  // 芯。暗く、ひとまわり小さく
  {
    const parts: THREE.BufferGeometry[] = []
    for (const [x, y, z, r] of blobs) {
      const g = new THREE.IcosahedronGeometry(r * 0.82, 0)
      g.scale(1, 0.8, 1)
      g.translate(x, y, z)
      parts.push(g.index ? g.toNonIndexed() : g)
    }
    let count = 0
    for (const g of parts) count += g.attributes.position.count
    const arr = new Float32Array(count * 3)
    let off = 0
    for (const g of parts) {
      arr.set(g.attributes.position.array as Float32Array, off)
      off += g.attributes.position.count * 3
      g.dispose()
    }
    const merged = new THREE.BufferGeometry()
    merged.setAttribute("position", new THREE.BufferAttribute(arr, 3))
    appendGeometry(core, roughen(merged, 0.22, seed, 0.35), 0.75)
  }

  // 葉の塊の板。上向きの面ほど多く、明るく
  for (const [cx, cy, cz, r] of blobs) {
    const n = Math.round(7 * (r / 0.3))
    for (let i = 0; i < n; i++) {
      const th = rnd() * Math.PI * 2
      const yy = -0.35 + rnd() * 1.35
      const rr = Math.sqrt(Math.max(0, 1 - Math.min(1, yy * yy)))
      const dir = norm([Math.cos(th) * rr, yy, Math.sin(th) * rr])
      const c: V3 = [cx + dir[0] * r * 0.78, cy + dir[1] * r * 0.62, cz + dir[2] * r * 0.78]
      // 板の面を dir に向ける。面内の回転はばらばらに
      const ref: V3 = Math.abs(dir[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]
      const a1 = norm([
        dir[1] * ref[2] - dir[2] * ref[1],
        dir[2] * ref[0] - dir[0] * ref[2],
        dir[0] * ref[1] - dir[1] * ref[0],
      ])
      const a2: V3 = [
        dir[1] * a1[2] - dir[2] * a1[1],
        dir[2] * a1[0] - dir[0] * a1[2],
        dir[0] * a1[1] - dir[1] * a1[0],
      ]
      const rot = rnd() * Math.PI * 2
      const e1 = norm([
        a1[0] * Math.cos(rot) + a2[0] * Math.sin(rot),
        a1[1] * Math.cos(rot) + a2[1] * Math.sin(rot),
        a1[2] * Math.cos(rot) + a2[2] * Math.sin(rot),
      ])
      const e2: V3 = [
        dir[1] * e1[2] - dir[2] * e1[1],
        dir[2] * e1[0] - dir[0] * e1[2],
        dir[0] * e1[1] - dir[1] * e1[0],
      ]
      const S = r * (0.95 + rnd() * 0.3)
      const q = Math.floor(rnd() * 4)
      const u0 = (q % 2) * 0.5
      const v0 = Math.floor(q / 2) * 0.5
      // 上向きに寄せすぎると、上面が空の光を強く受けて白っぽくなり、苔の生えた岩に見えた
      const nrm = norm([dir[0], dir[1] + 0.12, dir[2]])
      const shadeV = 0.55 + 0.45 * (dir[1] * 0.5 + 0.5)
      // 板は中心から e1 方向へ伸ばすのではなく、中心を挟んで両側に広げる
      const base: V3 = [c[0] - e1[0] * S / 2, c[1] - e1[1] * S / 2, c[2] - e1[2] * S / 2]
      addCard(leaf, base, e1, e2, S, S, [u0, v0, u0 + 0.5, v0 + 0.5], nrm, nrm, shadeV, shadeV, c[1], c[1])
    }
  }
  return assemble([trunk, core, leaf])
}

export function createForest(
  heightAt: (x: number, z: number) => number,
  /**
   * 描かれている地形の面の高さ。**根元はこちらで決める。**
   * 地形の式（heightAt）は鋭い尾根でメッシュより高くなり、木が宙に浮く
   */
  surfaceAt: (x: number, z: number) => number,
  tex: WoodTextures["trees"],
  profile: DeviceProfile
): ForestHandle {
  const F = FOREST
  const group = new THREE.Group()
  const rnd = mulberry32(F.seed)

  // --- 置き場所を決める（ずらした格子）---
  type Tree = { x: number; y: number; z: number; h: number; w: number; rot: number; tone: number }
  const cedars: Tree[] = []
  const broads: Tree[] = []
  const shrubs: Tree[] = []
  const spacing = profile.isMobile ? F.spacingMobile : F.spacing
  const n = Math.ceil(F.outerRadius / spacing)
  const eps = 2

  for (let gz = -n; gz <= n; gz++) {
    for (let gx = -n; gx <= n; gx++) {
      const x = (gx + (rnd() - 0.5) * 0.9) * spacing
      const z = (gz + (rnd() - 0.5) * 0.9) * spacing
      const r = Math.hypot(x, z)
      if (r < F.innerRadius || r > F.outerRadius) continue

      // 林と空き地・急な岩場。地面の暗さ（林床）と同じ関数で決める
      const hx = (heightAt(x + eps, z) - heightAt(x - eps, z)) / (2 * eps)
      const hz = (heightAt(x, z + eps) - heightAt(x, z - eps)) / (2 * eps)
      if (rnd() >= forestCover(x, z, Math.sqrt(hx * hx + hz * hz))) continue

      const isCedar = rnd() < F.cedarRatio
      const k = rnd()
      const t: Tree = {
        x,
        z,
        // 根元を少し埋める。斜面で下側が浮かないように
        y: surfaceAt(x, z) - 2.5,
        h: isCedar
          ? F.cedarHeight[0] + (F.cedarHeight[1] - F.cedarHeight[0]) * k
          : F.broadHeight[0] + (F.broadHeight[1] - F.broadHeight[0]) * k,
        // 杉は細すぎると瓶洗いブラシに見えるので、横幅を少し持たせる
        w: isCedar ? 1.05 + rnd() * 0.35 : 0.85 + rnd() * 0.35,
        rot: rnd() * Math.PI * 2,
        tone: 0.8 + rnd() * 0.4,
      }
      ;(isCedar ? cedars : broads).push(t)
    }
  }

  // --- 灌木（城のまわりの斜面）---
  {
    const S = SHRUB
    const sp = profile.isMobile ? S.spacingMobile : S.spacing
    const m = Math.ceil(S.outerRadius / sp)
    for (let gz = -m; gz <= m; gz++) {
      for (let gx = -m; gx <= m; gx++) {
        const x = (gx + (rnd() - 0.5) * 0.95) * sp
        const z = (gz + (rnd() - 0.5) * 0.95) * sp
        const r = Math.hypot(x, z)
        if (r < S.innerRadius || r > S.outerRadius) continue
        const hx = (heightAt(x + eps, z) - heightAt(x - eps, z)) / (2 * eps)
        const hz = (heightAt(x, z + eps) - heightAt(x, z - eps)) / (2 * eps)
        if (rnd() >= shrubCover(x, z, Math.sqrt(hx * hx + hz * hz))) continue
        shrubs.push({
          x,
          z,
          y: surfaceAt(x, z) - 0.8,
          h: S.height[0] + (S.height[1] - S.height[0]) * rnd(),
          w: S.spread[0] + (S.spread[1] - S.spread[0]) * rnd(),
          rot: rnd() * Math.PI * 2,
          tone: 0.75 + rnd() * 0.5,
        })
      }
    }
  }

  // --- マテリアル ---
  //
  // 幹・芯・枝葉の 3 つ。どれにも同じ手当てをする。
  //   近すぎる木は縮めて消す … スマホは縦長のぶんカメラが大きく引き、森の中まで下がることがある
  //   照り返さない         … 斜めから見たときのフレネルで、樹冠が雪のように白く光った
  // 枝葉にはさらに、風の揺れと、裏面で法線を裏返さない手当て（後述）をする
  const uTime = { value: 0 }
  const uNear = { value: new THREE.Vector2(...F.nearFade) }
  const noFlip = THREE.ShaderChunk.normal_fragment_begin.replace("normal *= faceDirection;", "")

  const patch = (m: THREE.MeshStandardMaterial, foliage: boolean) => {
    if (foliage) m.defines = { TREE_FOLIAGE: "" }
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uNear = uNear
      shader.uniforms.uTime = uTime
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nattribute float aSway;\nuniform vec2 uNear;\nuniform float uTime;"
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           {
             vec3 origin = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
             transformed *= smoothstep(uNear.x, uNear.y, distance(origin, cameraPosition));
             #ifdef TREE_FOLIAGE
               // 風。枝先ほど大きく、木ごとに位相をずらす（そろって揺れると作り物に見える）
               float ph = origin.x * 0.13 + origin.z * 0.17;
               transformed.x += sin(uTime * ${F.windSpeed.toFixed(2)} + ph) * ${F.windAmount.toFixed(3)} * aSway;
               transformed.z += cos(uTime * ${(F.windSpeed * 0.8).toFixed(2)} + ph * 1.3) * ${(F.windAmount * 0.7).toFixed(3)} * aSway;
             #endif
           }`
        )
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <lights_physical_fragment>",
        `#include <lights_physical_fragment>
         material.specularColor *= 0.15;
         material.specularColorBlended *= 0.15;
         material.specularF90 = 0.15;`
      )
      if (foliage) {
        // 板は両面を描くが、**裏面で法線を裏返さない**。法線は「樹冠の中心から外向き」に
        // そろえてあるので、裏返すと裏を向いた板だけが暗く抜けて斑になる
        shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_begin>", noFlip)
      }
    }
    return m
  }

  const trunkMat = patch(
    new THREE.MeshStandardMaterial({
      map: tex.bark,
      color: F.trunkColor,
      vertexColors: true,
      roughness: 0.95,
      metalness: 0,
      envMapIntensity: 0.3,
    }),
    false
  )
  const coreMat = (color: number) =>
    patch(
      new THREE.MeshStandardMaterial({
        color,
        vertexColors: true,
        roughness: 0.95,
        metalness: 0,
        envMapIntensity: 0.3,
      }),
      false
    )
  const foliageMat = (map: THREE.Texture, color: number) =>
    patch(
      new THREE.MeshStandardMaterial({
        map,
        color,
        vertexColors: true,
        roughness: 0.9,
        metalness: 0,
        envMapIntensity: 0.3,
        side: THREE.DoubleSide,
        // 透過は切り抜き。MSAA があるときは縁を滑らかにする（スマホは合成を通さないので無し）
        alphaTest: 0.42,
        alphaToCoverage: !profile.isMobile,
      }),
      true
    )

  const cedarCore = coreMat(F.cedarColor)
  const broadCore = coreMat(F.broadColor)
  const cedarLeaf = foliageMat(tex.cedar, F.cedarTint)
  const broadLeaf = foliageMat(tex.broad, F.broadTint)
  const shrubCore = coreMat(SHRUB.color)
  const shrubLeaf = foliageMat(tex.broad, SHRUB.tint)

  const disposables: Array<{ dispose: () => void }> = [
    trunkMat, cedarCore, broadCore, cedarLeaf, broadLeaf, shrubCore, shrubLeaf,
  ]

  const build = (trees: Tree[], geo: THREE.BufferGeometry, mats: THREE.Material[], culled = false) => {
    if (trees.length === 0) return
    const mesh = new THREE.InstancedMesh(geo, mats, trees.length)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3()
    const p = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    const c = new THREE.Color()
    trees.forEach((t, i) => {
      q.setFromAxisAngle(up, t.rot)
      s.set(t.h * t.w, t.h, t.h * t.w)
      p.set(t.x, t.y, t.z)
      m.compose(p, q, s)
      mesh.setMatrixAt(i, m)
      // 木ごとの明るさのむら。色はマテリアル側で持つ（幹まで緑にならないように）
      c.setRGB(t.tone, t.tone, t.tone)
      mesh.setColorAt(i, c)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    // 影は落とさない・受けない。影の範囲（天主のまわり ±95）に木は無い
    mesh.castShadow = false
    mesh.receiveShadow = false
    // 近景の輪は境界球がカメラを含むので、視錐台判定は意味が無い。
    // 遠景は扇形に分けてあるので、背後の扇はまるごと描かずに済む
    mesh.frustumCulled = culled
    if (culled) mesh.computeBoundingSphere()
    group.add(mesh)
  }

  /**
   * 遠くの木は軽い形に替え、扇形に分けて視錐台で間引く。
   * 遠景の輪（lodRadius〜outerRadius）が木の本数の大半を占める
   */
  const buildRing = (trees: Tree[], near: THREE.BufferGeometry, far: THREE.BufferGeometry, mats: THREE.Material[]) => {
    disposables.push(near, far)
    const sectors: Tree[][] = Array.from({ length: F.sectors }, () => [])
    const inner: Tree[] = []
    for (const t of trees) {
      if (Math.hypot(t.x, t.z) < F.lodRadius) {
        inner.push(t)
        continue
      }
      const a = (Math.atan2(t.z, t.x) / (Math.PI * 2) + 1) % 1
      sectors[Math.min(F.sectors - 1, Math.floor(a * F.sectors))].push(t)
    }
    build(inner, near, mats)
    for (const sec of sectors) build(sec, far, mats, true)
  }

  buildRing(cedars, cedarGeometry(0), cedarGeometry(1), [trunkMat, cedarCore, cedarLeaf])
  const broadGeo = broadleafGeometry(true, 23)
  buildRing(broads, broadGeo, broadGeo, [trunkMat, broadCore, broadLeaf])
  const shrubGeo = broadleafGeometry(false, 41)
  disposables.push(shrubGeo)
  build(shrubs, shrubGeo, [trunkMat, shrubCore, shrubLeaf])

  return {
    group,
    update(t: number) {
      uTime.value = t
    },
    dispose() {
      for (const d of disposables) d.dispose()
      for (const o of group.children) (o as THREE.InstancedMesh).dispose()
      group.clear()
    },
  }
}
