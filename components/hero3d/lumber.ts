import * as THREE from "three"

import { u } from "./constants"

/**
 * 「木材」を作る層。継手にも小屋にも共通で使う。
 *
 * ここが受け持つのは 2 つだけ。
 *   1. 箱から部材を作り、**木目が正しい向きに走る**よう UV を振り直す
 *   2. BoxGeometry の 6 面のうち、木口（長手の両端）だけ年輪のテクスチャにする
 *
 * 木目の向きは部材ごとに違う。柱は縦、梁は横。
 * 同じ貼り方をすると柱の木目が横に走って、一目で嘘だと分かる。
 */

/** 部材の長手方向 */
export type Grain = "x" | "y" | "z"

const AXIS: Record<Grain, 0 | 1 | 2> = { x: 0, y: 1, z: 2 }

/** 木目 1 枚ぶんの長さ（3D 単位）。小さくすると木目が細かくなる */
const TILE = 1.6

/** 木口の年輪の中心をわずかにずらす。ど真ん中だと製材品として不自然 */
const PITH_OFFSET: [number, number] = [0.07, -0.05]

/** ミリで書いた箱。位置も寸法もすべて部材ローカルのミリ */
export type BoxMm = {
  size: [number, number, number]
  at: [number, number, number]
}

/**
 * 面ごとに UV を振り直す。
 *
 * BoxGeometry の既定 UV は面ごとに 0〜1 なので、長い梁も小さい栓も
 * テクスチャが 1 枚まるごと貼られ、木目のスケールがバラバラになる。
 * **部材ローカル座標から UV を作れば、箱をまたいで木目が続く**。
 *
 *   長手の両端（木口） … 断面いっぱいに年輪を 1 枚
 *   それ以外（側面）   … 木目が長手方向に走るよう V 軸を長手に当てる
 *
 * @param section 断面の代表寸法（3D 単位）。年輪を正円に保つため、
 *                断面が正方形でない部材でも**長いほうの辺**を使う。
 */
function applyWoodUv(geo: THREE.BufferGeometry, grain: Grain, section: number) {
  const g = AXIS[grain]
  const pos = geo.attributes.position
  const nor = geo.attributes.normal
  const uv = geo.attributes.uv as THREE.BufferAttribute

  const p: [number, number, number] = [0, 0, 0]
  const n: [number, number, number] = [0, 0, 0]

  for (let i = 0; i < pos.count; i++) {
    p[0] = pos.getX(i)
    p[1] = pos.getY(i)
    p[2] = pos.getZ(i)
    n[0] = Math.abs(nor.getX(i))
    n[1] = Math.abs(nor.getY(i))
    n[2] = Math.abs(nor.getZ(i))

    // どの面か＝法線が一番大きい軸
    let face: 0 | 1 | 2 = 0
    if (n[1] > n[face]) face = 1
    if (n[2] > n[face]) face = 2

    if (face === g) {
      // 木口。長手以外の 2 軸で年輪を貼る
      const a = (g + 1) % 3
      const b = (g + 2) % 3
      uv.setXY(i, p[a] / section + 0.5 + PITH_OFFSET[0], p[b] / section + 0.5 + PITH_OFFSET[1])
    } else {
      // 側面。長手でも法線方向でもない軸を U に、長手を V に当てる
      const k = 3 - face - g
      uv.setXY(i, p[k] / TILE, p[g] / TILE)
    }
  }
  uv.needsUpdate = true
}

/**
 * BoxGeometry のマテリアル配列の並びは **+X, -X, +Y, -Y, +Z, -Z**。
 * 長手の両端だけ木口のマテリアルに差し替える。
 */
export function faceMaterials(
  grain: Grain,
  side: THREE.Material,
  end: THREE.Material
): THREE.Material[] {
  const g = AXIS[grain]
  return [0, 1, 2, 3, 4, 5].map((i) => ((i >> 1) === g ? end : side))
}

/**
 * 1 部材を組み立てる。
 *
 * 位置はメッシュではなく**ジオメトリに焼く**。
 * こうすると position 属性が部材ローカル座標になり、複数の箱で 1 本の材を
 * 作ったときに木目が箱をまたいで繋がる（金輪継ぎの舌と目違いがこれで繋がる）。
 */
export function buildMember(
  boxes: BoxMm[],
  grain: Grain,
  materials: THREE.Material | THREE.Material[],
  sectionMm: number,
  sink: THREE.BufferGeometry[],
  /**
   * 影を落とすか。
   * **影の描画がこの場面の最大の負荷**（実測で全体の 9 割）なので、
   * 細物は落とさない。貫や垂木 1 本の影は、建物全体の影に埋もれて見えない。
   */
  castShadow = true
): THREE.Group {
  const group = new THREE.Group()
  const section = u(sectionMm)

  for (const b of boxes) {
    const geo = new THREE.BoxGeometry(u(b.size[0]), u(b.size[1]), u(b.size[2]))
    geo.translate(u(b.at[0]), u(b.at[1]), u(b.at[2]))
    applyWoodUv(geo, grain, section)
    sink.push(geo)

    const mesh = new THREE.Mesh(geo, materials)
    mesh.castShadow = castShadow
    mesh.receiveShadow = true
    group.add(mesh)
  }
  return group
}

/**
 * 垂木のような同形・多数の部材用。1 本ぶんのジオメトリを作って返す。
 * InstancedMesh に渡すので、木口の差し替えはしない（45mm 角の木口は見えない）。
 */
export function lumberGeometry(
  sizeMm: [number, number, number],
  grain: Grain,
  sectionMm: number
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(u(sizeMm[0]), u(sizeMm[1]), u(sizeMm[2]))
  applyWoodUv(geo, grain, u(sectionMm))
  return geo
}
