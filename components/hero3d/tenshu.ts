import * as THREE from "three"

import type { DeviceProfile } from "@/lib/renderer"
import {
  AZUCHI, BUILD_END, CLAD, CLAD_MATERIAL, DROP_RATIO, ENV_INTENSITY, GLOW, IGNITE, JOINT,
  STONE, TILE, TIMING, WOOD, u,
} from "./constants"
import { clamp01, easeHammer, easeInOut, easeOutQuart } from "./ease"
import { createInstancedBank, type InstanceSpec, type InstancedBank } from "./instanced"
import { buildMember, faceMaterials, lumberGeometry, type BoxMm, type Grain } from "./lumber"
import {
  boxUv, faceNormal, mergeGeometries, parametricSurface, planarPolygon, slopeAxes,
} from "./surfaces"
import type { WoodTextures } from "./textures"

/**
 * 安土城天主の軸組。**設計図をそのままデータにしたもの**。
 *
 * 寸法は全部 constants.ts の AZUCHI（実寸 mm）から算出している。
 * ここに直接書いた寸法は一つも無いので、数字を直せば形が変わる。
 *
 * 建て方の順序は資料どおり。
 *   石垣 → 礎石 → **心柱架構（一気に）** → 母屋 → 各重 → 大屋根 → 六重(八角) → 七重(四角)
 *
 * 山頂の狭い敷地では柱を順に建てる「屏風建て」ができない。
 * そこで 4 間 x 6 間・22 本・高さ 8 間の心柱架構を一気に建て、
 * そこへ 8 間 x 11 間の母屋を寄りかからせた——その架構の工夫が
 * 前代未聞の「4 層の吹き抜け」を生んだ、というのが資料の論。
 * **その順序がそのままこのスクロールの筋書きになっている。**
 *
 * 唯一の例外が冒頭の金輪継ぎで、これだけ先に組み上がって宙で待つ。
 */

const A = AZUCHI
const K = A.grid

/**
 * 仕口の食い込み（mm）。
 * 面がぴったり同一平面に来ると z ファイティングを起こして、
 * 角度と距離によって接合部がちらつく。実際の仕口もほぞで噛み合っているので、
 * わずかに食い込ませるのが形としても正しい。
 */
const EMBED = 25

// --- 母屋（8 間 x 11 間）。南北が非対称なのは北へ 1 間足した設計変更のため ---
const OMO_X = A.omoya.bx * K // 7272
const OMO_ZS = -A.omoya.bzS * K // -9090
const OMO_ZN = A.omoya.bzN * K // +10908
/** 母屋の南北中心。心柱の中心（0）から北へずれている */
const OMO_ZC = (OMO_ZS + OMO_ZN) / 2

// --- 心柱架構（4 間 x 6 間）。当初計画の中心に据わったまま ---
const CORE_X = A.core.bx * K // 3636
const CORE_Z = A.core.bz * K // 5454

// --- 大屋根 ---
const EAVE_Y = A.floor.l5 - A.roof.eaveRun * A.roof.slope
const EAVE_X = OMO_X + A.roof.eaveRun
const RIDGE_UNDER = A.floor.l5 + OMO_X * A.roof.slope
const RIDGE_ZS = OMO_ZS + A.roof.ridgeInsetKen * K
const RIDGE_ZN = OMO_ZN - A.roof.ridgeInsetKen * K
const EAVE_ZS = OMO_ZS - A.roof.eaveRun
const EAVE_ZN = OMO_ZN + A.roof.eaveRun

// ---------------------------------------------------------------------------

type Approach = "settle" | "dropSlide" | "drive" | "thread"

type Member = {
  object: THREE.Object3D
  home: THREE.Vector3
  homeQuat: THREE.Quaternion
  scatter: THREE.Vector3
  arc: THREE.Vector3
  scatterQuat: THREE.Quaternion
  delay: number
  span: number
  showAt: number
  approach: Approach
}

export type TenshuHandle = {
  group: THREE.Group
  setProgress: (p: number) => void
  /**
   * 障子越しの灯を揺らす。レンダーループから毎フレーム呼ぶ。
   * 点くかどうか（明るさの上限）は setProgress が決め、ここはゆらぎだけを掛ける
   */
  updateGlow: (t: number) => void
  dispose: () => void
}

/**
 * 障子のテクスチャ。1 枚で**組子のます目 1 つ**。
 *
 * 左と下の縁に組子を描いておき、繰り返すと格子になる。
 * 地（紙）と発光の両方に同じ 1 枚を使うので、**灯が入ったとき組子だけが
 * 影として残る**——行灯を入れた障子の見え方そのもの。
 */
function drawShojiTexture(): THREE.CanvasTexture {
  const S = 64
  const c = document.createElement("canvas")
  c.width = S
  c.height = S
  const g = c.getContext("2d")!
  g.fillStyle = "#f4efe3"
  g.fillRect(0, 0, S, S)
  // 紙の繊維。ごく薄いむら
  let seed = 11
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 90; i++) {
    g.fillStyle = `rgba(160,140,110,${0.03 + rnd() * 0.05})`
    g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 5, 1)
  }
  // 組子（木の桟）
  const w = 3
  g.fillStyle = "#4a3622"
  g.fillRect(0, 0, w, S)
  g.fillRect(0, S - w, S, w)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  // UV は縦横とも組子の横間隔で割って振るので、縦だけ間隔の比で縮める
  tex.repeat.set(1, GLOW.kumikoV / GLOW.kumikoH)
  tex.anisotropy = 4
  return tex
}

const smooth01 = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

const _v = new THREE.Vector3()
const _e = new THREE.Euler()
const _q = new THREE.Quaternion()
const Z_AXIS = new THREE.Vector3(0, 0, 1)

/** 乱数。見た目のばらつきは毎回同じにしたいので固定種 */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createTenshu(tex: WoodTextures, profile: DeviceProfile): TenshuHandle {
  const root = new THREE.Group()
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  /** 窓をずらすために複製したテクスチャ。実体は共有だが後始末は要る */
  const textureClones: THREE.Texture[] = []
  const members: Member[] = []
  const banks: InstancedBank[] = []
  /** 塗り上げで現れる面（屋根・壁）。段ごとに不透明度を上げる */
  const clads: Array<{ mesh: THREE.Mesh; group: number }> = []
  const rnd = mulberry32(20261013)

  // ---------------------------------------------------------------------------
  // マテリアル
  // ---------------------------------------------------------------------------
  const track = <T extends THREE.Material>(m: T) => {
    materials.push(m)
    return m
  }

  const side = (
    t: { map: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture },
    spec: { tint: number; roughness: number }
  ) =>
    track(
      new THREE.MeshStandardMaterial({
        map: t.map,
        normalMap: t.normal,
        roughnessMap: t.rough,
        color: spec.tint,
        metalness: 0,
        normalScale: new THREE.Vector2(0.8, 0.8),
        envMapIntensity: ENV_INTENSITY,
      })
    )

  const matCore = side(tex.sideA, WOOD.core)
  const matPost = side(tex.sideB, WOOD.post)
  const matHoriz = side(tex.sideB, WOOD.horizontal)
  const matSmall = side(tex.sideA, WOOD.small)

  const matEnd = track(
    new THREE.MeshStandardMaterial({
      map: tex.end.map,
      normalMap: tex.end.normal,
      metalness: 0,
      roughness: 0.8,
      normalScale: new THREE.Vector2(0.7, 0.7),
      envMapIntensity: ENV_INTENSITY,
    })
  )

  const matPeg = track(
    new THREE.MeshStandardMaterial({
      map: tex.fresh.map,
      color: WOOD.peg.tint,
      roughness: WOOD.peg.roughness,
      metalness: 0,
      envMapIntensity: ENV_INTENSITY,
    })
  )

  // 石垣の写真を貼る。ただし**1 個の石に写真 1 枚をまるごと貼ると、
  // 「石の中に石垣が描かれている」状態**になって一目で嘘になる。
  // そこで写真を 3x3 に割り、石ごとにどの窓を使うかを変える。
  //
  // クローンしたテクスチャは three の Source を共有するので、
  // 9 枚に増やしても GPU 上の実体は 1 枚のまま。増えるのはドローコールだけ。
  const SPLIT = STONE.uvSplit
  const stoneMats: THREE.MeshStandardMaterial[] = []
  for (let i = 0; i < SPLIT * SPLIT; i++) {
    const win = (t: THREE.Texture) => {
      const c = t.clone()
      c.wrapS = THREE.RepeatWrapping
      c.wrapT = THREE.RepeatWrapping
      c.repeat.set(1 / SPLIT, 1 / SPLIT)
      c.offset.set((i % SPLIT) / SPLIT, Math.floor(i / SPLIT) / SPLIT)
      c.needsUpdate = true
      textureClones.push(c)
      return c
    }
    stoneMats.push(
      track(
        new THREE.MeshStandardMaterial({
          map: win(tex.ishigaki.map),
          normalMap: win(tex.ishigaki.normal),
          roughnessMap: win(tex.ishigaki.rough),
          color: STONE.color,
          roughness: STONE.roughness,
          metalness: 0,
          normalScale: new THREE.Vector2(1.3, 1.3),
          envMapIntensity: ENV_INTENSITY * 0.7,
        })
      )
    )
  }

  // ---------------------------------------------------------------------------
  // 部材を 1 本置く
  // ---------------------------------------------------------------------------
  type PlaceOpts = {
    boxes: BoxMm[]
    grain: Grain
    sectionMm: number
    material: THREE.Material
    /** 木口を年輪テクスチャにするか。遠景の細物は false にしてドローコールを節約 */
    endGrain?: boolean
    /** 影を落とすか。細物は落とさない（影の描画が最大の負荷のため） */
    shadow?: boolean
    homeMm: [number, number, number]
    homeQuat?: THREE.Quaternion
    scatterMm: [number, number, number]
    arcMm?: [number, number, number]
    jitter?: [number, number, number]
    delay: number
    span: number
    preroll?: number
    approach?: Approach
  }

  function place(o: PlaceOpts) {
    const mats = o.endGrain ? faceMaterials(o.grain, o.material, matEnd) : o.material
    const g = buildMember(o.boxes, o.grain, mats, o.sectionMm, geometries, o.shadow !== false)

    const home = new THREE.Vector3(u(o.homeMm[0]), u(o.homeMm[1]), u(o.homeMm[2]))
    const homeQuat = o.homeQuat ? o.homeQuat.clone() : new THREE.Quaternion()
    const jitter = o.jitter ?? [0, 0, 0]

    g.position.copy(home)
    g.quaternion.copy(homeQuat)
    root.add(g)

    members.push({
      object: g,
      home,
      homeQuat,
      scatter: new THREE.Vector3(u(o.scatterMm[0]), u(o.scatterMm[1]), u(o.scatterMm[2])),
      arc: new THREE.Vector3(u(o.arcMm?.[0] ?? 0), u(o.arcMm?.[1] ?? 0), u(o.arcMm?.[2] ?? 0)),
      scatterQuat: homeQuat.clone().multiply(_q.setFromEuler(_e.set(...jitter))),
      delay: o.delay,
      span: o.span,
      showAt: o.delay - (o.preroll ?? 0.03),
      approach: o.approach ?? "settle",
    })
  }

  const bar = (size: [number, number, number]): BoxMm[] => [{ size, at: [0, 0, 0] }]

  const step = (t: { delay: number; span: number; stagger: number }, i: number) => ({
    delay: t.delay + t.stagger * i,
    span: t.span,
  })

  // ===========================================================================
  // 1. 石垣（天守台）— 不等辺八角形の野面積み
  // ===========================================================================
  //
  // 地山の形に合わせて積んだ結果、八角形になった。
  // 各面の勾配（北 69 / 東 61 / 南 64 / 西 63 度）は資料の実測値で、
  // **面ごとに勾配が違う**ことがこの石垣の一番の特徴なのでそのまま使っている。
  //
  // 600 を超える石を 1 個 1 メッシュにするとドローコールが破綻するので
  // InstancedMesh。段の下から順に積み上がる。
  {
    const b = A.base
    const hx = b.halfX
    const hz = b.halfZ
    const c = b.cut

    // 天端の八角形。北から時計回り
    const poly: Array<[number, number]> = [
      [-(hx - c), hz],
      [hx - c, hz],
      [hx, hz - c],
      [hx, -(hz - c)],
      [hx - c, -hz],
      [-(hx - c), -hz],
      [-hx, -(hz - c)],
      [-hx, hz - c],
    ]
    const slopes = [
      b.slope.n,
      b.slope.corner,
      b.slope.e,
      b.slope.corner,
      b.slope.s,
      b.slope.corner,
      b.slope.w,
      b.slope.corner,
    ]

    const courses = Math.max(1, Math.round(b.height / b.courseH))
    const courseH = b.height / courses
    const stoneW = profile.isMobile ? b.stoneW * 1.5 : b.stoneW
    // 窓ごとに 1 束。束の数がそのままドローコールになる
    const byWindow: InstanceSpec[][] = stoneMats.map(() => [])
    let placed = 0

    for (let ci = 0; ci < courses; ci++) {
      const yc = (ci + 0.5) * courseH
      // 上へ行くほど面が内側へ入る（勾配）
      const back = 1 - yc / b.height

      for (let ei = 0; ei < poly.length; ei++) {
        const [x0, z0] = poly[ei]
        const [x1, z1] = poly[(ei + 1) % poly.length]
        const dx = x1 - x0
        const dz = z1 - z0
        const len = Math.hypot(dx, dz)
        // 外向きの法線。頂点は時計回りなので右手側が外
        const nx = dz / len
        const nz = -dx / len
        const out = (b.height / Math.tan((slopes[ei] * Math.PI) / 180)) * back

        const n = Math.max(2, Math.round(len / stoneW))
        // 段ごとに半石ずらす。縦目地が通ると一気に嘘になる
        const shift = ci % 2 === 0 ? 0 : 0.5

        for (let si = 0; si < n; si++) {
          const t = (si + 0.5 + shift * 0.5) / n
          if (t >= 1) continue
          // **隣と重ねる**のが肝。ぴったり並べると必ず隙間が出て、
          // 石垣ではなく積み木に見える。野面積みは元々すき間を
          // ぐり石で埋めるものなので、重なっていて構わない。
          const w = (len / n) * (1.06 + rnd() * 0.22)
          const h = courseH * (1.0 + rnd() * 0.2)
          const d = 640 * (0.85 + rnd() * 0.4)

          // 石の面がどれだけ前に出るかを 1 個ずつ変える。
          // 面を揃えると切石積みに見えてしまう
          const face = (rnd() - 0.5) * 150 - d * 0.25
          const px = x0 + dx * t + nx * (out + face)
          const pz = z0 + dz * t + nz * (out + face)
          const py = yc + (rnd() - 0.5) * courseH * 0.1

          const quat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(
              (rnd() - 0.5) * 0.09,
              Math.atan2(dx, dz) + (rnd() - 0.5) * 0.1,
              (rnd() - 0.5) * 0.09
            )
          )

          const shade = 1 + (rnd() - 0.5) * 2 * STONE.variance
          byWindow[Math.floor(rnd() * stoneMats.length) % stoneMats.length].push({
            pos: new THREE.Vector3(u(px), u(py), u(pz)),
            quat,
            scale: new THREE.Vector3(u(w), u(h), u(d)),
            color: new THREE.Color(STONE.color).multiplyScalar(shade),
            // 下から持ち上げて据える。滑車で吊ったように
            scatter: new THREE.Vector3(u(nx * 2600), u(-1800), u(nz * 2600)),
            spin: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0.3, 0.15)),
            ...step(TIMING.stone, placed++),
          })
        }
      }
    }

    // 単位立方体に per-instance スケールを掛ける。
    // UV は面ごとに 0..1 なので、窓の大きさ（写真の 1/3）がそのまま 1 石に乗る
    byWindow.forEach((list, i) => {
      if (list.length === 0) return
      const bank = createInstancedBank(new THREE.BoxGeometry(1, 1, 1), stoneMats[i], list)
      banks.push(bank)
      root.add(bank.mesh)
    })
  }

  // ===========================================================================
  // 2. 礎石
  // ===========================================================================
  //
  // 1 間の格子に据える。**柱が乗らない礎石のほうが多い**のは資料どおりで、
  // 設計変更の「ニゲ」を見込んで据えたためとされる。
  {
    const specs: InstanceSpec[] = []
    let i = 0
    for (let ix = -A.omoya.bx; ix <= A.omoya.bx; ix++) {
      for (let iz = -A.omoya.bzS; iz <= A.omoya.bzN; iz++) {
        const s = 0.8 + rnd() * 0.5
        specs.push({
          pos: new THREE.Vector3(
            u(ix * K + (rnd() - 0.5) * 120),
            u(130),
            u(iz * K + (rnd() - 0.5) * 120)
          ),
          quat: new THREE.Quaternion().setFromEuler(
            new THREE.Euler((rnd() - 0.5) * 0.06, rnd() * 3.14, (rnd() - 0.5) * 0.06)
          ),
          scale: new THREE.Vector3(u(900 * s), u(260), u(900 * s)),
          color: new THREE.Color(STONE.color).multiplyScalar(1 + (rnd() - 0.5) * 0.3),
          scatter: new THREE.Vector3(0, u(-1400), 0),
          ...step(TIMING.footing, i++),
        })
      }
    }
    const bank = createInstancedBank(new THREE.BoxGeometry(1, 1, 1), stoneMats[4], specs)
    banks.push(bank)
    root.add(bank.mesh)
  }

  // ===========================================================================
  // 3. 心柱架構 — 4 間 x 6 間、柱 22 本、高さ 8 間
  // ===========================================================================
  //
  // **ここが天主の芯**。外周 20 本 ＋ 宝塔脇の中央 2 本 = 22 本。
  // 資料の「一気に建て」をそのまま動かすため、stagger をほぼ 0 にして
  // 22 本が揃って立ち上がるようにしてある。
  {
    const h = A.core.height
    const sec = A.core.sec
    const slots: Array<[number, number]> = []

    for (let ix = -A.core.bx; ix <= A.core.bx; ix++) {
      for (let iz = -A.core.bz; iz <= A.core.bz; iz++) {
        const onEdge =
          Math.abs(ix) === A.core.bx || Math.abs(iz) === A.core.bz
        if (onEdge) slots.push([ix * K, iz * K])
      }
    }
    // 宝塔脇の中央 2 本
    slots.push([0, -K], [0, K])

    slots.forEach(([x, z], i) => {
      place({
        boxes: bar([sec, h + 2 * EMBED, sec]),
        grain: "y",
        sectionMm: sec,
        material: matCore,
        endGrain: true,
        homeMm: [x, h / 2, z],
        // 下から一気に立ち上がる
        scatterMm: [0, -h * 1.15, 0],
        jitter: [0.02, 0.05, 0.02],
        ...step(TIMING.core, i),
      })
    })

    // 各重の高さで心柱を締める貫。これが無いと 22 本が束にならない
    let n = 0
    for (const y of [A.floor.l2, A.floor.l3, A.floor.l4]) {
      for (const x of [-CORE_X, 0, CORE_X]) {
        place({
          boxes: bar([A.nuki.t, A.nuki.h, 2 * CORE_Z + A.core.sec]),
          grain: "z",
          sectionMm: A.nuki.h,
          material: matSmall,
          shadow: false,
          homeMm: [x, y, 0],
          scatterMm: [0, 0, 2 * CORE_Z],
          approach: "thread",
          ...step(TIMING.coreTie, n++),
        })
      }
      for (const z of [-CORE_Z, CORE_Z]) {
        place({
          boxes: bar([2 * CORE_X + A.core.sec, A.nuki.h, A.nuki.t]),
          grain: "x",
          sectionMm: A.nuki.h,
          material: matSmall,
          shadow: false,
          homeMm: [0, y, z],
          scatterMm: [-2 * CORE_X, 0, 0],
          approach: "thread",
          ...step(TIMING.coreTie, n++),
        })
      }
    }
  }

  // ===========================================================================
  // 4. 母屋 — 8 間 x 11 間。心柱に寄りかかる
  // ===========================================================================
  {
    const sec = A.omoya.sec
    const h = A.floor.l5
    const xs = [-4, -2, 0, 2, 4].map((i) => i * K)
    // 北端の +6 間だけ間隔が 1 間。あとから足した一列で、資料でも「目立つ」とある
    const zs = [-5, -3, -1, 1, 3, 5, 6].map((i) => i * K)

    const slots: Array<[number, number]> = []
    for (const x of xs) {
      for (const z of zs) {
        if (Math.abs(x) === OMO_X || z === OMO_ZS || z === OMO_ZN) slots.push([x, z])
      }
    }
    // 隅から先に。建て方として自然
    slots.sort((a, b) => Math.abs(b[0]) + Math.abs(b[1]) - (Math.abs(a[0]) + Math.abs(a[1])))

    slots.forEach(([x, z], i) => {
      place({
        boxes: bar([sec, h + 2 * EMBED, sec]),
        grain: "y",
        sectionMm: sec,
        material: matPost,
        endGrain: true,
        homeMm: [x, h / 2, z],
        scatterMm: [0, -h * 1.1, 0],
        jitter: [0.03, 0.06, 0.03],
        ...step(TIMING.omoyaPost, i),
      })
    })

    // 各重の貫
    let n = 0
    for (const y of [A.floor.l2, A.floor.l3, A.floor.l4, A.floor.l5]) {
      for (const x of [-OMO_X, OMO_X]) {
        place({
          boxes: bar([A.nuki.t, A.nuki.h, OMO_ZN - OMO_ZS + sec]),
          grain: "z",
          sectionMm: A.nuki.h,
          material: matSmall,
          shadow: false,
          homeMm: [x, y, OMO_ZC],
          scatterMm: [0, 0, OMO_ZN - OMO_ZS],
          approach: "thread",
          ...step(TIMING.omoyaTie, n++),
        })
      }
      for (const z of [OMO_ZS, OMO_ZN]) {
        place({
          boxes: bar([2 * OMO_X + sec, A.nuki.h, A.nuki.t]),
          grain: "x",
          sectionMm: A.nuki.h,
          material: matSmall,
          shadow: false,
          homeMm: [0, y, z],
          scatterMm: [-2 * OMO_X, 0, 0],
          approach: "thread",
          ...step(TIMING.omoyaTie, n++),
        })
      }
    }

    // 母屋と心柱をつなぐ梁。**この梁があって初めて「寄りかかる」が成立する**
    n = 0
    for (const y of [A.floor.l3, A.floor.l4, A.floor.l5]) {
      for (const z of [-CORE_Z, 0, CORE_Z]) {
        place({
          boxes: bar([2 * OMO_X, A.beam.h, A.beam.w]),
          grain: "x",
          sectionMm: A.beam.h,
          material: matHoriz,
          homeMm: [0, y - A.beam.h / 2 - EMBED, z],
          scatterMm: [0, 5200, 0],
          arcMm: [0, 0, 900],
          jitter: [0.04, 0.05, -0.03],
          ...step(TIMING.omoyaBeam, n++),
        })
      }
      for (const x of [-CORE_X, CORE_X]) {
        place({
          boxes: bar([A.beam.w, A.beam.h, OMO_ZN - OMO_ZS]),
          grain: "z",
          sectionMm: A.beam.h,
          material: matHoriz,
          homeMm: [x, y - A.beam.h / 2 - EMBED, OMO_ZC],
          scatterMm: [0, 5200, 0],
          arcMm: [900, 0, 0],
          jitter: [-0.04, 0.05, 0.03],
          ...step(TIMING.omoyaBeam, n++),
        })
      }
    }
  }

  // ===========================================================================
  // 5. 四重目の桁 — 東側に**金輪継ぎ**が納まる
  // ===========================================================================
  {
    const y = A.floor.l4
    const gy = y - A.beam.h / 2
    const len = OMO_ZN - OMO_ZS + A.beam.w * 2

    // 西側・南北の桁（1 本もの）
    place({
      boxes: bar([A.beam.w, A.beam.h, len]),
      grain: "z",
      sectionMm: A.beam.h,
      material: matHoriz,
      endGrain: true,
      homeMm: [-OMO_X, gy, OMO_ZC],
      scatterMm: [0, 6000, -2400],
      jitter: [0.04, -0.05, 0.03],
      ...step(TIMING.girder, 0),
    })

    // 東西方向の桁（南北の端）
    ;[OMO_ZS, OMO_ZN].forEach((z, i) => {
      place({
        boxes: bar([2 * OMO_X + A.beam.w, A.beam.h, A.beam.w]),
        grain: "x",
        sectionMm: A.beam.h,
        material: matHoriz,
        endGrain: true,
        homeMm: [0, gy, z],
        scatterMm: [0, 6000, 0],
        jitter: [0.03, 0.05, -0.04],
        ...step(TIMING.girder, i + 1),
      })
    })

    // --- 東側の桁 = 金輪継ぎ ---
    //
    // 20m を超える桁は 1 本の材では取れない。継手は必ず要る。
    // **冒頭で刻んだこの継手が、天主のどこに納まるのかを最後に見せる**——
    // それがこのシーン全体の主題になっている。
    const homeMm: [number, number, number] = [OMO_X, gy, OMO_ZC]
    const { lapHalf, shoulder, pegX, pegSec } = JOINT
    const gh = A.beam.h
    const gw = A.beam.w
    const half = gh / 2
    const shaftLen = len / 2 - lapHalf
    const shaftMid = lapHalf + shaftLen / 2
    const lapLen = (lapHalf - shoulder) * 2

    // 受け手。目違い＋下半分の舌。長手は z 方向
    place({
      boxes: [
        { size: [gw, gh, shaftLen], at: [0, 0, -shaftMid] },
        { size: [gw, gh, shoulder], at: [0, 0, -lapHalf + shoulder / 2] },
        { size: [gw, half, lapLen], at: [0, -half / 2, 0] },
      ],
      grain: "z",
      sectionMm: gh,
      material: matHoriz,
      endGrain: true,
      homeMm,
      scatterMm: [-330, -240, -900],
      arcMm: [90, 180, 0],
      jitter: [-0.2, 0.05, 0.1],
      preroll: 0.3,
      ...TIMING.jointBeamA,
    })

    // 落としてから横に滑らせるほう。目違いがあるので真っ直ぐには入らない
    place({
      boxes: [
        { size: [gw, gh, shaftLen], at: [0, 0, shaftMid] },
        { size: [gw, gh, shoulder], at: [0, 0, lapHalf - shoulder / 2] },
        { size: [gw, half, lapLen], at: [0, half / 2, 0] },
      ],
      grain: "z",
      sectionMm: gh,
      material: matHoriz,
      endGrain: true,
      homeMm,
      scatterMm: [0, 900, 810],
      jitter: [0.16, -0.04, -0.06],
      approach: "dropSlide",
      preroll: 0.3,
      ...TIMING.jointBeamB,
    })

    // 込栓。上から叩き込む
    pegX.forEach((z, i) => {
      place({
        boxes: [{ size: [pegSec, gh + 60, pegSec], at: [0, 12, z] }],
        grain: "y",
        sectionMm: pegSec,
        material: matPeg,
        homeMm,
        scatterMm: [0, 690 + i * 210, 0],
        approach: "drive",
        preroll: 0.3,
        ...TIMING.jointPeg[i],
      })
    })
  }

  // ===========================================================================
  // 6. 腰屋根（各重の庇）
  // ===========================================================================
  //
  // **天主の段々したシルエットを作っているのはこれ**。
  // 軸組だけを積み上げると真っ直ぐな箱にしかならず、どれだけ部材を足しても
  // 城には見えない。各重で庇が張り出し、その水平の帯が重なることで
  // 「重」が読めるようになる。
  //
  // 垂木は形が全部同じなので InstancedMesh にまとめて 1 ドローで描く。
  {
    const sk = A.skirt
    const drop = sk.out * A.roof.slope
    const lenR = Math.hypot(sk.out, drop)
    const skirtSpecs: InstanceSpec[] = []
    let si = 0
    let pi = 0

    for (const key of sk.levels) {
      const y = A.floor[key]
      const ey = y - drop

      // --- 垂木 ---
      // 外向きの水平ベクトル o ごとに、壁際から軒先へ下る材を並べる
      const runSide = (
        o: [number, number],
        from: number,
        to: number,
        /** 材を並べる軸（o と直交するほう） */
        alongZ: boolean,
        /** 壁面の位置 */
        base: number
      ) => {
        const dir = new THREE.Vector3(o[0] * sk.out, -drop, o[1] * sk.out).normalize()
        const nrm = new THREE.Vector3(o[0] * drop, sk.out, o[1] * drop).normalize()
        const quat = new THREE.Quaternion().setFromUnitVectors(Z_AXIS, dir)
        const lift = sk.rafterD / 2 - EMBED

        for (let t = from; t <= to + 1; t += sk.pitch) {
          // 壁際と軒先の中点。そこから屋根の法線ぶん持ち上げる
          const mx = o[0] * (base + sk.out / 2)
          const mz = o[1] * (base + sk.out / 2)
          skirtSpecs.push({
            pos: new THREE.Vector3(
              u((alongZ ? mx : t) + nrm.x * lift),
              u((y + ey) / 2 + nrm.y * lift),
              u((alongZ ? t : mz) + nrm.z * lift)
            ),
            quat,
            scatter: new THREE.Vector3(u(o[0] * 3600), u(4200), u(o[1] * 3600)),
            spin: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0.08, 0.06)),
            ...step(TIMING.skirt, si++),
          })
        }
      }

      runSide([1, 0], OMO_ZS, OMO_ZN, true, OMO_X)
      runSide([-1, 0], OMO_ZS, OMO_ZN, true, OMO_X)
      runSide([0, 1], -OMO_X, OMO_X, false, OMO_ZN)
      runSide([0, -1], -OMO_X, OMO_X, false, -OMO_ZS)

      // --- 軒桁 ---
      const ex = OMO_X + sk.out
      const ezs = OMO_ZS - sk.out
      const ezn = OMO_ZN + sk.out
      const py = ey - sk.purlinSec / 2

      for (const x of [-ex, ex]) {
        place({
          boxes: bar([sk.purlinSec, sk.purlinSec, ezn - ezs]),
          grain: "z",
          sectionMm: sk.purlinSec,
          material: matHoriz,
          homeMm: [x, py, (ezs + ezn) / 2],
          scatterMm: [0, 5000, 0],
          jitter: [0.04, 0.04, 0.03],
          ...step(TIMING.skirt, 400 + pi++),
        })
      }
      for (const z of [ezs, ezn]) {
        place({
          boxes: bar([2 * ex, sk.purlinSec, sk.purlinSec]),
          grain: "x",
          sectionMm: sk.purlinSec,
          material: matHoriz,
          homeMm: [0, py, z],
          scatterMm: [0, 5000, 0],
          jitter: [0.03, 0.04, -0.04],
          ...step(TIMING.skirt, 400 + pi++),
        })
      }

      // --- 隅木 ---
      for (const sx of [-1, 1]) {
        for (const [wz, ez] of [
          [OMO_ZS, ezs],
          [OMO_ZN, ezn],
        ]) {
          const dx = sx * (ex - OMO_X)
          const dz = ez - wz
          const dir = _v.set(dx, -drop, dz).normalize()
          const lenH = Math.hypot(dx, drop, dz)
          place({
            boxes: bar([sk.rafterW * 1.4, sk.rafterD * 1.2, lenH]),
            grain: "z",
            sectionMm: sk.rafterD,
            material: matHoriz,
            homeMm: [sx * (OMO_X + (ex - OMO_X) / 2), (y + ey) / 2, (wz + ez) / 2],
            homeQuat: new THREE.Quaternion().setFromUnitVectors(Z_AXIS, dir),
            scatterMm: [0, 4600, 0],
            jitter: [0.06, 0.05, 0.05],
            ...step(TIMING.skirt, 400 + pi++),
          })
        }
      }
    }

    const skirtGeo = lumberGeometry([sk.rafterW, sk.rafterD, lenR], "z", sk.rafterD)
    const bank = createInstancedBank(skirtGeo, matSmall, skirtSpecs)
    banks.push(bank)
    root.add(bank.mesh)
  }

  // ===========================================================================
  // 7. 入母屋大屋根
  // ===========================================================================
  {
    const r = A.roof

    // --- 棟木 ---
    place({
      boxes: bar([r.ridgeW, r.ridgeH, RIDGE_ZN - RIDGE_ZS]),
      grain: "z",
      sectionMm: r.ridgeH,
      material: matHoriz,
      endGrain: true,
      homeMm: [0, RIDGE_UNDER - r.ridgeH / 2, (RIDGE_ZS + RIDGE_ZN) / 2],
      // 上棟。高いところからゆっくり降ろす
      scatterMm: [0, 14000, 0],
      jitter: [0.02, 0.04, 0.02],
      ...step(TIMING.ridge, 0),
    })

    // --- 隅木 4 本。棟の両端から軒の四隅へ ---
    const hips: Array<[number, number, number, number]> = [
      [0, RIDGE_ZS, -EAVE_X, EAVE_ZS],
      [0, RIDGE_ZS, EAVE_X, EAVE_ZS],
      [0, RIDGE_ZN, -EAVE_X, EAVE_ZN],
      [0, RIDGE_ZN, EAVE_X, EAVE_ZN],
    ]
    hips.forEach(([x0, z0, x1, z1], i) => {
      const dx = x1 - x0
      const dz = z1 - z0
      const dy = EAVE_Y - RIDGE_UNDER
      const lenH = Math.hypot(dx, dy, dz)
      const dir = _v.set(dx, dy, dz).normalize()
      const quat = new THREE.Quaternion().setFromUnitVectors(Z_AXIS, dir)
      place({
        boxes: bar([r.hipW, r.hipH, lenH]),
        grain: "z",
        sectionMm: r.hipH,
        material: matHoriz,
        homeMm: [(x0 + x1) / 2, (RIDGE_UNDER + EAVE_Y) / 2 + r.hipH / 2 - EMBED, (z0 + z1) / 2],
        homeQuat: quat,
        scatterMm: [0, 7000, 0],
        jitter: [0.05, 0.05, 0.04],
        ...step(TIMING.hip, i),
      })
    })

    // --- 母屋（桁行の受け材）と軒桁 ---
    // 屋根の下端ラインは 棟(RIDGE_UNDER) → 軒(EAVE_Y) の直線
    const underAt = (x: number) => RIDGE_UNDER - Math.abs(x) * r.slope
    // 隅木が x のところで z 方向にどこまで来るか
    const hipZAt = (x: number) => {
      const t = Math.abs(x) / EAVE_X
      return {
        s: RIDGE_ZS + t * (EAVE_ZS - RIDGE_ZS),
        n: RIDGE_ZN + t * (EAVE_ZN - RIDGE_ZN),
      }
    }

    let pn = 0
    for (const x of [-OMO_X / 2, OMO_X / 2, -EAVE_X, EAVE_X]) {
      const zz = hipZAt(x)
      const isEave = Math.abs(x) === EAVE_X
      place({
        boxes: bar([r.purlinSec, r.purlinSec, zz.n - zz.s]),
        grain: "z",
        sectionMm: r.purlinSec,
        material: isEave ? matHoriz : matSmall,
        homeMm: [x, underAt(x) - r.purlinSec / 2, (zz.s + zz.n) / 2],
        scatterMm: [0, 6000, 0],
        jitter: [0.04, 0.04, 0.03],
        ...step(TIMING.purlin, pn++),
      })
    }

    // --- 垂木 ---
    // 棟の範囲だけに並べる（両端は隅木が受け持つ）。同形が並ぶので InstancedMesh。
    const run = EAVE_X
    const rise = RIDGE_UNDER - EAVE_Y
    const lenR = Math.hypot(run, rise)
    const angle = Math.atan2(rise, run)
    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)
    const lift = r.rafterD / 2 - EMBED
    const midY = (RIDGE_UNDER + EAVE_Y) / 2

    const pitch = profile.isMobile ? r.rafterPitch * 2 : r.rafterPitch
    const zList: number[] = []
    for (let z = RIDGE_ZS; z <= RIDGE_ZN + 1; z += pitch) zList.push(z)

    const rafterSpecs: InstanceSpec[] = []
    zList.forEach((z, i) => {
      for (const xs of [-1, 1]) {
        const dir = new THREE.Vector3(xs * cosA, -sinA, 0).normalize()
        rafterSpecs.push({
          pos: new THREE.Vector3(
            u(xs * (run / 2 + lift * sinA)),
            u(midY + lift * cosA),
            u(z)
          ),
          quat: new THREE.Quaternion().setFromUnitVectors(Z_AXIS, dir),
          scatter: new THREE.Vector3(u(xs * 2600), u(5200), 0),
          spin: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.08, 0.05, 0.1)),
          ...step(TIMING.rafter, i),
        })
      }
    })

    const rafterGeo = lumberGeometry([r.rafterW, r.rafterD, lenR], "z", r.rafterD)
    const bank = createInstancedBank(rafterGeo, matSmall, rafterSpecs)
    banks.push(bank)
    root.add(bank.mesh)
  }

  // ===========================================================================
  // 8. 六重目（八角ノ段）
  // ===========================================================================
  //
  // **心柱の中心（0, 0）に載せる。母屋の中心ではない。**
  // 母屋を北へ 1 間伸ばした設計変更の結果、パビリオンが建物の中心から
  // 外れた——資料が「驚愕の造形」と呼ぶのはこのずれのこと。
  {
    const o = A.octa
    const apexY = o.floorY + o.height + o.apexRise
    let n = 0

    for (let i = 0; i < 8; i++) {
      const psi = (Math.PI / 8) * (2 * i + 1) // 22.5 度 + i x 45 度
      const px = Math.sin(psi) * o.radius
      const pz = Math.cos(psi) * o.radius

      // 柱
      place({
        boxes: bar([o.sec, o.height + 2 * EMBED, o.sec]),
        grain: "y",
        sectionMm: o.sec,
        material: matPost,
        homeMm: [px, o.floorY + o.height / 2, pz],
        homeQuat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, psi, 0)),
        scatterMm: [0, 9000, 0],
        jitter: [0.05, 0.08, 0.05],
        ...step(TIMING.octa, n++),
      })

      // 桁（隣の柱へ渡す）
      const psiMid = psi + Math.PI / 8
      const chord = 2 * o.radius * Math.sin(Math.PI / 8)
      const rMid = o.radius * Math.cos(Math.PI / 8)
      place({
        boxes: bar([chord, o.sec, o.sec * 0.7]),
        grain: "x",
        sectionMm: o.sec,
        material: matHoriz,
        homeMm: [
          Math.sin(psiMid) * rMid,
          o.floorY + o.height - o.sec / 2,
          Math.cos(psiMid) * rMid,
        ],
        homeQuat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, psiMid, 0)),
        scatterMm: [0, 8000, 0],
        jitter: [0.04, 0.06, 0.04],
        ...step(TIMING.octa, n++),
      })

      // 隅木（頂点へ集まる）
      const topY = o.floorY + o.height
      const dir = _v.set(-px, apexY - topY, -pz).normalize()
      const lenH = Math.hypot(px, apexY - topY, pz)
      place({
        boxes: bar([o.sec * 0.6, o.sec * 0.8, lenH]),
        grain: "z",
        sectionMm: o.sec,
        material: matSmall,
        homeMm: [px / 2, (topY + apexY) / 2, pz / 2],
        homeQuat: new THREE.Quaternion().setFromUnitVectors(Z_AXIS, dir),
        scatterMm: [0, 6000, 0],
        jitter: [0.06, 0.05, 0.05],
        ...step(TIMING.octa, n++),
      })
    }
  }

  // ===========================================================================
  // 9. 七重目（四角）— 宝形屋根
  // ===========================================================================
  {
    const t = A.top
    const apexY = t.floorY + t.height + t.roofRise
    const topY = t.floorY + t.height
    const corners: Array<[number, number]> = [
      [-t.half, -t.half],
      [t.half, -t.half],
      [t.half, t.half],
      [-t.half, t.half],
    ]
    let n = 0

    corners.forEach(([cx, cz], i) => {
      place({
        boxes: bar([t.sec, t.height + 2 * EMBED, t.sec]),
        grain: "y",
        sectionMm: t.sec,
        material: matPost,
        homeMm: [cx, t.floorY + t.height / 2, cz],
        scatterMm: [0, 9000, 0],
        jitter: [0.05, 0.08, 0.05],
        ...step(TIMING.top, n++),
      })

      // 桁
      const [nx, nz] = corners[(i + 1) % 4]
      const dx = nx - cx
      const dz = nz - cz
      place({
        boxes: bar([Math.hypot(dx, dz), t.sec, t.sec * 0.7]),
        grain: "x",
        sectionMm: t.sec,
        material: matHoriz,
        homeMm: [(cx + nx) / 2, topY - t.sec / 2, (cz + nz) / 2],
        homeQuat: new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0, Math.atan2(dx, dz), 0)
        ),
        scatterMm: [0, 8000, 0],
        jitter: [0.04, 0.06, 0.04],
        ...step(TIMING.top, n++),
      })

      // 隅木
      const dir = _v.set(-cx, apexY - topY, -cz).normalize()
      const lenH = Math.hypot(cx, apexY - topY, cz)
      place({
        boxes: bar([t.sec * 0.6, t.sec * 0.8, lenH]),
        grain: "z",
        sectionMm: t.sec,
        material: matSmall,
        homeMm: [cx / 2, (topY + apexY) / 2, cz / 2],
        homeQuat: new THREE.Quaternion().setFromUnitVectors(Z_AXIS, dir),
        scatterMm: [0, 6000, 0],
        jitter: [0.06, 0.05, 0.05],
        ...step(TIMING.top, n++),
      })
    })
  }

  // ===========================================================================
  // 10. 塗り上げ — 屋根を葺き、壁を塗る
  // ===========================================================================
  //
  // ここまでは軸組しか無い。最後に屋根を葺き、壁を塗って建物を閉じる。
  //
  // **大壁ではなく真壁にしている**のが肝。壁を柱の外側まで塗り込めると、
  // スクロールの全部を使って見せてきた継手も仕口も一つ残らず隠れてしまう。
  // 柱を見せたまま、その間だけを塗る——構造が見えたまま完成する。
  //
  // 塗り上がりは**下から順**。面ごとに不透明度を持たせるとマテリアルが
  // 増えすぎるので、高さで 4 段に束ねて段ごとに 1 組だけ持たせている。
  type CladKind = "kawara" | "plaster" | "vermilion" | "gold" | "renji"
  const cladMats = new Map<string, THREE.MeshStandardMaterial>()

  function cladMaterial(group: number, kind: CladKind) {
    const key = `${group}:${kind}`
    const hit = cladMats.get(key)
    if (hit) return hit

    const C = CLAD_MATERIAL
    const common = { metalness: 0, envMapIntensity: ENV_INTENSITY, side: THREE.DoubleSide }
    let m: THREE.MeshStandardMaterial

    if (kind === "kawara") {
      m = new THREE.MeshStandardMaterial({
        ...common,
        map: tex.kawara.map,
        normalMap: tex.kawara.normal,
        roughnessMap: tex.kawara.rough,
        normalScale: new THREE.Vector2(1.2, 1.2),
        color: C.kawara.tint,
        roughness: C.kawara.roughness,
      })
    } else if (kind === "renji") {
      // 連子と敷居・鴨居。細い桟なので木目は見えない。色と粗さだけ木に寄せる
      m = new THREE.MeshStandardMaterial({
        ...common,
        map: tex.sideA.map,
        color: 0x6e5438,
        roughness: 0.78,
      })
    } else if (kind === "gold") {
      // 金だけは金属。環境マップを拾わせたいので roughness を落とす。
      // 箔を 1 枚ずつ押した継ぎ目が入るので、のっぺりした金属板にならない
      m = new THREE.MeshStandardMaterial({
        ...common,
        map: tex.gold.map,
        normalMap: tex.gold.normal,
        roughnessMap: tex.gold.rough,
        color: C.gold.color,
        roughness: C.gold.roughness,
        metalness: C.gold.metalness,
        envMapIntensity: C.gold.env,
      })
      // **照り返しの明るさに上限をかける。**
      // カメラが月の側に回ると、こちらを向いた軒の隅や鯱が月光を正面反射し、
      // ブルームの閾値の数倍の明るさで灯のように光った（金の反射色は橙なので、
      // 白い月光でも橙に光る）。光る金の隅は残し、にじむ明るさにだけはしない
      m.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <lights_fragment_end>",
          `#include <lights_fragment_end>
           reflectedLight.directSpecular = min( reflectedLight.directSpecular, vec3( ${C.gold.maxSpecular.toFixed(2)} ) );
           reflectedLight.indirectSpecular = min( reflectedLight.indirectSpecular, vec3( ${C.gold.maxSpecular.toFixed(2)} ) );`
        )
      }
    } else {
      const spec = kind === "vermilion" ? C.vermilion : C.plaster
      m = new THREE.MeshStandardMaterial({
        ...common,
        map: tex.plaster.map,
        normalMap: tex.plaster.normal,
        roughnessMap: tex.plaster.rough,
        color: kind === "vermilion" ? C.vermilion.color : C.plaster.tint,
        roughness: spec.roughness,
      })
    }

    m.transparent = true
    m.opacity = 0
    materials.push(m)
    cladMats.set(key, m)
    return m
  }

  /** 高さから塗り上げの段を決める。下から順に塗られる */
  const cladGroup = (yMm: number) => {
    if (yMm < A.floor.l4) return 0
    if (yMm < A.floor.l5) return 1
    if (yMm < A.octa.floorY) return 2
    return 3
  }

  /**
   * 仕上げの面は**いったん溜めておき、最後に材ごとにまとめて 1 枚にする**。
   *
   * 屋根・壁・破風板・懸魚・高欄を 1 枚ずつメッシュにすると数百になるが、
   * 同じ段・同じ材なら色も不透明度も完全に同じなので分ける理由がない。
   * まとめれば、段 4 つ × 材 4 種 = 最大 16 本のドローコールで収まる。
   */
  const cladBuckets = new Map<
    string,
    { group: number; kind: CladKind; geos: THREE.BufferGeometry[] }
  >()

  function addClad(geo: THREE.BufferGeometry, kind: CladKind, yMm: number) {
    const g = cladGroup(yMm)
    const key = `${g}:${kind}`
    let b = cladBuckets.get(key)
    if (!b) {
      b = { group: g, kind, geos: [] }
      cladBuckets.set(key, b)
    }
    b.geos.push(geo)
  }

  /** 2 点の間に板を 1 枚渡す。破風板・高欄の手すりに使う */
  function boardBetween(
    a: [number, number, number],
    b: [number, number, number],
    wMm: number,
    dMm: number,
    kind: CladKind,
    offset?: THREE.Vector3
  ) {
    const pa = new THREE.Vector3(u(a[0]), u(a[1]), u(a[2]))
    const pb = new THREE.Vector3(u(b[0]), u(b[1]), u(b[2]))
    const len = pa.distanceTo(pb)
    if (len < 1e-4) return
    const geo = new THREE.BoxGeometry(u(wMm), u(dMm), len)
    boxUv(geo, u(TILE.plaster))
    const dir = new THREE.Vector3().subVectors(pb, pa).normalize()
    const mid = new THREE.Vector3().addVectors(pa, pb).multiplyScalar(0.5)
    if (offset) mid.add(offset)
    geo.applyMatrix4(
      new THREE.Matrix4().compose(
        mid,
        new THREE.Quaternion().setFromUnitVectors(Z_AXIS, dir),
        new THREE.Vector3(1, 1, 1)
      )
    )
    addClad(geo, kind, (a[1] + b[1]) / 2)
  }

  /**
   * 破風板と懸魚。
   *
   * **破風の縁に白い板が回ると、三角形がぐっと締まる。**
   * 板が無いと、屋根に三角を貼っただけに見えてしまう。
   * 懸魚（げぎょ）は破風の頂点から下がる飾り板で、
   * 火伏せの願いを込めて魚の形を写したもの。
   */
  function gableTrim(
    A: [number, number, number],
    L: [number, number, number],
    R: [number, number, number],
    boardW: number,
    gegyoH: number
  ) {
    const pa = new THREE.Vector3(u(A[0]), u(A[1]), u(A[2]))
    const pl = new THREE.Vector3(u(L[0]), u(L[1]), u(L[2]))
    const pr = new THREE.Vector3(u(R[0]), u(R[1]), u(R[2]))
    // 妻面から手前へ出す向き
    const nrm = new THREE.Vector3()
      .subVectors(pl, pa)
      .cross(new THREE.Vector3().subVectors(pr, pa))
      .normalize()
    const out = nrm.clone().multiplyScalar(u(boardW * 0.55))

    boardBetween(A, L, boardW, boardW * 0.7, "plaster", out)
    boardBetween(A, R, boardW, boardW * 0.7, "plaster", out)

    if (gegyoH <= 0) return

    // 懸魚。頂点からぶら下がる輪郭。面内の縦横を法線から作る
    const up = new THREE.Vector3(0, 1, 0)
    const right = new THREE.Vector3().crossVectors(nrm, up).normalize()
    const down = new THREE.Vector3().crossVectors(right, nrm).normalize().negate()
    const h = u(gegyoH)
    const w = h * 0.62
    const base = pa.clone().add(nrm.clone().multiplyScalar(u(boardW * 0.9)))
    const at = (rx: number, dy: number) =>
      base.clone().addScaledVector(right, rx * w).addScaledVector(down, dy * h)
    const pts = [
      at(0, 0.02),
      at(0.5, 0.28),
      at(0.34, 0.74),
      at(0, 1),
      at(-0.34, 0.74),
      at(-0.5, 0.28),
    ]
    const ax = slopeAxes(nrm)
    addClad(planarPolygon(pts, ax.u, ax.v, u(TILE.plaster), u(TILE.plaster)), "plaster", A[1])
  }

  /** mm の点列から 1 枚の面を張る。UV は実寸から割るので瓦の大きさが揃う */
  function surface(
    ptsMm: Array<[number, number, number]>,
    kind: CladKind,
    tileU: number,
    tileV: number
  ) {
    const pts = ptsMm.map((q) => new THREE.Vector3(u(q[0]), u(q[1]), u(q[2])))
    const { u: ua, v: va } = slopeAxes(faceNormal(pts[0], pts[1], pts[2]))
    addClad(
      planarPolygon(pts, ua, va, u(tileU), u(tileV)),
      kind,
      ptsMm.reduce((a, q) => a + q[1], 0) / ptsMm.length
    )
  }

  const roofUV = [TILE.kawaraU, TILE.kawaraV] as const
  const wallUV = [TILE.plaster, TILE.plaster] as const

  /**
   * 屋根の**反り**。
   *
   * @param v      棟(0) → 軒先(1) の割合
   * @param corner 面の中央(0) → 隅(1)
   */
  const curlOf =
    (rise: number, power: number, cornerRise: number) => (v: number, corner: number) =>
      rise * Math.pow(v, power) * (1 + cornerRise * corner * corner)

  /** 曲面を 1 枚張って塗り上げの管理に載せる */
  function curvedRoof(
    segU: number,
    segV: number,
    yMm: number,
    fn: (pu: number, pv: number, pos: THREE.Vector3, tx: THREE.Vector2) => void
  ) {
    addClad(parametricSurface(segU, segV, fn), "kawara", yMm)
  }

  /**
   * 丸瓦を屋根面に並べる。
   *
   * 屋根面はテクスチャで葺いてあるが、それだけだと**軒先の輪郭が直線**になる。
   * 実際の本瓦葺は軒先に丸瓦の小口が並んで、縁が波打って見える。
   * 面の中央では 1 本あたり画面上 3px にしかならないので、
   * 分割は粗くてよい。**効くのは縁の形だけ**。
   *
   * 軒先のごく先端だけ金にしてある。安土城の「金箔瓦」は屋根一面ではなく、
   * 軒丸瓦・軒平瓦・鬼瓦といった**端の瓦**に箔を押したものだった。
   */
  function kawaraRolls(
    at: (pu: number, pv: number) => [number, number, number],
    eaveLenMm: number,
    yMm: number,
    segV: number
  ) {
    const k = A.kawara
    const pitch = profile.isMobile ? k.pitch * 1.8 : k.pitch
    const n = Math.max(2, Math.round(eaveLenMm / pitch))
    const r = u(k.radius)
    const EPS = 0.004

    const P = new THREE.Vector3()
    const across = new THREE.Vector3()
    const along = new THREE.Vector3()
    const nrm = new THREE.Vector3()

    /** 面の上に局所座標系を作る。差分で接線を 2 本取り、外積で法線を出す */
    const frame = (pu: number, pv: number) => {
      const c = at(pu, pv)
      P.set(u(c[0]), u(c[1]), u(c[2]))
      const a1 = at(Math.min(1, pu + EPS), pv)
      const a0 = at(Math.max(0, pu - EPS), pv)
      across.set(a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]).normalize()
      const b1 = at(pu, Math.min(1, pv + EPS))
      const b0 = at(pu, Math.max(0, pv - EPS))
      along.set(b1[0] - b0[0], b1[1] - b0[1], b1[2] - b0[2]).normalize()
      nrm.crossVectors(across, along).normalize()
      if (nrm.y < 0) nrm.negate()
    }

    for (let i = 0; i < n; i++) {
      const pu = (i + 0.5) / n

      // 本体。parametricSurface は v が外側の繰り返しなので、
      // v が変わったときだけ座標系を取り直せば済む
      let lastV = -1
      addClad(
        parametricSurface(k.segRad, segV, (ru, rv, pos, tx) => {
          if (rv !== lastV) {
            frame(pu, rv)
            lastV = rv
          }
          const th = Math.PI * ru
          pos
            .copy(P)
            .addScaledVector(across, Math.cos(th) * r)
            .addScaledVector(nrm, Math.sin(th) * r)
          tx.set(ru * 0.5, rv * 4)
        }),
        "kawara",
        yMm
      )

      // 軒先の小口。ここだけ金箔
      let lastG = -1
      const g0 = 1 - k.goldTip
      addClad(
        parametricSurface(k.segRad, 1, (ru, rv, pos, tx) => {
          if (rv !== lastG) {
            frame(pu, g0 + rv * k.goldTip)
            lastG = rv
          }
          const th = Math.PI * ru
          // 本体よりわずかに大きくして、重なりで z ファイティングを起こさせない
          pos
            .copy(P)
            .addScaledVector(across, Math.cos(th) * r * 1.08)
            .addScaledVector(nrm, Math.sin(th) * r * 1.08)
          tx.set(ru, rv)
        }),
        "gold",
        yMm
      )
    }
  }

  /**
   * 鯱（しゃちほこ）。
   *
   * 天主 30m に対して鯱は 1.7m ほど。画面上では 15px 程度にしかならないので、
   * **効くのはシルエットだけ**。頭を下に、尾を上へ反らせた輪郭が出れば足りる。
   * 胴は 1 本の管を反らせて絞ったもの、尾びれは板 2 枚。
   */
  function shachihoko(base: [number, number, number], yaw: number, scale: number) {
    const sh = A.shachi
    const h = sh.height * scale
    const back = sh.back * scale
    const rad = sh.radius * scale
    const fin = sh.fin * scale

    /** 胴の中心線。上へ行きながら後ろへ反る */
    const center = (t: number): [number, number] => [h * t, back * t * t]
    /** 胴の太さ。付け根から膨らみ、尾へ向けて絞る */
    const radiusAt = (t: number) => rad * Math.sin(Math.PI * (0.13 + 0.74 * t))

    const xf = new THREE.Matrix4().compose(
      new THREE.Vector3(u(base[0]), u(base[1]), u(base[2])),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)),
      new THREE.Vector3(1, 1, 1)
    )

    const body = parametricSurface(sh.segRad, sh.seg, (ru, rv, pos, tx) => {
      const [cy, cz] = center(rv)
      const d = 0.02
      const [y1, z1] = center(Math.min(1, rv + d))
      const [y0, z0] = center(Math.max(0, rv - d))
      // 断面は接線に直交する面。X 軸と、YZ 面内の直交ベクトルで張る
      const len = Math.hypot(y1 - y0, z1 - z0) || 1
      const ty = (y1 - y0) / len
      const tz = (z1 - z0) / len
      const rr = radiusAt(rv)
      const th = Math.PI * 2 * ru
      pos.set(
        u(Math.cos(th) * rr),
        u(cy + Math.sin(th) * rr * -tz),
        u(cz + Math.sin(th) * rr * ty)
      )
      tx.set(ru, rv * 2)
    })
    body.applyMatrix4(xf)
    body.computeVertexNormals()
    addClad(body, "gold", base[1] + h * 0.5)

    // 尾びれ。左右に開いた板 2 枚
    const [ty, tz] = center(1)
    for (const sx of [-1, 1]) {
      const pts = [
        new THREE.Vector3(0, u(ty - h * 0.14), u(tz - back * 0.1)),
        new THREE.Vector3(u(sx * fin * 0.55), u(ty + h * 0.16), u(tz + back * 0.35)),
        new THREE.Vector3(0, u(ty + h * 0.2), u(tz + back * 0.05)),
      ]
      const ax = slopeAxes(faceNormal(pts[0], pts[1], pts[2]))
      const g = planarPolygon(pts, ax.u, ax.v, u(TILE.plaster), u(TILE.plaster))
      g.applyMatrix4(xf)
      g.computeVertexNormals()
      addClad(g, "gold", base[1] + h)
    }
  }

  // --- 大屋根（入母屋）---
  //
  // 破風の位置は**計算で出す**。隅棟が平面上で 45 度にならないと
  // 4 つの面が繋がらず、屋根が捻れる。
  // 「軒の高さ・棟の高さ・勾配」から破風の下がりが一意に決まる。
  //
  // 反りは面ごとに別々に掛けてはいけない。隅棟の両側で段差ができる。
  // **媒介変数を「棟からの割合」に揃える**ことで、どの面でも同じ式が
  // 同じ値を返すようにしてある。
  {
    const r = A.roof
    const cosA = Math.cos(Math.atan(r.slope))
    const deck = r.rafterD / cosA
    const gableDrop = RIDGE_UNDER - EAVE_Y - r.slope * (EAVE_ZN - RIDGE_ZN)
    const gableW = gableDrop / r.slope
    const ry = RIDGE_UNDER + deck
    const ey = EAVE_Y + deck
    const curl = curlOf(r.curlRise, r.curlPower, r.cornerRise)
    const tu = u(TILE.kawaraU)
    const tv = u(TILE.kawaraV)

    // --- 平（ひら）側の 2 面 ---
    for (const sx of [-1, 1]) {
      const at = (pu: number, pv: number): [number, number, number] => {
        const x = pv * EAVE_X
        // 破風より外では、隅棟に沿って幅が広がる
        const t = x <= gableW ? 0 : (x - gableW) / (EAVE_X - gableW)
        const zs = RIDGE_ZS + t * (EAVE_ZS - RIDGE_ZS)
        const zn = RIDGE_ZN + t * (EAVE_ZN - RIDGE_ZN)
        const corner = Math.abs(pu * 2 - 1)
        return [sx * x, ry - x * r.slope + curl(pv, corner), zs + pu * (zn - zs)]
      }
      curvedRoof(r.segU, r.segV, (ry + ey) / 2, (pu, pv, pos, tx) => {
        const [x, y, z] = at(pu, pv)
        pos.set(u(x), u(y), u(z))
        tx.set(u(z) / tu, u((pv * EAVE_X) / cosA) / tv)
      })
      kawaraRolls(at, EAVE_ZN - EAVE_ZS, (ry + ey) / 2, r.segV)
    }

    // --- 妻（つま）側の 2 面。破風の下の寄棟部分 ---
    for (const [rz, ez] of [
      [RIDGE_ZN, EAVE_ZN],
      [RIDGE_ZS, EAVE_ZS],
    ]) {
      const at = (pu: number, pv: number): [number, number, number] => {
        const xh = gableW + pv * (EAVE_X - gableW)
        const corner = Math.abs(pu * 2 - 1)
        // 反りの引数は**棟からの割合**。平側と同じ式に揃えて隅棟で繋ぐ
        const vGlobal = xh / EAVE_X
        return [
          -xh + pu * 2 * xh,
          ry - xh * r.slope + curl(vGlobal, corner),
          rz + pv * (ez - rz),
        ]
      }
      curvedRoof(r.segU, r.segV, (ry + ey) / 2, (pu, pv, pos, tx) => {
        const [x, y, z] = at(pu, pv)
        const xh = gableW + pv * (EAVE_X - gableW)
        pos.set(u(x), u(y), u(z))
        tx.set(u(x) / tu, u(xh / cosA) / tv)
      })
      kawaraRolls(at, 2 * EAVE_X, (ry + ey) / 2, r.segV)

      // 破風の中の妻壁。反りを掛けた屋根面と頂点を共有させる
      const gy = ry - gableW * r.slope + curl(gableW / EAVE_X, 1)
      const A: [number, number, number] = [0, ry, rz]
      const L: [number, number, number] = [gableW, gy, rz]
      const R: [number, number, number] = [-gableW, gy, rz]
      surface([A, L, R], "plaster", ...wallUV)
      gableTrim(A, L, R, 430, 1500)

      // 大棟の端に鯱。頭を下に、尾を外へ反らせる
      shachihoko([0, ry - 120, rz], rz > 0 ? 0 : Math.PI, 1)
    }
  }

  /**
   * 千鳥破風。屋根の斜面に載る、三角の出窓。
   *
   * **城の silhouette の半分はこれが作っている。**
   * 軒が水平に伸びるだけの屋根は、どれだけ反らせても蔵か寺に見える。
   * 破風が屋根の面を断ち切ることで、初めて城の顔になる。
   *
   * @param at        屋根面上の点を返す関数（mm）。pu が軒と平行、pv が棟→軒
   * @param center    取り付け位置（pu）
   * @param halfWidth 幅の半分（pu 単位）
   * @param pvBack    棟側でどこまで食い込むか（pv）
   * @param rise      頂点の持ち上げ（mm）
   */
  function chidoriHafu(
    at: (pu: number, pv: number) => [number, number, number],
    center: number,
    halfWidth: number,
    pvBack: number,
    rise: number
  ) {
    const L = at(center - halfWidth, 1)
    const R = at(center + halfWidth, 1)
    const B = at(center, pvBack)
    const E = at(center, 1)
    const A: [number, number, number] = [
      (L[0] + R[0]) / 2,
      E[1] + rise,
      (L[2] + R[2]) / 2,
    ]
    // 妻（白漆喰）と、その両側に下る 2 枚の屋根
    surface([A, L, R], "plaster", ...wallUV)
    surface([A, L, B], "kawara", ...roofUV)
    surface([A, B, R], "kawara", ...roofUV)
    // 縁を板で締め、頂点から懸魚を下げる
    gableTrim(A, L, R, 240, rise * 0.42)
  }

  /**
   * 唐破風（からはふ）。
   *
   * 千鳥破風が直線の三角なのに対し、こちらは**うねる曲線**の破風。
   * 中央が高く持ち上がり、いったん下がって、両端でまた跳ね上がる。
   * 直線の破風と並ぶと表情が一気に増えるので、正面の中央に置く。
   *
   * 曲線は 2 項の足し算。中央の山（cos）＋ 両端の跳ね（|t| の高次）。
   * 足すだけで「高い中央 → 落ち込み → 端で跳ね上がり」の S 字になる。
   */
  function karaHafu(
    at: (pu: number, pv: number) => [number, number, number],
    center: number,
    halfWidth: number,
    pvBack: number,
    scale: number
  ) {
    const K = A.kara
    /** t は -1..1。破風の輪郭が持ち上がる量 */
    const ogee = (t: number) =>
      (K.rise * Math.pow(Math.cos((Math.PI * t) / 2), K.power) +
        K.flick * Math.pow(Math.abs(t), 3.5)) *
      scale

    // 棟にあたる短い線。1 点に集めると円錐になってしまう
    const bL = at(center - halfWidth * 0.3, pvBack)
    const bR = at(center + halfWidth * 0.3, pvBack)
    const lerp3 = (a: number[], b: number[], f: number): [number, number, number] => [
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f,
    ]
    /** 前縁（軒先）の点。ここが唐破風の輪郭になる */
    const front = (t: number): [number, number, number] => {
      const f = at(center + t * halfWidth, 1)
      return [f[0], f[1] + ogee(t), f[2]]
    }

    // --- 屋根面 ---
    const yMm = (bL[1] + front(0)[1]) / 2
    addClad(
      parametricSurface(K.segU, K.segV, (pu, pv, pos, tx) => {
        const t = pu * 2 - 1
        const b = lerp3(bL, bR, pu)
        const f = front(t)
        // 高さだけ緩く立ち上げる。軒先で勾配が緩むのは大屋根と同じ理屈
        pos.set(
          u(b[0] + (f[0] - b[0]) * pv),
          u(b[1] + (f[1] - b[1]) * Math.pow(pv, 1.4)),
          u(b[2] + (f[2] - b[2]) * pv)
        )
        tx.set((pu * halfWidth * 2) / TILE.kawaraU, (pv * 3000) / TILE.kawaraV)
      }),
      "kawara",
      yMm
    )

    // --- 破風の面。前縁の曲線と、その下の直線とで挟む ---
    const drop = K.rise * scale * 0.55
    addClad(
      parametricSurface(K.segU, 2, (pu, pv, pos, tx) => {
        const t = pu * 2 - 1
        const f = front(t)
        const base = at(center + t * halfWidth, 1)[1] - drop
        pos.set(u(f[0]), u(base + (f[1] - base) * pv), u(f[2]))
        tx.set((pu * halfWidth * 2) / TILE.plaster, pv)
      }),
      "plaster",
      yMm
    )

    // --- 破風板。曲線を短い板で追う ---
    // 前へわずかに出さないと、屋根面と同じ位置に来て見えなくなる
    const mid = lerp3(bL, bR, 0.5)
    const f0 = front(0)
    const ox = f0[0] - mid[0]
    const oz = f0[2] - mid[2]
    const olen = Math.hypot(ox, oz) || 1
    const off = new THREE.Vector3(
      u((ox / olen) * K.boardW * 0.7),
      0,
      u((oz / olen) * K.boardW * 0.7)
    )
    for (let i = 0; i < K.boardSteps; i++) {
      const t0 = (i / K.boardSteps) * 2 - 1
      const t1 = ((i + 1) / K.boardSteps) * 2 - 1
      boardBetween(front(t0), front(t1), K.boardW, K.boardW * 0.8, "plaster", off)
    }

    // --- 懸魚 ---
    const apex = front(0)
    gableTrim(
      apex,
      [apex[0] + 1, apex[1] - 1, apex[2]],
      [apex[0] - 1, apex[1] - 1, apex[2]],
      1,
      K.rise * scale * 0.55
    )
  }

  // --- 腰屋根 ---
  {
    const sk = A.skirt
    const cosA = Math.cos(Math.atan(A.roof.slope))
    const deck = sk.rafterD / cosA
    const drop = sk.out * A.roof.slope
    const ex = OMO_X + sk.out
    const ezs = OMO_ZS - sk.out
    const ezn = OMO_ZN + sk.out
    const curl = curlOf(sk.curlRise, sk.curlPower, sk.cornerRise)
    const tu = u(TILE.kawaraU)
    const tv = u(TILE.kawaraV)

    for (const key of sk.levels) {
      const wy = A.floor[key] + deck

      /** 面の点を返す関数を先に作り、曲面と破風の両方から使う */
      const makeFace = (
        /** 面の向き。1 = +X / -1 = -X / 2 = +Z / -2 = -Z */
        dir: number
      ) => (pu: number, pv: number): [number, number, number] => {
        const corner = Math.abs(pu * 2 - 1)
        const y = wy - pv * drop + curl(pv, corner)
        if (Math.abs(dir) === 1) {
          const sx = dir
          const zs = OMO_ZS + pv * (ezs - OMO_ZS)
          const zn = OMO_ZN + pv * (ezn - OMO_ZN)
          return [sx * (OMO_X + pv * sk.out), y, zs + pu * (zn - zs)]
        }
        const wz = dir > 0 ? OMO_ZN : OMO_ZS
        const ez = dir > 0 ? ezn : ezs
        const xh = OMO_X + pv * sk.out
        return [-xh + pu * 2 * xh, y, wz + pv * (ez - wz)]
      }

      for (const dir of [1, -1, 2, -2]) {
        const at = makeFace(dir)
        const alongZ = Math.abs(dir) === 1
        curvedRoof(sk.segU, sk.segV, wy - drop / 2, (pu, pv, pos, tx) => {
          const [x, y, z] = at(pu, pv)
          pos.set(u(x), u(y), u(z))
          tx.set(u(alongZ ? z : x) / tu, u((pv * sk.out) / cosA) / tv)
        })

        kawaraRolls(
          at,
          alongZ ? ezn - ezs : 2 * ex,
          wy - drop / 2,
          sk.segV
        )

        // 破風。長手（東西に長い面）には千鳥破風を 2 つ。
        // **妻側の中央は唐破風**にする。直線の三角ばかりだと表情が単調になる
        if (alongZ) {
          for (const c of [0.3, 0.7]) {
            chidoriHafu(at, c, 0.11, 0.05, sk.curlRise * 2.4)
          }
        } else {
          karaHafu(at, 0.5, 0.2, 0.12, key === "l3" ? 1 : 0.82)
        }
      }
    }
  }

  // --- 壁（真壁）---
  //
  // 各重を上下 2 枚に割って、間に帯を空ける。連子窓の帯にあたる。
  // 全面を塞ぐと、せっかくの吹き抜けも心柱も完全に見えなくなる。
  {
    const T = 130
    const wallBox = (
      size: [number, number, number],
      at: [number, number, number],
      kind: CladKind = "plaster"
    ) => {
      const geo = new THREE.BoxGeometry(u(size[0]), u(size[1]), u(size[2]))
      geo.translate(u(at[0]), u(at[1]), u(at[2]))
      boxUv(geo, u(TILE.plaster))
      addClad(geo, kind, at[1])
    }

    for (const [b0, b1] of [
      [A.floor.l2, A.floor.l3],
      [A.floor.l3, A.floor.l4],
      [A.floor.l4, A.floor.l5],
    ]) {
      const h = b1 - b0
      for (const [s0, s1] of [
        [b0, b0 + h * 0.56],
        [b0 + h * 0.74, b1],
      ]) {
        const hh = s1 - s0
        const cy = (s0 + s1) / 2
        for (const sx of [-1, 1]) {
          wallBox([T, hh, OMO_ZN - OMO_ZS], [sx * OMO_X, cy, OMO_ZC])
        }
        for (const z of [OMO_ZS, OMO_ZN]) {
          wallBox([2 * OMO_X - T, hh, T], [0, cy, z])
        }
      }
    }
  }

  // --- 連子窓と障子 ---
  //
  // 壁の上下の間に空けた帯を、**外に連子、内に障子**で閉じる。
  // 灯が入る前は月明かりに白く浮き、完成の瞬間に内側から灯る（setProgress）。
  // 障子は階ごとに別のマテリアルにしてある。**下の重から順に灯す**ため。
  const shojiTex = drawShojiTexture()
  textureClones.push(shojiTex)
  const glowFloors: Array<{ mat: THREE.MeshStandardMaterial; level: number }> = []
  {
    const bandFloors: Array<[number, number]> = [
      [A.floor.l2, A.floor.l3],
      [A.floor.l3, A.floor.l4],
      [A.floor.l4, A.floor.l5],
    ]
    const box = (size: [number, number, number], at: [number, number, number], tile: number) => {
      const geo = new THREE.BoxGeometry(u(size[0]), u(size[1]), u(size[2]))
      geo.translate(u(at[0]), u(at[1]), u(at[2]))
      boxUv(geo, u(tile))
      return geo
    }
    const G = GLOW
    const lenZ = OMO_ZN - OMO_ZS
    const lenX = 2 * OMO_X

    for (const [b0, b1] of bandFloors) {
      const h = b1 - b0
      const s0 = b0 + h * 0.56
      const s1 = b0 + h * 0.74
      const bh = s1 - s0
      const cy = (s0 + s1) / 2

      // 障子。壁の面から少し奥に引いて、連子との間に奥行きを作る
      const paper: THREE.BufferGeometry[] = []
      for (const sx of [-1, 1]) {
        paper.push(box([20, bh, lenZ - 2 * G.inset], [sx * (OMO_X - G.inset), cy, OMO_ZC], G.kumikoV))
      }
      paper.push(box([lenX - 2 * G.inset, bh, 20], [0, cy, OMO_ZS + G.inset], G.kumikoV))
      paper.push(box([lenX - 2 * G.inset, bh, 20], [0, cy, OMO_ZN - G.inset], G.kumikoV))
      const merged = mergeGeometries(paper)
      for (const g of paper) g.dispose()
      geometries.push(merged)

      const mat = new THREE.MeshStandardMaterial({
        map: shojiTex,
        emissiveMap: shojiTex,
        color: G.paper,
        emissive: G.color,
        emissiveIntensity: 0,
        roughness: 0.92,
        metalness: 0,
        envMapIntensity: ENV_INTENSITY,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      })
      materials.push(mat)
      const mesh = new THREE.Mesh(merged, mat)
      mesh.receiveShadow = true
      root.add(mesh)
      // 塗り上げと同じ段で現れる。不透明度の扱いは壁と同じ手順に乗せる
      clads.push({ mesh, group: cladGroup(cy) })
      glowFloors.push({ mat, level: 0 })

      // 連子。壁の芯に縦桟を等間隔に立てる
      const nZ = Math.floor(lenZ / G.renjiPitch)
      for (const sx of [-1, 1]) {
        for (let i = 1; i < nZ; i++) {
          const z = OMO_ZS + (lenZ * i) / nZ
          addClad(box([G.renjiD, bh, G.renjiW], [sx * OMO_X, cy, z], 1600), "renji", cy)
        }
      }
      const nX = Math.floor(lenX / G.renjiPitch)
      for (const z of [OMO_ZS, OMO_ZN]) {
        for (let i = 1; i < nX; i++) {
          const x = -OMO_X + (lenX * i) / nX
          addClad(box([G.renjiW, bh, G.renjiD], [x, cy, z], 1600), "renji", cy)
        }
      }
      // 敷居と鴨居。帯の上下を横木で締める
      for (const y of [s0 + 35, s1 - 35]) {
        for (const sx of [-1, 1]) addClad(box([110, 70, lenZ], [sx * OMO_X, y, OMO_ZC], 1600), "renji", cy)
        for (const z of [OMO_ZS, OMO_ZN]) addClad(box([lenX, 70, 110], [0, y, z], 1600), "renji", cy)
      }
    }
  }

  // 中の灯が外へ漏れる光（点光源）は**置かない**。
  // 試したが、近くの点光源が金の軒瓦の先端に鋭い照り返しを作り、軒先が
  // 電飾のように光った。狙った軒裏の暖かさはほとんど見えず、害のほうが大きい

  // --- 六重目（八角）: 朱塗りの壁と屋根 ---
  {
    const o = A.octa
    const top = o.floorY + o.height
    const apex = top + o.apexRise
    const eaveR = o.radius + o.eaveOut
    const eaveY = top - o.eaveDrop
    const octaCurl = curlOf(o.curlRise, o.curlPower, o.cornerRise)
    const octaSlope = Math.hypot(eaveR, apex - eaveY)
    const at = (ang: number, rr: number, yy: number): [number, number, number] => [
      Math.sin(ang) * rr,
      yy,
      Math.cos(ang) * rr,
    ]

    for (let i = 0; i < 8; i++) {
      const a0 = (Math.PI / 8) * (2 * i + 1)
      const a1 = a0 + Math.PI / 4
      surface(
        [at(a0, o.radius, o.floorY), at(a1, o.radius, o.floorY), at(a1, o.radius, top), at(a0, o.radius, top)],
        "vermilion",
        ...wallUV
      )
      // 屋根。頂点から軒先へ。反りは大屋根と同じ式
      const roofAt = (pu: number, pv: number): [number, number, number] => {
        const ang = a0 + pu * (a1 - a0)
        const rr = pv * eaveR
        const corner = Math.abs(pu * 2 - 1)
        return [
          Math.sin(ang) * rr,
          apex - pv * (apex - eaveY) + octaCurl(pv, corner),
          Math.cos(ang) * rr,
        ]
      }
      curvedRoof(o.seg, o.seg, (apex + eaveY) / 2, (pu, pv, pos, tx) => {
        const [x, y, z] = roofAt(pu, pv)
        pos.set(u(x), u(y), u(z))
        tx.set(u(pu * (a1 - a0) * eaveR) / u(TILE.kawaraU), u(pv * octaSlope) / u(TILE.kawaraV))
      })
      kawaraRolls(roofAt, 2 * eaveR * Math.sin(Math.PI / 8), (apex + eaveY) / 2, 5)
    }
  }

  // --- 七重目（四角）: 金の壁と宝形屋根 ---
  {
    const t = A.top
    const top = t.floorY + t.height
    const apex = top + t.roofRise
    const eh = t.half + t.eaveOut
    const eaveY = top - t.eaveDrop
    const topCurl = curlOf(t.curlRise, t.curlPower, t.cornerRise)
    const topSlope = Math.hypot(eh, apex - eaveY)
    const c: Array<[number, number]> = [
      [-t.half, -t.half],
      [t.half, -t.half],
      [t.half, t.half],
      [-t.half, t.half],
    ]
    const e: Array<[number, number]> = [
      [-eh, -eh],
      [eh, -eh],
      [eh, eh],
      [-eh, eh],
    ]
    for (let i = 0; i < 4; i++) {
      const [cx, cz] = c[i]
      const [nx, nz] = c[(i + 1) % 4]
      surface(
        [[cx, t.floorY, cz], [nx, t.floorY, nz], [nx, top, nz], [cx, top, cz]],
        "gold",
        ...wallUV
      )
      // 宝形屋根。4 面とも頂点へ集まる
      const [ax, az] = e[i]
      const [bx, bz] = e[(i + 1) % 4]
      const edge = Math.hypot(bx - ax, bz - az)
      const roofAt = (pu: number, pv: number): [number, number, number] => {
        const exx = ax + pu * (bx - ax)
        const ezz = az + pu * (bz - az)
        const corner = Math.abs(pu * 2 - 1)
        return [pv * exx, apex - pv * (apex - eaveY) + topCurl(pv, corner), pv * ezz]
      }
      curvedRoof(t.seg, t.seg, (apex + eaveY) / 2, (pu, pv, pos, tx) => {
        const [x, y, z] = roofAt(pu, pv)
        pos.set(u(x), u(y), u(z))
        tx.set(u(pu * edge) / u(TILE.kawaraU), u(pv * topSlope) / u(TILE.kawaraV))
      })
      kawaraRolls(roofAt, edge, (apex + eaveY) / 2, 5)
    }

    // 最上階の頂に鯱を 1 対。参考画像で一番目を引くのがここ
    for (const sz of [-1, 1]) {
      shachihoko([0, apex - t.roofRise * 0.1, sz * t.half * 0.32], sz > 0 ? 0 : Math.PI, 0.72)
    }
  }

  // --- 高欄（七重目のまわりの回縁）---
  //
  // 最上階をぐるりと回る手すり。参考画像で一番目を引くのがここで、
  // **建物の一番上に水平の線が一本通る**ことで、天主の輪郭が引き締まる。
  {
    const t = A.top
    const deckY = t.floorY - 260
    const oh = t.half + t.railOut
    const rail = t.railHeight

    const corner = (i: number): [number, number] => {
      const sx = i === 1 || i === 2 ? 1 : -1
      const sz = i >= 2 ? 1 : -1
      return [sx * oh, sz * oh]
    }

    for (let i = 0; i < 4; i++) {
      const [cx, cz] = corner(i)
      const [nx, nz] = corner((i + 1) % 4)

      // 回縁の床。内側の柱位置から外へ張り出す
      const ix = (cx / oh) * t.half
      const iz = (cz / oh) * t.half
      const jx = (nx / oh) * t.half
      const jz = (nz / oh) * t.half
      surface(
        [
          [ix, deckY, iz],
          [jx, deckY, jz],
          [nx, deckY, nz],
          [cx, deckY, cz],
        ],
        "gold",
        ...wallUV
      )

      // 手すり 2 段
      for (const hy of [rail, rail * 0.52]) {
        boardBetween(
          [cx, deckY + hy, cz],
          [nx, deckY + hy, nz],
          t.railBar,
          t.railBar,
          "gold"
        )
      }

      // 束（つか）。等間隔に立てる
      const len = Math.hypot(nx - cx, nz - cz)
      const n = Math.max(2, Math.round(len / t.railPitch))
      for (let k = 0; k <= n; k++) {
        const f = k / n
        const px = cx + (nx - cx) * f
        const pz = cz + (nz - cz) * f
        boardBetween(
          [px, deckY, pz],
          [px, deckY + rail, pz],
          t.railBar * 0.8,
          t.railBar * 0.8,
          "gold"
        )
      }
    }
  }

  // --- 仕上げの面をまとめる ---
  // ここまでに溜めた面を、材ごとに 1 枚のジオメトリへ繋ぐ。
  // 面の数は数百あるが、描くのは最大 16 本で済む。
  for (const b of cladBuckets.values()) {
    const merged = mergeGeometries(b.geos)
    for (const g of b.geos) g.dispose()
    geometries.push(merged)
    const mesh = new THREE.Mesh(merged, cladMaterial(b.group, b.kind))
    mesh.receiveShadow = true
    root.add(mesh)
    clads.push({ mesh, group: b.group })
  }

  // ===========================================================================
  // 進行度を姿勢に落とす
  // ===========================================================================

  function setProgress(raw: number) {
    // 建て方は BUILD_END で終わる。そこから先は完成した天主を見る時間なので、
    // **段取りの物差しだけ引き伸ばす**。TIMING の数値は触らずに済む
    const p = Math.min(1, raw / BUILD_END)

    for (const m of members) {
      const local = clamp01((p - m.delay) / Math.max(m.span, 1e-4))

      // 姿勢は早めに決める。置く動作の前に材の向きが定まっているほうが自然
      const rotT = easeOutQuart(clamp01(local / 0.4))
      m.object.quaternion.slerpQuaternions(m.scatterQuat, m.homeQuat, rotT)

      if (m.approach === "dropSlide") {
        // 2 段。まず落ちて高さを合わせ、それから横に寄せて噛み合わせる
        if (local < DROP_RATIO) {
          const t = easeOutQuart(local / DROP_RATIO)
          _v.set(m.scatter.x, m.scatter.y * (1 - t), m.scatter.z)
        } else {
          const t = easeInOut((local - DROP_RATIO) / (1 - DROP_RATIO))
          _v.set(m.scatter.x * (1 - t), 0, m.scatter.z * (1 - t))
        }
      } else if (m.approach === "drive") {
        _v.copy(m.scatter).multiplyScalar(1 - easeHammer(local))
      } else if (m.approach === "thread") {
        _v.copy(m.scatter).multiplyScalar(1 - easeInOut(local))
      } else {
        const t = easeOutQuart(local)
        _v.copy(m.scatter).multiplyScalar(1 - t)
        _v.addScaledVector(m.arc, Math.sin(Math.PI * t))
      }

      m.object.position.copy(m.home).add(_v)

      // 出番が来るまでは描かない。**これが一番効く省力化**。
      // 進行度 0.5 の時点では 7 割の部材がまだ出ていないので、
      // ドローコールも影の描画もそのぶん丸ごと消える。
      m.object.visible = p >= m.showAt
    }

    for (const b of banks) b.setProgress(p)

    // 塗り上げ。段ごとに下から不透明度を上げる
    for (const c of clads) {
      const o = clamp01((p - CLAD.groups[c.group]) / CLAD.fade)
      const m = c.mesh.material as THREE.MeshStandardMaterial
      m.opacity = o

      // **塗り終わったら不透明に戻す。**
      // 半透明のままだと毎フレーム合成され、奥のものも塗られてしまう
      // （フィルレートがこの場面の主な負荷なので、ここが効く）。
      const wantTransparent = o < 1
      if (m.transparent !== wantTransparent) {
        m.transparent = wantTransparent
        m.needsUpdate = true
      }

      c.mesh.visible = o > 0.01
      // 半透明のうちに影を落とすと、**まだ薄いのに濃い影だけ出る**。
      // 塗り上がってから影を持たせる
      c.mesh.castShadow = o > 0.6
    }

    // 灯。**生の進行度**で決める（塗り上がりの後、完成を見る時間の頭でともる）。
    // 下の重から順に。ゆらぎは updateGlow が毎フレーム掛ける
    for (let k = 0; k < glowFloors.length; k++) {
      const start = IGNITE.floorStart + k * IGNITE.floorStep
      glowFloors[k].level = smooth01(start, start + IGNITE.floorRamp, raw)
    }
    updateGlow(0)
  }

  /** 灯のゆらぎ。障子の明るさの上限（level）に掛ける */
  function updateGlow(t: number) {
    for (let k = 0; k < glowFloors.length; k++) {
      const f = glowFloors[k]
      if (f.level <= 0) {
        f.mat.emissiveIntensity = 0
        continue
      }
      // 周期の違う 2 本を重ねて、規則的な点滅に見えないようにする
      const n = 0.6 * Math.sin(t * 7.3 + k * 1.7) + 0.4 * Math.sin(t * 13.1 + k * 4.2)
      f.mat.emissiveIntensity = GLOW.intensity * f.level * (1 + GLOW.flicker * n)
    }
  }

  setProgress(0)

  return {
    group: root,
    setProgress,
    updateGlow,
    dispose() {
      for (const g of geometries) g.dispose()
      for (const m of materials) m.dispose()
      for (const t of textureClones) t.dispose()
      for (const b of banks) b.dispose()
      root.clear()
    },
  }
}
