"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import gsap from "gsap"
import { Volume2, VolumeX } from "lucide-react"

import { attachResize, createRenderer, readDeviceProfile } from "@/lib/renderer"
import { damp, dampAlpha } from "@/lib/damp"
import { useMotionState } from "@/components/motion-state"

import { createScene } from "./scene"
import { createChoreography } from "./scrollChoreography"
import { createCameraPath, type CameraPose } from "./cameraPath"
import { createSoundEngine, synthKnock, type SoundEngine } from "./sound"
import { BREATH, CLAD_END, COAST, LAMBDA, POINTER_SHIFT, STILL_POSE } from "./constants"

/**
 * React のライフサイクルと three を繋ぐ層。
 *
 * ここでの最重要事項は**後始末**。Next.js のクライアント遷移で下層へ行って
 * 戻ってくると、この useEffect はもう一度走る。解放が漏れていると
 * WebGL コンテキストとレンダーループが二重に走り、数往復でタブが落ちる。
 *
 * 描画ループは gsap.ticker に載せる。Lenis も同じ ticker で回っているので、
 * スクロール・トゥイーン・3D がすべて 1 本の RAF に揃う。
 */

type Props = {
  /** 3D の準備が終わったら呼ばれる。ローダーの制御に使う */
  onReady?: () => void
  /** テクスチャの読み込み進捗（0..1）。ローダーの数字に使う */
  onProgress?: (fraction: number) => void
}

/** 注視点まわりに水平回転させる。マウス追従で小屋を「覗き込む」ための量 */
function orbitAround(pos: THREE.Vector3, look: THREE.Vector3, yaw: number) {
  const dx = pos.x - look.x
  const dz = pos.z - look.z
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  pos.x = look.x + dx * c - dz * s
  pos.z = look.z + dx * s + dz * c
}

export default function HeroCanvas({ onReady, onProgress }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { motionStopped } = useMotionState()

  // 音。**既定は無音**で、ボタンを押したときに初めて AudioContext を作る
  // （ブラウザは操作の中でしか音を出させない）。演出の effect が作り直されても
  // 鳴らしている音は続けたいので、エンジンは effect の外で持つ
  const soundRef = useRef<SoundEngine | null>(null)
  const [soundOn, setSoundOn] = useState(false)
  const toggleSound = () => {
    if (!soundRef.current) soundRef.current = createSoundEngine()
    soundRef.current.setEnabled(!soundOn)
    setSoundOn(!soundOn)
  }
  useEffect(() => {
    return () => {
      soundRef.current?.dispose()
      soundRef.current = null
    }
  }, [])

  // onReady は毎レンダーで参照が変わりうるので、effect の依存には入れない
  const onReadyRef = useRef(onReady)
  const onProgressRef = useRef(onProgress)
  useEffect(() => {
    onReadyRef.current = onReady
    onProgressRef.current = onProgress
  }, [onReady, onProgress])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    // **canvas は effect ごとに作る。**
    //
    // JSX に 1 枚だけ置いて使い回すと、この effect が二重に走ったときに
    // 同じ WebGL コンテキストを 2 つのレンダラが掴む。canvas には
    // コンテキストが 1 つしか無いためで、先に片付いたほうの
    // forceContextLoss() が、生きているほうのコンテキストごと殺す。
    //
    // 開発時の StrictMode では必ず二重に走るし、本番でもページを素早く
    // 往復すれば同じことが起きる。**1 回の生存期間に canvas 1 枚**が正しい。
    const canvas = document.createElement("canvas")
    canvas.className = "block h-full w-full"
    wrapper.appendChild(canvas)

    // テクスチャの読み込みを待つ間に外される可能性があるので、取り消し用の旗を持つ
    let cancelled = false
    let cleanup: (() => void) | null = null

    const setup = async () => {
      // pin の対象は自分を囲むヒーローセクション
      const trigger = wrapper.closest<HTMLElement>("[data-hero]")

      const profile = readDeviceProfile()
      const gl = createRenderer(canvas, profile)

      if (!gl) {
        // WebGL が使えない環境。静的表示に落とし、ローダーは即座に閉じる
        // （3D を待ち続けて永遠に読み込み中になるのが最悪のパターン）
        document.documentElement.classList.add("no-webgl")
        onReadyRef.current?.()
        return
      }

      // 木目テクスチャの読み込みを待つ
      const bundle = await createScene(gl.renderer, profile, (f) =>
        onProgressRef.current?.(f)
      )

      // 待っている間に外されていたら、作った端から解放して何も始めない
      if (cancelled) {
        bundle.dispose()
        gl.dispose()
        return
      }

      const firstSize = gl.applyResolution()
      bundle.resize(firstSize.width, firstSize.height)

      // 開発時だけ、調整のために中身を覗けるようにしておく。
      // renderer.info は**フレームレートに依存しない**ので、
      // 描画が絞られた環境でもドローコールと三角形数だけは正確に測れる。
      if (process.env.NODE_ENV === "development") {
        ;(window as unknown as Record<string, unknown>).__hero3d = {
          renderer: gl.renderer,
          scene: bundle.scene,
          camera: bundle.camera,
        }
      }

      const path = createCameraPath()
      const pose: CameraPose = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0 }
      const aspect = () => bundle.camera.aspect
      /** 縦長の画面で広げた画角をカメラに反映する。変わったときだけ行列を作り直す */
      const applyFov = () => {
        if (Math.abs(bundle.camera.fov - pose.fov) > 1e-3) {
          bundle.camera.fov = pose.fov
          bundle.camera.updateProjectionMatrix()
        }
      }

      // --- 演出を止めている場合: 決めの構図で 1 回だけ描いて終わり ---
      if (motionStopped) {
        bundle.tenshu.setProgress(STILL_POSE.progress)
        // 塵も炎も止めた状態で、**灯のともった完成形**を焼き付ける
        bundle.updateAtmosphere(0, STILL_POSE.progress)
        // 完成の構図はカメラの通り道の終点と同じものを使う。
        // 別に持つと、演出を直したときに片方だけ古くなる
        path.sample(STILL_POSE.p, aspect(), pose)
        applyFov()
        bundle.camera.position.copy(pose.pos)
        bundle.camera.lookAt(pose.look)
        bundle.requestShadowUpdate()
        bundle.render()
        onReadyRef.current?.()

        cleanup = () => {
          bundle.dispose()
          gl.dispose()
        }
        return
      }

      // --- 通常の演出 ---
      let sceneActive = true
      // タブが見えているか。**ScrollTrigger の生成時にコールバックが即座に呼ばれる**
      // ことがあるので、それより前に宣言しておく（後ろだと未初期化で落ちる）
      let documentVisible = document.visibilityState !== "hidden"
      const choreo = createChoreography(trigger ?? canvas, (active) => {
        sceneActive = active
        // ヒーローを抜けたら音も静かに消す
        soundRef.current?.setActive(active && documentVisible)
      })

      // 描くかどうかは「ピンの中にいるか」ではなく「画面に見えているか」で決める。
      // ピンを抜けた直後も、ヒーローは作業場の場面に覆われながらしばらく画面に残る。
      // そこで描画を止めると、回っていた画が急に静止画になる。
      // 最初は画面の一番上にいるので true から始める（観測の初回通知を待たない）
      let heroOnScreen = true
      const screenWatch = new IntersectionObserver(([e]) => {
        heroOnScreen = e.isIntersecting
      })
      screenWatch.observe(trigger ?? canvas)

      // 完成後の回転（constants.ts の COAST）。角度は度で持つ
      let coastAngle = 0
      let coastSpeed = 0

      // 目標値に向かって遅延追従する実体。**進行度ただ一つ**。
      // カメラも部材もここから引くので、両者がずれることが原理的に無い。
      let progress = choreo.targets.progress
      // 影を最後に焼いたときの進行度。**動いたときだけ焼き直す**
      let shadowAt = Number.NaN
      // 組み立て中は毎フレーム動くが、影は 2 フレームに 1 回で足りる。
      // 1 フレーム遅れた影は目では分からないのに、負荷は半分になる
      let shadowSkip = 0

      // --- ポインタ ---
      // カーソルの無い端末では動かさない
      const usePointer = window.matchMedia("(pointer: fine)").matches
      const pointer = { x: 0, y: 0 }
      const pointerSmooth = { x: 0, y: 0 }

      const onPointerMove = (e: PointerEvent) => {
        // イベントの中では値を書くだけ。計算はレンダーループでやる
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1
        pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
      }
      if (usePointer) window.addEventListener("pointermove", onPointerMove, { passive: true })

      // --- リサイズ ---
      const detachResize = attachResize(() => {
        const r = gl.applyResolution()
        bundle.resize(r.width, r.height)
      })

      // --- タブが見えていない間は描かない ---
      const onVisibility = () => {
        documentVisible = document.visibilityState !== "hidden"
        soundRef.current?.setActive(documentVisible && sceneActive)
      }
      document.addEventListener("visibilitychange", onVisibility)

      /** 進行度から画をすべて決める。初期フレームとループで同じ手順を通す */
      const applyPose = (p: number, t: number) => {
        bundle.tenshu.setProgress(p)
        path.sample(p, aspect(), pose)
        applyFov()

        // 完成後の回転。orbitAround は正の角度で方位角が減る向きに回るので、符号を反転して
        // 通り道と同じ向きに回し続ける
        if (coastAngle !== 0) orbitAround(pose.pos, pose.look, -THREE.MathUtils.degToRad(coastAngle))

        // 呼吸: 何もしていなくてもごくゆっくり動き続ける。
        // 止まっている時間を作らないことが「生きている」印象に繋がる
        const breathY = Math.sin(t * BREATH.speed) * BREATH.amplitude
        const breathZ = Math.sin(t * BREATH.cameraSpeed) * BREATH.cameraAmplitude

        pose.look.y += breathY

        if (usePointer) {
          orbitAround(pose.pos, pose.look, pointerSmooth.x * POINTER_SHIFT.yaw)
          pose.pos.y += pointerSmooth.y * POINTER_SHIFT.y
        }

        // 呼吸ぶんの寄り引きは、注視点からの距離に対する割合で掛ける。
        // 絶対値で足すと、寄りの場面（継手）と引きの場面（小屋全体）で効き方が変わる
        pose.pos.sub(pose.look).multiplyScalar(1 + breathZ).add(pose.look)

        bundle.camera.position.copy(pose.pos)
        bundle.camera.lookAt(pose.look)
      }

      // 開発時だけ、進行度を指定して 1 枚描けるようにする。
      //
      // 見た目の確認をスクロールでやろうとすると、**実スクロールを持っているのは
      // Lenis** で、しかもタブが隠れている間は RAF が止まるため、位置を指定しても
      // 画が更新されない。確かめたい場面を直接描けるほうが速いし、確実。
      if (process.env.NODE_ENV === "development") {
        const handle = (window as unknown as Record<string, unknown>).__hero3d as
          | Record<string, unknown>
          | undefined
        if (handle) {
          // 木槌の音をオフラインで描き出して周波数を測るため（開発時のみ）
          handle.synthKnock = synthKnock
          handle.setProgress = (p: number) => {
            progress = Math.min(1, Math.max(0, p))
            const t = performance.now() / 1000
            applyPose(progress, t)
            bundle.updateAtmosphere(t, progress)
            bundle.requestShadowUpdate()
            bundle.render()
            return progress
          }
        }
      }

      // --- 初期フレーム ---
      // ループに入る前に 1 枚だけ確実に描いて、準備完了を伝える。
      // ループ側の可視性ガードに任せると、**バックグラウンドタブで開かれたときに
      // 1 フレームも描かれず、ローダーがタイムアウトまで残る**。
      applyPose(progress, 0)
      // 月と星をカメラ位置へ寄せる。これを飛ばすと、最初の 1 枚だけ月がずれる
      bundle.updateAtmosphere(0, progress)
      bundle.requestShadowUpdate()
      bundle.render()
      onReadyRef.current?.()

      // --- レンダーループ ---
      const tick = (time: number, deltaMs: number) => {
        if (!documentVisible) return
        // 画面の外にいる間は描かない。これが一番効く省力化
        if (!heroOnScreen) return

        // gsap.ticker の delta はミリ秒。タブ復帰直後の巨大な値は切り捨てる
        const dt = Math.min(deltaMs / 1000, 0.1)

        // フレームレート非依存の指数減衰。`x += (target - x) * 0.1` は使わない
        progress = damp(progress, choreo.targets.progress, LAMBDA.progress, dt)

        // 完成後の回転。最後の場面に入ったら時間で回り、戻ったら止まって元の通り道へ寄せる
        const coasting = progress >= COAST.from
        coastSpeed += ((coasting ? COAST.speed : 0) - coastSpeed) * dampAlpha(COAST.lambda, dt)
        if (coasting) {
          coastAngle = (coastAngle + coastSpeed * dt) % 360
        } else if (coastAngle !== 0) {
          // 近い方へ戻す（350 度ずれていたら 10 度戻すだけにする）
          if (coastAngle > 180) coastAngle -= 360
          coastAngle = damp(coastAngle, 0, COAST.returnLambda, dt)
          if (Math.abs(coastAngle) < 0.01) coastAngle = 0
        }

        // ポインタ追従の慣性
        if (usePointer) {
          const a = dampAlpha(LAMBDA.pointer, dt)
          pointerSmooth.x += (pointer.x - pointerSmooth.x) * a
          pointerSmooth.y += (pointer.y - pointerSmooth.y) * a
        }

        applyPose(progress, time)
        // 塵・星・灯と炎のゆらぎ。篝火は生の進行度で点く
        bundle.updateAtmosphere(time, progress)
        // 音。木槌・梵鐘・篝火の音は画と同じ進行度から鳴らす
        soundRef.current?.update(progress, dt)

        // 部材が動いたときだけ影を焼き直す。
        // **塗り上がったあとは、進行度が動いても影は変わらない**
        // （部材も不透明度も確定しているため）。最後の一周はカメラだけが動く
        const stillBuilding = progress < CLAD_END || shadowAt < CLAD_END
        if (stillBuilding && !(Math.abs(progress - shadowAt) < 3e-4)) {
          if (shadowSkip <= 0) {
            bundle.requestShadowUpdate()
            shadowAt = progress
            shadowSkip = 1
          } else {
            shadowSkip--
          }
        }

        bundle.render()
      }

      gsap.ticker.add(tick)

      // --- 後始末 ---
      cleanup = () => {
        gsap.ticker.remove(tick)
        screenWatch.disconnect()
        choreo.kill() // pin した ScrollTrigger と pin-spacer を確実に外す
        detachResize()
        document.removeEventListener("visibilitychange", onVisibility)
        if (usePointer) window.removeEventListener("pointermove", onPointerMove)

        bundle.dispose() // geometry / material / texture
        gl.dispose() // renderer.dispose() + forceContextLoss()
      }
    }

    setup()

    return () => {
      cancelled = true
      cleanup?.()
      // この canvas はもう使えない（forceContextLoss 済み）。必ず捨てる
      canvas.remove()
    }
  }, [motionStopped])

  return (
    <>
      {/* 中身は effect が作る。React にはこの中の DOM を触らせない */}
      <div ref={wrapperRef} className="hero-canvas-wrapper" aria-hidden="true" />

      {/* 音。既定は無音。演出を止めている人には出さない（合わせる動きが無い）。
          ラベルは状態ではなく動作を書く（aria-pressed は付けない） */}
      {!motionStopped && (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-full border border-white/25 bg-black/35 px-3 py-1.5 text-xs text-white/85 backdrop-blur-sm transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:bottom-6 md:left-6"
        >
          {soundOn ? (
            <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {soundOn ? "音を消す" : "音を出す"}
        </button>
      )}
    </>
  )
}
