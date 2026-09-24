import * as THREE from "three"

import { FOREST, GROUND, TERRAIN, TILE, u } from "./constants"
import { forestCover } from "./forest"
import type { WoodTextures } from "./textures"

/**
 * 天主が載る山。
 *
 * ここまで地面は平らな板、遠くの山は平らな切り絵だった。
 * だが**安土城は山の上に建っている**。城が載る起伏そのものを作らないと、
 * どれだけ背景を足しても「平地に置いた模型」にしか見えない。
 *
 * 手法は THREE.Terrain（MIT）の考え方を参考にしている。
 * とくに `generateBlendedMaterial` の「**傾斜でテクスチャを混ぜる**」が肝で、
 * 急なところは岩、緩いところは土、と自動で振り分かる。
 * ライブラリは入れず、必要な手法だけ自前で書いた。
 *
 * 形は 3 段構え。
 *   1. 城の敷地  … 完全に平ら（石垣が浮いたり沈んだりしないように）
 *   2. 山頂の斜面… そこから落ちていく
 *   3. 遠くの尾根… リッジノイズで山なみを作る
 */

/** 岩肌に掛ける明るさ。石垣より暗く保たないと、天守台が地形に沈む */
// 0.82 では月に正面から照らされた手前の急斜面が明るく浮き、最後の構図で
// 視線が城から逸れた。夜の岩肌は暗くてよい
const ROCK_TINT = 0.66

// ---------------------------------------------------------------------------
// ノイズ
// ---------------------------------------------------------------------------

function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1274126177)
  h = (h ^ (h >>> 13)) >>> 0
  h = Math.imul(h, 1274126177) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** 値ノイズ。格子の値を smoothstep で補間するだけ */
function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const su = xf * xf * (3 - 2 * xf)
  const sv = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi, seed)
  const b = hash2(xi + 1, yi, seed)
  const c = hash2(xi, yi + 1, seed)
  const d = hash2(xi + 1, yi + 1, seed)
  return (a * (1 - su) + b * su) * (1 - sv) + (c * (1 - su) + d * su) * sv
}

/**
 * リッジノイズ。
 *
 * 素のノイズを重ねると丸い丘にしかならない。
 * **`1 - |n|` で折り返す**と谷が尖って稜線が立ち、山なみになる。
 * 山を作るときの定石。
 */
function ridged(x: number, y: number, seed: number, octaves: number): number {
  let sum = 0
  let norm = 0
  let amp = 1
  let freq = 1
  for (let i = 0; i < octaves; i++) {
    const n = valueNoise(x * freq, y * freq, seed + i * 101)
    const r = 1 - Math.abs(n * 2 - 1)
    sum += r * r * amp
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / Math.max(norm, 1e-6)
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// ---------------------------------------------------------------------------

export type TerrainHandle = {
  mesh: THREE.Mesh
  /** 任意の位置の地面の高さ（3D 単位）。地形の式そのもの */
  heightAt: (x: number, z: number) => number
  /**
   * **描かれているメッシュの面の高さ**（mesh の y オフセット込み）。
   * 格子の頂点の間は直線でつながっているので、鋭い尾根では式（heightAt）より
   * 低くなる。物を地面に置くときはこちらを使う（木が宙に浮かない）
   */
  surfaceAt: (x: number, z: number) => number
  dispose: () => void
}

export function createTerrain(tex: WoodTextures): TerrainHandle {
  const T = TERRAIN

  /**
   * 高さ。
   * 城の敷地の中だけは**必ず 0**にする。ここが揺れると石垣が浮く。
   */
  function heightAt(x: number, z: number): number {
    const r = Math.hypot(x, z)
    if (r <= T.padRadius) return 0

    // 山頂から下る斜面
    const t = smoothstep(T.padRadius, T.padRadius + T.slopeLength, r)
    const drop = -T.dropDepth * Math.pow(t, 1.35)

    // 敷地のすぐ外から効く細かい凹凸。
    // これが無いと、敷地から尾根までが滑らかな円錐になって盛り土に見える
    const nearMix = smoothstep(T.padRadius, T.padRadius + T.roughFade, r)
    const rough =
      (valueNoise(x / T.roughScale, z / T.roughScale, T.seed + 31) - 0.5) *
      2 *
      T.roughHeight *
      nearMix

    // 敷地と尾根のあいだの中スケールの起伏。
    // ここが抜けていると、城の足元から尾根までが一枚の斜面になって砂丘に見える。
    //
    // 効かせる量は**すでに地面が下がった深さ**に比例させる。半径で切ると、
    // 敷地のすぐ外で起伏が立ち上がり、手前の丘が天守台を隠してしまう。
    // 均された敷地から離れるほど自然の荒さが戻る、という順序にもかなう。
    const midMix = smoothstep(0, T.dropDepth * 0.35, -drop)
    const mid =
      (valueNoise(x / T.midScale, z / T.midScale, T.seed + 53) - 0.5) * 2 * T.midHeight * midMix

    // 遠くの尾根
    const far = smoothstep(T.ridgeStart, T.ridgeStart + T.ridgeFade, r)
    if (far <= 0) return drop + rough + mid

    const m = ridged(x / T.noiseScale, z / T.noiseScale, T.seed, T.octaves)
    // 低い周波数のうねりを足して、尾根の高さ自体に差をつける
    const swell = valueNoise(x / (T.noiseScale * 3.2), z / (T.noiseScale * 3.2), T.seed + 7)
    return drop + rough + mid + m * T.ridgeHeight * far * (0.45 + swell * 0.9)
  }

  // --- 極座標の格子で張る ---
  //
  // 四角い格子だと、カメラが回る中心付近が粗くなり、外周に頂点が余る。
  // 極座標にして半径を累乗で刻めば、**中心が密・外が粗い**格子が自然に得られる。
  const NA = T.angular
  const NR = T.radial
  const verts = (NR + 1) * NA
  const position = new Float32Array(verts * 3)
  const uv = new Float32Array(verts * 2)
  const slope = new Float32Array(verts)
  const forest = new Float32Array(verts)
  const index: number[] = []

  const EPS = 0.6
  const tile = u(TILE.ground)

  for (let j = 0; j <= NR; j++) {
    // 累乗で刻む。中心ほど細かい
    const rr = T.radius * Math.pow(j / NR, T.radialPower)
    for (let i = 0; i < NA; i++) {
      const a = (i / NA) * Math.PI * 2
      const x = Math.sin(a) * rr
      const z = Math.cos(a) * rr
      const y = heightAt(x, z)

      const k = j * NA + i
      position[k * 3] = x
      position[k * 3 + 1] = y
      position[k * 3 + 2] = z
      // UV は実寸から。地面の粒の大きさが場所で変わらない
      uv[k * 2] = x / tile
      uv[k * 2 + 1] = z / tile

      // 傾斜。差分で法線を出し、真上との角度を取る
      const hx = (heightAt(x + EPS, z) - heightAt(x - EPS, z)) / (2 * EPS)
      const hz = (heightAt(x, z + EPS) - heightAt(x, z - EPS)) / (2 * EPS)
      slope[k] = 1 - 1 / Math.sqrt(hx * hx + hz * hz + 1)
      // 森の濃さ。木の配置（forest.ts）と同じ関数で決め、林床を暗くするのに使う
      forest[k] = forestCover(x, z, Math.sqrt(hx * hx + hz * hz))
    }
  }

  for (let j = 0; j < NR; j++) {
    for (let i = 0; i < NA; i++) {
      const i2 = (i + 1) % NA
      const a = j * NA + i
      const b = j * NA + i2
      const c = (j + 1) * NA + i
      const d = (j + 1) * NA + i2
      index.push(a, c, b, b, c, d)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(position, 3))
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2))
  geo.setAttribute("aSlope", new THREE.BufferAttribute(slope, 1))
  geo.setAttribute("aForest", new THREE.BufferAttribute(forest, 1))
  geo.setIndex(index)
  geo.computeVertexNormals()

  // --- マテリアル ---
  for (const t of [tex.ground.map, tex.ground.normal, tex.ground.rough, tex.ground2.map]) {
    t.wrapS = THREE.RepeatWrapping
    t.wrapT = THREE.RepeatWrapping
  }

  const mat = new THREE.MeshStandardMaterial({
    map: tex.ground.map,
    normalMap: tex.ground.normal,
    roughnessMap: tex.ground.rough,
    color: GROUND.color,
    metalness: 0,
    normalScale: new THREE.Vector2(1.1, 1.1),
    envMapIntensity: 0.5,
  })

  /**
   * **傾斜でテクスチャを混ぜる**（THREE.Terrain の考え方）。
   *
   * 急なところは岩が露出し、緩いところには土が乗る。実際の山がそうなる。
   * 斑（まだら）で混ぜていた頃と違い、**地形の形と模様が一致する**のが大きい。
   *
   * 傾斜は頂点で計算して属性で渡す。フラグメントで法線が使えるのは
   * `map_fragment` より後なので、そこでは間に合わない。
   */
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRockMap = { value: tex.ground2.map }
    shader.uniforms.uRockScale = { value: TILE.ground / TILE.ground2 }
    shader.uniforms.uSlopeLo = { value: T.rockSlopeLo }
    shader.uniforms.uSlopeHi = { value: T.rockSlopeHi }
    shader.uniforms.uDetailNear = { value: T.detailNear }
    shader.uniforms.uDetailFar = { value: T.detailFar }
    shader.uniforms.uFarSoil = { value: new THREE.Color(T.farSoil) }
    shader.uniforms.uFarRock = { value: new THREE.Color(T.farRock) }
    shader.uniforms.uFarTint = { value: T.farTint }
    shader.uniforms.uForestFloor = { value: new THREE.Vector3(...FOREST.floor) }
    shader.uniforms.uFarRough = { value: T.farRoughness }

    shader.vertexShader =
      "attribute float aSlope;\nattribute float aForest;\nvarying float vSlope;\nvarying float vRadius;\nvarying float vForest;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n vSlope = aSlope;\n vForest = aForest;\n vRadius = length( transformed.xz );"
      )

    shader.fragmentShader =
      `uniform sampler2D uRockMap;
       uniform float uRockScale, uSlopeLo, uSlopeHi;
       uniform float uDetailNear, uDetailFar, uFarRough, uFarTint;
       uniform vec3 uFarSoil, uFarRock;
       varying float vSlope;
       varying float vRadius;
       varying float vForest;
       uniform vec3 uForestFloor;
      ` + shader.fragmentShader
        // 遠さを返す関数は `void main` の直前に差す。
        // 先頭に置くと、three が用意する varying の宣言より前に来る場合があり、
        // GLSL は前方参照を許さないのでその場でコンパイルが落ちる
        .replace(
          "void main() {",
          `/** 遠さ（0 = 敷地まわり・1 = 遠景の尾根）。城からの半径で決める */
           float terrainFar() {
             return smoothstep( uDetailNear, uDetailFar, vRadius );
           }

           void main() {`
        )
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>
           {
             float steep = smoothstep( uSlopeLo, uSlopeHi, vSlope );
             float fade = terrainFar();

             // 近景は写真そのまま、遠景は平らな一色。
             // **土か岩かの振り分けは遠近によらず傾斜で決める**ので、
             // 手前と奥で地質が入れ替わって見えることがない
             vec3 soil = mix( diffuseColor.rgb, uFarSoil * uFarTint, fade );
             vec3 rock = mix( texture2D( uRockMap, vMapUv * uRockScale ).rgb, uFarRock * uFarTint, fade );

             diffuseColor.rgb = mix( soil, rock * ${ROCK_TINT.toFixed(2)}, steep );

             // 林床。木の間の地面を暗くして、森をひと続きの塊に見せる
             diffuseColor.rgb *= mix( vec3( 1.0 ), uForestFloor, vForest );
           }`
        )
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
           // 遠くの岩肌がぎらつくと、そこだけ手前に飛び出して見える
           roughnessFactor = mix( roughnessFactor, uFarRough, terrainFar() );
           // **土には艶が無い。** 月の方角を向いて見ると、平らな地面が月を
           // 鏡のように照り返し、一面が雪のように白く光っていた
           roughnessFactor = max( roughnessFactor, 0.92 );`
        )
        .replace(
          "#include <lights_physical_fragment>",
          `#include <lights_physical_fragment>
           // **鏡面の反射率そのものを下げる。** 粗さを上げても、斜めから見ると
           // フレネルで反射が強まり、月の方角の地面が一面雪のように白く光った。
           // 土や砂利は照り返さない
           material.specularColor *= 0.2;
           material.specularColorBlended *= 0.2;
           material.specularF90 = 0.2;`
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>
           // **法線マップこそが砂利に見せていた犯人。**
           // 遠景では地形そのものの法線へ戻し、陰影を稜線だけに委ねる
           normal = normalize( mix( normal, nonPerturbedNormal, terrainFar() ) );`
        )
  }

  const mesh = new THREE.Mesh(geo, mat)
  mesh.receiveShadow = true
  mesh.position.y = -0.2

  /**
   * メッシュの面の高さ。格子を張ったときと同じ式でマス目を割り出し、
   * 同じ三角形の分け方（a-c-b / b-c-d）で補間する
   */
  function surfaceAt(x: number, z: number): number {
    const r = Math.min(Math.hypot(x, z), T.radius)
    let a = Math.atan2(x, z)
    if (a < 0) a += Math.PI * 2
    const fj = NR * Math.pow(r / T.radius, 1 / T.radialPower)
    const j0 = Math.min(Math.floor(fj), NR - 1)
    const tj = fj - j0
    const fi = (a / (Math.PI * 2)) * NA
    const i0 = Math.floor(fi) % NA
    const i1 = (i0 + 1) % NA
    const ti = fi - Math.floor(fi)
    const at = (j: number, i: number) => {
      const rr = T.radius * Math.pow(j / NR, T.radialPower)
      const ang = (i / NA) * Math.PI * 2
      return heightAt(Math.sin(ang) * rr, Math.cos(ang) * rr)
    }
    const ha = at(j0, i0)
    const hb = at(j0, i1)
    const hc = at(j0 + 1, i0)
    const hd = at(j0 + 1, i1)
    const h =
      ti + tj <= 1
        ? ha + (hb - ha) * ti + (hc - ha) * tj
        : hd + (hc - hd) * (1 - ti) + (hb - hd) * (1 - tj)
    return h + mesh.position.y
  }

  return {
    mesh,
    heightAt,
    surfaceAt,
    dispose() {
      geo.dispose()
      mat.dispose()
    },
  }
}

