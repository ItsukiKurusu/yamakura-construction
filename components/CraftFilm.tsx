"use client"

import { useEffect, useRef, useState } from "react"

import { useMotionState } from "@/components/motion-state"

/**
 * 3D ヒーロー（月夜に天主が完成する）の直後に置く、実際の作業場の映像。
 * 物語としての宮大工から、いまの職人の手へ渡す場面。
 *
 * - 映像は scripts/build-craft-video.sh で作った 18 秒のループ（継ぎ目なし）
 * - 上端は 3D の夜の暗さから溶け出すように黒から始める
 * - 旧トップの筆文字をここで主役に戻す（letter-hd.webp は元画像を 3 倍に締め直したもの）
 * - 画面に近づくまで読み込まない。画面外では止める。動きを止めた人には静止画だけを出す
 */

const POSTER = "/videos/craft-poster.jpg"

/**
 * 端末に合った重さのものを選ぶ。
 * スマホは 720p の H.264（2.5MB。1080p の AV1 より軽い）。AV1 は使わない：
 * ハードウェアで解けない機種が多く電池を食ううえ、スマホ幅の検証では
 * 再生は進むのに絵が出ない（真っ黒のまま）ことがあった。
 * デスクトップは AV1（H.264 の半分以下の重さ）、非対応なら 1080p の H.264
 */
function pickSource(video: HTMLVideoElement) {
  const px = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2)
  if (px <= 1600) return "/videos/craft-720.mp4"
  if (video.canPlayType('video/mp4; codecs="av01.0.08M.08"') === "probably") {
    return "/videos/craft-1080-av1.mp4"
  }
  return "/videos/craft-1080.mp4"
}

/** 折れ線で補間する。xs は昇順 */
function ramp(p: number, xs: number[], ys: number[]) {
  if (p <= xs[0]) return ys[0]
  for (let i = 1; i < xs.length; i++) {
    if (p <= xs[i]) {
      const t = (p - xs[i - 1]) / (xs[i] - xs[i - 1])
      return ys[i - 1] + (ys[i] - ys[i - 1]) * t
    }
  }
  return ys[ys.length - 1]
}

/** 動きを止めた人に見せる、文字が書き終わった静止状態 */
const SHADE_STILL = 0.45

export default function CraftFilm() {
  const sectionRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)
  const letterRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { motionStopped, ticker } = useMotionState()
  const [near, setNear] = useState(false)
  const [visible, setVisible] = useState(false)

  // --- 読み込みと再生の管理 ---
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const preload = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true)
          preload.disconnect()
        }
      },
      // 一画面ぶん手前から読み始める
      { rootMargin: "100% 0px" }
    )
    const watch = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    preload.observe(el)
    watch.observe(el)
    return () => {
      preload.disconnect()
      watch.disconnect()
    }
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v || !near || motionStopped) return
    if (!v.src) {
      v.src = pickSource(v)
      v.load()
    }
    if (!visible) {
      v.pause()
      return
    }
    // 自動再生が拒否されても静止画のまま成立するので、失敗は握りつぶす
    const play = () => v.play().catch(() => {})
    play()
    // 読み込み直後の play() は取りこぼされることがあるので、データが揃った時点でもう一度
    v.addEventListener("loadeddata", play, { once: true })
    return () => v.removeEventListener("loadeddata", play)
  }, [near, visible, motionStopped])

  useEffect(() => {
    if (motionStopped) videoRef.current?.pause()
  }, [motionStopped])

  // --- スクロールに合わせた演出 ---
  // ScrollTrigger を使わないのは、ヒーローの pin が 3D の読み込み後に作られ、
  // 先に作った trigger の位置が古いまま残るため。画面にある間だけ、毎フレーム実寸から求める
  useEffect(() => {
    const section = sectionRef.current
    const media = mediaRef.current
    const shade = shadeRef.current
    const letter = letterRef.current
    if (!section || !media || !shade || !letter) return

    if (motionStopped) {
      media.style.transform = ""
      shade.style.opacity = String(SHADE_STILL)
      letter.style.clipPath = ""
      letter.style.opacity = "1"
      return
    }
    // 画面外では前の状態のまま置いておけばよい
    if (!visible) return

    const update = () => {
      const r = section.getBoundingClientRect()
      const vh = window.innerHeight
      // 0 = 上端が画面の下に入った瞬間、0.5 = 画面をちょうど覆う、1 = 上に抜けきる
      const p = (vh - r.top) / (vh + r.height)
      // 入ってくる間に、わずかに引きの画へ
      media.style.transform = `scale(${ramp(p, [0, 0.5], [1.12, 1])})`
      // 夜の黒から明けていく。文字が読める暗さで止める
      shade.style.opacity = String(ramp(p, [0.05, 0.45, 0.8, 1], [1, 0.42, 0.42, 0.75]))
      // 筆文字は左から書き進めるように現れる
      letter.style.clipPath = `inset(-10% ${ramp(p, [0.3, 0.5], [100, 0])}% -10% 0)`
      letter.style.opacity = String(ramp(p, [0.28, 0.36], [0, 1]))
    }
    update()
    // RAF は gsap.ticker に一本化してある（Lenis もここで回っている）
    ticker.add(update)
    return () => ticker.remove(update)
  }, [motionStopped, visible, ticker])

  return (
    <section
      ref={sectionRef}
      aria-label="作業場の様子"
      // z を上げるのは、上へはみ出させた暗幕をヒーローの上に重ねるため
      className="relative z-[2] flex h-svh min-h-[560px] items-center justify-center bg-[#0a0a0a]"
    >
      {/* ヒーローの下端（地面と灌木）から黒へ。セクションと一緒に上がってくるので、
          ヒーローが固定されている間は画面の外にあり、3D の画を暗くしない */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-full h-[45svh]"
        style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0), #0a0a0a)" }}
      />
      <div className="absolute inset-0 overflow-hidden">
        <div ref={mediaRef} className="absolute inset-0 will-change-transform">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            poster={POSTER}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>

        {/* 暗幕。3D の夜から続けて入り、文字が読める暗さまで明ける */}
        <div
          ref={shadeRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[#0a0a0a]"
        />
        {/* 上端はヒーローの黒とつなぐ。下端と四隅も落として文字に目を集める */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, #0a0a0a 0%, rgba(10,10,10,0) 28%, rgba(10,10,10,0) 72%, #0a0a0a 100%), radial-gradient(120% 90% at 50% 50%, transparent 50%, rgba(0,0,0,0.6) 100%)",
          }}
        />
        {/* 粒子。720p の元映像の甘さを、フィルムの質感に紛れさせる */}
        <div aria-hidden="true" className="craft-grain pointer-events-none absolute -inset-[50%]" />
      </div>

      <div ref={letterRef} className="relative z-10 w-full max-w-5xl px-6">
        {/* next/image は使わない。透過 WebP をそのまま、縮小だけで出す */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/letter-hd.webp"
          alt="後世に繋げる、人も家も呼吸する建物。"
          width={3555}
          height={921}
          loading="lazy"
          decoding="async"
          className="mx-auto h-auto w-full"
          style={{ filter: "drop-shadow(0 4px 18px rgba(0,0,0,0.7))" }}
        />
      </div>
    </section>
  )
}
