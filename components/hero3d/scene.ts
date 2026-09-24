import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"

import type { DeviceProfile } from "@/lib/renderer"
import {
  BG_COLOR, BLOOM, CAMERA, FOG_COLOR, FOG_DENSITY, KEY_COLOR, LIGHT, SKY, WORK_LIGHT,
} from "./constants"
import { createTenshu, type TenshuHandle } from "./tenshu"
import { loadWoodTextures, type WoodTextures } from "./textures"
import { createBackground, type BackgroundHandle } from "./background"
import { createTerrain, type TerrainHandle } from "./terrain"
import { createFires, type FiresHandle } from "./fires"
import { createForest, type ForestHandle } from "./forest"

/**
 * シーン・カメラ・環境マップ・ライティング。
 *
 * 画は暗く保つ。既存の Navbar はトップかつスクロール 60px 未満で文字を白にするため、
 * ヒーローを明るくするとヘッダーが読めなくなる（components/Navbar.tsx）。
 * 暗いままなら Navbar は無改修で済む。
 */

export type SceneBundle = {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  tenshu: TenshuHandle
  /**
   * 時間で動くものをまとめて進める。レンダーループから毎フレーム呼ぶ。
   * 塵・星の瞬き・灯と炎のゆらぎ。篝火は生の進行度で点くので raw も渡す
   */
  updateAtmosphere: (t: number, raw: number) => void
  /** 1 枚描く。ブルームを使う端末では合成を通す。**描くときは必ずここを通すこと** */
  render: () => void
  /**
   * 影マップを焼き直す。**動いたときだけ呼ぶこと。**
   * 影の描画はこの場面の最大の負荷（実測で全体の 9 割）で、
   * 完成後は何も動かないので、毎フレーム焼き直すのは丸損になる。
   */
  requestShadowUpdate: () => void
  resize: (width: number, height: number) => void
  dispose: () => void
}

export async function createScene(
  renderer: THREE.WebGLRenderer,
  profile: DeviceProfile,
  onProgress?: (fraction: number) => void
): Promise<SceneBundle> {
  // 木目テクスチャ。読み終わるまで待ってから組み立てる（貼られていない一瞬を見せない）
  const textures: WoodTextures = await loadWoodTextures(renderer, onProgress)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(BG_COLOR)

  // フォグの色は背景と必ず揃える。ずれていると遠景の輪郭が浮く。
  // 散開した部材が遠くへ飛んだときに闇へ溶けるので、画面外との境目も消せる。
  // 小屋全体が収まる距離まで引くため、一本の梁だけのときよりかなり薄い。
  scene.fog = new THREE.FogExp2(FOG_COLOR, FOG_DENSITY)

  const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far)

  // --- 環境マップ（IBL）---
  // **背景に映すのと同じ HDRI から作った 1 枚**を使う。
  // 別々に持つと、背景を直したのに映り込みだけ古いまま、という食い違いが起きる。
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envRT = pmrem.fromEquirectangular(textures.skyEnv)
  scene.environment = envRT.texture
  // 背景のドームと同じだけ回す。これを忘れると、映り込みの明るい側だけ
  // 別の方角を向く
  scene.environmentRotation = new THREE.Euler(0, SKY.rotation, 0)
  pmrem.dispose()

  // --- ライティング ---
  // 光源は実在のものだけ（constants.ts の「光の筋書き」）。
  // 月・地平の街明かり・空と地面の照り返し。暖色の強い光は完成まで取っておく
  const hemi = new THREE.HemisphereLight(LIGHT.hemiSky, LIGHT.hemiGround, LIGHT.hemi)
  scene.add(hemi)

  // 月光。影の向きはすべてこれで決まる。方位は見える月と揃えてある
  const keyLight = new THREE.DirectionalLight(KEY_COLOR, LIGHT.key)
  keyLight.position.set(...LIGHT.keyPos)
  // 平行光の向きは position と target の差で決まる。
  // target を既定（原点）のままにすると、天主の高さぶん光が下向きになりすぎる。
  keyLight.target.position.set(...LIGHT.keyTarget)
  scene.add(keyLight)
  scene.add(keyLight.target)

  // 手元の作業灯。冒頭の継手の寄りだけを照らし、カメラが引くと消える（constants.ts）。
  // 最初から置いておき明るさだけを変える。**visible を切り替えてもいけない**——
  // 光の数が変わった扱いになり、全マテリアルのシェーダーが組み直されて一瞬止まる
  const workLight = new THREE.PointLight(WORK_LIGHT.color, WORK_LIGHT.intensity, WORK_LIGHT.distance, 2)
  workLight.position.set(...WORK_LIGHT.position)
  scene.add(workLight)

  // 地平の街明かりは光源として置かない。環境マップ（空と同じ方角に回してある）が
  // 柔らかい暖色として回り込ませる。平行光で足すと金の縁が電飾のように光った

  // --- 影 ---
  // 板にラジアルグラデーションを焼く方式ではなく、**シャドウマップ**を選んだ。
  // 百を超える部材と 700 を超える石が個別に動いて組み上がるため、
  // 焼いた 1 枚の影では追従できない。実際の影なら、離れていた影が
  // 組み上がりとともに 1 つに合流していく。
  // 終盤の垂木が石垣と梁に落とす縞は、この演出で一番美しい部分でもある。
  const shadowsOn = profile.shadowMapSize > 0
  if (shadowsOn) {
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(profile.shadowMapSize, profile.shadowMapSize)
    // 範囲を絞るほど影が綺麗になる。既定のまま広いとボケて使い物にならない。
    const s = LIGHT.shadowExtent
    keyLight.shadow.camera.left = -s
    keyLight.shadow.camera.right = s
    keyLight.shadow.camera.top = s
    keyLight.shadow.camera.bottom = -s
    keyLight.shadow.camera.near = LIGHT.shadowNear
    keyLight.shadow.camera.far = LIGHT.shadowFar
    keyLight.shadow.bias = -0.0006
    keyLight.shadow.normalBias = 0.02
    // **毎フレームの自動更新を切る。** 動いたときだけレンダーループから焼き直す
    keyLight.shadow.autoUpdate = false
    keyLight.shadow.needsUpdate = true
  }

  // --- 地面 ---
  //
  // 平らな板ではなく、**天主が載る山そのもの**を作る（terrain.ts）。
  // 城の敷地だけは必ず水平なので、石垣が浮いたり沈んだりしない。
  const terrain: TerrainHandle = createTerrain(textures)
  terrain.mesh.receiveShadow = shadowsOn
  scene.add(terrain.mesh)

  // --- 森 ---
  // 地形の高さに合わせて植えるので、地形の後に作る
  const forest: ForestHandle = createForest(terrain.heightAt, terrain.surfaceAt, textures.trees, profile)
  scene.add(forest.group)

  // --- 背景 ---
  const background: BackgroundHandle = createBackground(scene, camera, textures.skyView, profile)

  // --- 天主 ---
  const tenshu = createTenshu(textures, profile)
  scene.add(tenshu.group)

  // --- 篝火 ---
  const fires: FiresHandle = createFires(profile)
  scene.add(fires.group)

  // --- 合成（ブルーム）---
  //
  // 閾値を高く取り、**灯・炎・月だけ**をにじませる。画面全体にかけると眠い絵になる。
  // スマホでは使わない。ポストは最初に切るもの（threejs スキル 08 章）。
  //
  // 合成を通すと既定のアンチエイリアスが効かなくなるので、描き込み先に
  // MSAA（samples: 4）を持たせる。トーンマッピングは最後の OutputPass が受け持つ
  // （three は画面へ直接描くときにしかトーンマップしない）。
  let composer: EffectComposer | null = null
  let bloom: UnrealBloomPass | null = null
  if (!profile.isMobile) {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2())
    const target = new THREE.WebGLRenderTarget(size.x, size.y, {
      type: THREE.HalfFloatType,
      samples: 4,
    })
    composer = new EffectComposer(renderer, target)
    composer.addPass(new RenderPass(scene, camera))
    bloom = new UnrealBloomPass(size.clone(), BLOOM.strength, BLOOM.radius, BLOOM.threshold)
    composer.addPass(bloom)
    composer.addPass(new OutputPass())
  }

  function resize(width: number, height: number) {
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
    if (composer) {
      composer.setPixelRatio(renderer.getPixelRatio())
      composer.setSize(width, height)
    }
  }

  return {
    scene,
    camera,
    tenshu,
    updateAtmosphere(t: number, raw: number) {
      // 作業灯。引きの画に入るにつれて消す。ごくわずかに揺らして火の灯りにする
      const f = Math.min(1, Math.max(0, (raw - WORK_LIGHT.fadeFrom) / (WORK_LIGHT.fadeTo - WORK_LIGHT.fadeFrom)))
      const keep = 1 - f * f * (3 - 2 * f)
      workLight.intensity = WORK_LIGHT.intensity * keep * (1 + 0.05 * Math.sin(t * 8.3) * Math.sin(t * 3.1))
      background.update(t)
      forest.update(t)
      tenshu.updateGlow(t)
      fires.update(t, raw)
    },
    render() {
      if (composer) composer.render()
      else renderer.render(scene, camera)
    },
    requestShadowUpdate() {
      if (shadowsOn) keyLight.shadow.needsUpdate = true
    },
    resize,
    dispose() {
      composer?.dispose()
      bloom?.dispose()
      fires.dispose()
      forest.dispose()
      background.dispose()
      tenshu.dispose()
      textures.dispose()
      terrain.dispose()
      envRT.texture.dispose()
      scene.environment = null
      scene.clear()
    },
  }
}
