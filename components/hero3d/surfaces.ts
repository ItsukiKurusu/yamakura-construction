import * as THREE from "three"

/**
 * 面（屋根・壁）を作る層。
 *
 * 軸組は箱で足りるが、屋根は入母屋の**六角形の斜面**や八角錐など、
 * 箱では作れない形になる。ここでは平面の多角形を直接組み立てる。
 *
 * UV は**実寸から**割る。テクスチャ側の「1 タイルが何ミリか」と揃えておけば、
 * 大屋根でも小さな庇でも瓦の大きさが同じになる。
 * 面ごとに repeat を調整する方式だと、必ずどこかで瓦の大きさが狂う。
 */

/**
 * 平面上の凸多角形からジオメトリを作る。
 *
 * @param pts    多角形の頂点（3D 単位）。同一平面上・凸・順番どおりに並べること
 * @param uAxis  UV の U に対応する面内の方向（正規化済み）
 * @param vAxis  同じく V
 * @param uScale U 方向の 1 タイルの長さ（3D 単位）
 * @param vScale V 方向の 1 タイルの長さ（3D 単位）
 */
export function planarPolygon(
  pts: THREE.Vector3[],
  uAxis: THREE.Vector3,
  vAxis: THREE.Vector3,
  uScale: number,
  vScale: number
): THREE.BufferGeometry {
  const n = pts.length
  const position: number[] = []
  const uv: number[] = []

  const origin = pts[0]
  const d = new THREE.Vector3()

  // 凸なので、最初の頂点から扇状に割れば足りる
  for (let i = 1; i < n - 1; i++) {
    for (const p of [pts[0], pts[i], pts[i + 1]]) {
      position.push(p.x, p.y, p.z)
      d.subVectors(p, origin)
      uv.push(d.dot(uAxis) / uScale, d.dot(vAxis) / vScale)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(position, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2))
  geo.computeVertexNormals()
  return geo
}

/**
 * 傾いた屋根面のための軸を求める。
 *
 * U は水平（軒と平行）、V は最大傾斜の向き。
 * こうしておくと、瓦テクスチャの丸瓦が**必ず流れ方向に走る**。
 * 面の法線から機械的に決めるので、どの向きの屋根でも同じ関数で済む。
 */
export function slopeAxes(normal: THREE.Vector3) {
  const n = normal.clone().normalize()
  const up = new THREE.Vector3(0, 1, 0)
  // 水平で面内にある向き
  const u = new THREE.Vector3().crossVectors(up, n)
  if (u.lengthSq() < 1e-8) {
    // 真上を向いた面（水平）。どの向きでも同じなので適当に決める
    u.set(1, 0, 0)
  }
  u.normalize()
  const v = new THREE.Vector3().crossVectors(n, u).normalize()
  return { u, v }
}

/** 3 点から面の法線を出す（上向きに揃える） */
export function faceNormal(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
  const n = new THREE.Vector3()
    .subVectors(b, a)
    .cross(new THREE.Vector3().subVectors(c, a))
    .normalize()
  if (n.y < 0) n.negate()
  return n
}

/**
 * 箱の UV を実寸から振り直す。
 *
 * BoxGeometry の既定 UV は面ごとに 0〜1 なので、大きな壁も小さな壁も
 * 漆喰のむらが 1 枚まるごと貼られ、質感のスケールがばらばらになる。
 *
 * @param tile 1 タイルの長さ（3D 単位）
 */
export function boxUv(geo: THREE.BufferGeometry, tile: number) {
  const pos = geo.attributes.position
  const nor = geo.attributes.normal
  const uv = geo.attributes.uv as THREE.BufferAttribute

  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i))
    const ny = Math.abs(nor.getY(i))
    const nz = Math.abs(nor.getZ(i))
    const px = pos.getX(i)
    const py = pos.getY(i)
    const pz = pos.getZ(i)

    if (nx > ny && nx > nz) uv.setXY(i, pz / tile, py / tile)
    else if (ny > nz) uv.setXY(i, px / tile, pz / tile)
    else uv.setXY(i, px / tile, py / tile)
  }
  uv.needsUpdate = true
}

/**
 * 媒介変数で曲面を張る。屋根の**反り**のために要る。
 *
 * 日本建築の屋根は平面ではない。軒先に向かって勾配が緩み、さらに隅へ行くほど
 * 持ち上がる。この 2 つが silhouette を決めているので、平面の多角形では
 * どれだけ部材を足しても城の屋根に見えない。
 *
 * @param segU  軒と平行な方向の分割数
 * @param segV  流れ方向（棟 → 軒）の分割数
 * @param point (u, v) から位置と UV を書く。u, v はどちらも 0..1
 */
export function parametricSurface(
  segU: number,
  segV: number,
  point: (u: number, v: number, pos: THREE.Vector3, uv: THREE.Vector2) => void
): THREE.BufferGeometry {
  const nu = segU + 1
  const nv = segV + 1
  const position = new Float32Array(nu * nv * 3)
  const uvs = new Float32Array(nu * nv * 2)
  const index: number[] = []

  const p = new THREE.Vector3()
  const t = new THREE.Vector2()

  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      point(i / segU, j / segV, p, t)
      const k = j * nu + i
      position[k * 3] = p.x
      position[k * 3 + 1] = p.y
      position[k * 3 + 2] = p.z
      uvs[k * 2] = t.x
      uvs[k * 2 + 1] = t.y
    }
  }

  for (let j = 0; j < segV; j++) {
    for (let i = 0; i < segU; i++) {
      const a = j * nu + i
      const b = a + 1
      const c = a + nu
      const d = c + 1
      index.push(a, c, b, b, c, d)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(position, 3))
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))
  geo.setIndex(index)
  geo.computeVertexNormals()
  return geo
}

/**
 * 同じ材で描く面をひとつのジオメトリにまとめる。
 *
 * 仕上げ（屋根・壁・破風板・懸魚・高欄）は面の数が数百になるが、
 * **同じ段・同じ材なら色も不透明度も完全に同じ**なので、
 * 1 枚ずつメッシュにする理由がない。まとめればドローコールが 1 本で済む。
 *
 * 索引の有無が混ざるので、いったん全部を非索引に開いてから繋ぐ。
 * 頂点は増えるが、この規模では描画側で浮く時間のほうがはるかに大きい。
 */
export function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const flat = geos.map((g) => (g.index ? g.toNonIndexed() : g))

  let count = 0
  for (const g of flat) count += g.attributes.position.count

  const position = new Float32Array(count * 3)
  const normal = new Float32Array(count * 3)
  const uv = new Float32Array(count * 2)

  let v = 0
  for (const g of flat) {
    const p = g.attributes.position
    const n = g.attributes.normal
    const t = g.attributes.uv
    for (let i = 0; i < p.count; i++) {
      position[(v + i) * 3] = p.getX(i)
      position[(v + i) * 3 + 1] = p.getY(i)
      position[(v + i) * 3 + 2] = p.getZ(i)
      if (n) {
        normal[(v + i) * 3] = n.getX(i)
        normal[(v + i) * 3 + 1] = n.getY(i)
        normal[(v + i) * 3 + 2] = n.getZ(i)
      }
      if (t) {
        uv[(v + i) * 2] = t.getX(i)
        uv[(v + i) * 2 + 1] = t.getY(i)
      }
    }
    v += p.count
  }

  const out = new THREE.BufferGeometry()
  out.setAttribute("position", new THREE.BufferAttribute(position, 3))
  out.setAttribute("normal", new THREE.BufferAttribute(normal, 3))
  out.setAttribute("uv", new THREE.BufferAttribute(uv, 2))

  // 開いた分は捨てる（元の geos は呼び出し側が持っている）
  for (let i = 0; i < flat.length; i++) {
    if (flat[i] !== geos[i]) flat[i].dispose()
  }
  return out
}
