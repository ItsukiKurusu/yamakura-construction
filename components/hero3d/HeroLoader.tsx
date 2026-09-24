"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"

import { damp } from "@/lib/damp"

/**
 * ヒーローのローディング表示。
 *
 * 守っていること:
 *   - HTML のテキストは 3D を待たずに表示される（このローダーは上に被せるだけ）
 *   - 進捗は必ず動く。止まった数字は「壊れた」と読まれる
 *   - 100% を見せない。99% で待ち、両方揃ってから 100 → 退場
 *   - `document.fonts.ready` と 3D 初期化の**両方**を待つ
 *   - タイムアウトを置く。取得に失敗して永久に読み込み中になるのが最悪
 */

/** これを過ぎたら待たずに進む */
const TIMEOUT_MS = 12000

type Props = {
  /** 3D の初期化が終わったか */
  ready: boolean
  /**
   * テクスチャの実際の読み込み進捗（0..1）。
   * 合計 2.6MB あるので、**時間で這わせた数字だけ**だと
   * 遅い回線で「進んでいるのに止まって見える」ことになる。
   */
  progress?: number
}

export default function HeroLoader({ ready, progress = 0 }: Props) {
  const [percent, setPercent] = useState(0)
  const [done, setDone] = useState(false)
  const [removed, setRemoved] = useState(false)

  const fontsReadyRef = useRef(false)
  const readyRef = useRef(ready)
  const timedOutRef = useRef(false)
  const progressRef = useRef(progress)

  useEffect(() => {
    readyRef.current = ready
  }, [ready])

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    let cancelled = false

    document.fonts.ready.then(() => {
      if (!cancelled) fontsReadyRef.current = true
    })

    const timeout = window.setTimeout(() => {
      timedOutRef.current = true
    }, TIMEOUT_MS)

    // 表示上の進捗。実際の進捗に遅れて追従させると、同じ待ち時間でも体感が良くなる
    let shown = 0
    // 実測だけだと 2 段階でしか動かないので、時間で少しずつ這わせる
    let creep = 0

    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 0.1)

      const allDone = (fontsReadyRef.current && readyRef.current) || timedOutRef.current

      // 這い上がりは 0.9 が上限。実際の完了を追い越さない
      creep += (0.9 - creep) * dt * 0.55
      // **実際に読めた割合と、時間で這わせた値の大きいほう**を使う。
      // 読み込みが速ければ実測が引っ張り、遅ければ這い上がりが
      // 「止まっていない」ことを示す。どちらか一方だと必ず破綻する。
      const measured = Math.min(0.92, progressRef.current * 0.92)
      const target = allDone ? 1 : Math.max(creep, measured)

      // 揃ったあとは速く詰める。ここを遅いままにすると、フレームレートが
      // 絞られた環境（バックグラウンドタブなど）で、準備は終わっているのに
      // ローダーだけが居座る。
      shown = damp(shown, target, allDone ? 12 : 3, dt)

      // 完了までは 99 で止める
      const pct = allDone ? Math.round(shown * 100) : Math.min(99, Math.floor(shown * 100))
      setPercent(pct)

      if (allDone && shown > 0.995) {
        setDone(true)
        gsap.ticker.remove(tick)
      }
    }

    gsap.ticker.add(tick)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      gsap.ticker.remove(tick)
    }
  }, [])

  // 退場アニメーションが終わってから DOM ごと外す。
  // opacity だけ 0 にして残すと、透明な板がクリックを吸う（よくある事故）
  useEffect(() => {
    if (!done) return
    const id = window.setTimeout(() => setRemoved(true), 900)
    return () => window.clearTimeout(id)
  }, [done])

  if (removed) return null

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] transition-opacity duration-700 ${
        done ? "opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
      aria-label="読み込み中"
    >
      <div className="w-[min(320px,70vw)]">
        <p className="mb-3 text-center font-mono text-4xl tabular-nums text-white/90">
          {String(percent).padStart(3, "0")}
        </p>
        <div className="h-px w-full overflow-hidden bg-white/15">
          <div
            className="h-full origin-left bg-white/70"
            style={{ transform: `scaleX(${percent / 100})` }}
          />
        </div>
      </div>
    </div>
  )
}
