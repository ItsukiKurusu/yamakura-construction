import * as THREE from "three"

/**
 * 木材テクスチャの読み込み。
 *
 * 元画像は references/wood/（非公開）。
 * scripts/build-wood-textures.py が加工して public/textures/wood/ に書き出したものを読む。
 * 色を調整したいときはスクリプトの数値を変えて再実行する。
 */

const BASE = "/textures/wood"

export type WoodTextures = {
  sideA: { map: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture }
  sideB: { map: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture }
  end: { map: THREE.Texture; normal: THREE.Texture }
  fresh: { map: THREE.Texture }
  /** 屋根の瓦。本瓦葺 */
  kawara: { map: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture }
  /** 真壁の漆喰 */
  plaster: { map: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture }
  /** 金箔。七重目と軒瓦に */
  gold: { map: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture }
  /** 石垣。野面積み */
  ishigaki: { map: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture }
  /** 見える空（正距円筒図） */
  skyView: THREE.Texture
  /** 映り込み用の空。PMREM に通す */
  skyEnv: THREE.Texture
  /** 地面（近景）。踏み固めた土 */
  ground: { map: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture }
  /** 地面（斑として混ぜる）。粗い砕石 */
  ground2: { map: THREE.Texture; rough: THREE.Texture }
  /**
   * 森の木（scripts/build-tree-textures.py）。
   * cedar … 杉の枝 1 本ぶんの板（上下 2 種）。broad … 葉の塊（2x2 で 4 種）。bark … 幹
   */
  trees: { cedar: THREE.Texture; broad: THREE.Texture; bark: THREE.Texture }
  dispose: () => void
}

function configure(tex: THREE.Texture, isColor: boolean, anisotropy: number) {
  // 色として使うテクスチャにだけ sRGB を指定する。
  // 粗さ・ノーマルはデータなのでリニアのまま。ここに sRGB を付けるのが最頻出のバグで、
  // 「色は変じゃないのに質感が微妙」という症状になる。
  if (isColor) tex.colorSpace = THREE.SRGBColorSpace

  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  // 梁を斜めから見たときに木目が溶けないように
  tex.anisotropy = anisotropy
  return tex
}

export async function loadWoodTextures(
  renderer: THREE.WebGLRenderer,
  /**
   * 読み込みの進捗（0..1）。
   * テクスチャは合計 2.6MB あるので、**時間で這わせた偽の数字ではなく
   * 実際に何枚読めたか**を出さないと、遅い回線で「止まった」と読まれる。
   */
  onProgress?: (fraction: number) => void
): Promise<WoodTextures> {
  const manager = new THREE.LoadingManager()
  manager.onProgress = (_url, loaded, total) => {
    // total は読み込みを積むたびに増えるので、進捗は前後しうる。
    // 表示側で遅延追従させて均す
    if (total > 0) onProgress?.(loaded / total)
  }
  const loader = new THREE.TextureLoader(manager)
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy())

  const get = async (file: string, isColor: boolean) =>
    configure(await loader.loadAsync(`${BASE}/${file}`), isColor, aniso)

  const [
    sideAMap, sideANormal, sideARough,
    sideBMap, sideBNormal, sideBRough,
    endMap, endNormal,
    freshMap,
  ] = await Promise.all([
    get("wood-side-a-albedo.webp", true),
    get("wood-side-a-normal.webp", false),
    get("wood-side-a-rough.webp", false),
    get("wood-side-b-albedo.webp", true),
    get("wood-side-b-normal.webp", false),
    get("wood-side-b-rough.webp", false),
    get("wood-end-albedo.webp", true),
    get("wood-end-normal.webp", false),
    get("wood-fresh-albedo.webp", true),
  ])

  // --- 仕上げ材（地面・瓦・漆喰）---
  // 元写真が無いので scripts/build-surface-textures.py が計算で起こしている。
  // 写真が手に入ったら同じファイル名で差し替えれば、コード側は変更不要。
  const surface = async (file: string, isColor: boolean) =>
    configure(await loader.loadAsync(`/textures/surface/${file}`), isColor, aniso)

  const [
    kawaraMap, kawaraNormal, kawaraRough,
    plasterMap, plasterNormal, plasterRough,
    goldMap, goldNormal, goldRough,
    ishigakiMap, ishigakiNormal, ishigakiRough,
    groundMap, groundNormal, groundRough,
    ground2Map, ground2Rough,
  ] = await Promise.all([
    surface("kawara-albedo.webp", true),
    surface("kawara-normal.webp", false),
    surface("kawara-rough.webp", false),
    surface("plaster-albedo.webp", true),
    surface("plaster-normal.webp", false),
    surface("plaster-rough.webp", false),
    surface("gold-albedo.webp", true),
    surface("gold-normal.webp", false),
    surface("gold-rough.webp", false),
    surface("ishigaki-albedo.webp", true),
    surface("ishigaki-normal.webp", false),
    surface("ishigaki-rough.webp", false),
    surface("ground-albedo.webp", true),
    surface("ground-normal.webp", false),
    surface("ground-rough.webp", false),
    surface("ground2-albedo.webp", true),
    surface("ground2-rough.webp", false),
  ])

  // --- 森の木 ---
  // 枝葉の板は透過つき。**繰り返さない**（板の外へはみ出した分を隣から拾わない）
  const tree = async (file: string) => {
    const t = configure(await loader.loadAsync(`/textures/trees/${file}`), true, aniso)
    t.wrapS = THREE.ClampToEdgeWrapping
    t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }
  const [cedarMap, broadMap, barkMap] = await Promise.all([
    tree("cedar-branch.webp"),
    tree("broad-clump.webp"),
    // 樹皮は幹に巻いて繰り返すので、こちらは既定の繰り返しのまま
    loader.loadAsync("/textures/trees/bark-albedo.webp").then((t) => configure(t, true, aniso)),
  ])

  // --- 空 ---
  // 見える空と映り込み用を、同じ HDRI から起こした 2 枚で持つ。
  // 映り込みは PMREM が大きくぼかすので小さくてよい。
  const skyView = await loader.loadAsync("/textures/env/sky-view.webp")
  skyView.colorSpace = THREE.SRGBColorSpace
  const skyEnv = await loader.loadAsync("/textures/env/sky-env.webp")
  skyEnv.colorSpace = THREE.SRGBColorSpace
  skyEnv.mapping = THREE.EquirectangularReflectionMapping

  const all = [
    sideAMap, sideANormal, sideARough,
    sideBMap, sideBNormal, sideBRough,
    endMap, endNormal, freshMap,
    kawaraMap, kawaraNormal, plasterMap, plasterNormal,
    kawaraRough, plasterRough,
    goldMap, goldNormal, goldRough,
    ishigakiMap, ishigakiNormal, ishigakiRough,
    groundMap, groundNormal, groundRough,
    ground2Map, ground2Rough,
    cedarMap, broadMap, barkMap,
    skyView, skyEnv,
  ]

  return {
    sideA: { map: sideAMap, normal: sideANormal, rough: sideARough },
    sideB: { map: sideBMap, normal: sideBNormal, rough: sideBRough },
    end: { map: endMap, normal: endNormal },
    fresh: { map: freshMap },
    kawara: { map: kawaraMap, normal: kawaraNormal, rough: kawaraRough },
    plaster: { map: plasterMap, normal: plasterNormal, rough: plasterRough },
    gold: { map: goldMap, normal: goldNormal, rough: goldRough },
    ishigaki: { map: ishigakiMap, normal: ishigakiNormal, rough: ishigakiRough },
    skyView,
    skyEnv,
    ground: { map: groundMap, normal: groundNormal, rough: groundRough },
    ground2: { map: ground2Map, rough: ground2Rough },
    trees: { cedar: cedarMap, broad: broadMap, bark: barkMap },
    dispose() {
      for (const t of all) t.dispose()
    },
  }
}
