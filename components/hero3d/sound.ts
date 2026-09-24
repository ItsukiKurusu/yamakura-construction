import { IGNITE, SOUND } from "./constants"

/**
 * 音。**音源ファイルは 1 つも使わず、Web Audio でその場で合成する。**
 * 素材を用意する手間も、権利の心配も無い。
 *
 *   夜の気配 … かすかな風と、鈴虫のような虫の声。鳴らしている間ずっと
 *   木槌     … 建て方の最中、スクロールで部材が組み上がるぶんだけ「コン」と鳴る
 *   篝火     … 火が入ると、ぱちぱちと小さく爆ぜる
 *   梵鐘     … 篝火が燃え上がる瞬間に一打。うなりを伴って長く残る
 *
 * **既定は無音。** AudioContext は利用者の操作（ボタン）から作る必要がある
 * （ブラウザの自動再生の制限）。企業サイトで勝手に音が出るのは論外でもある。
 */

export type SoundEngine = {
  /** 鳴らす・止める。**最初の 1 回は必ずクリックなどの操作の中から呼ぶこと** */
  setEnabled: (on: boolean) => void
  /** ヒーローが画面にあり、タブが見えているか。外れたら静かに消す */
  setActive: (active: boolean) => void
  /** レンダーループから呼ぶ。raw は生のスクロール進行度、dt は秒 */
  update: (raw: number, dt: number) => void
  dispose: () => void
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** 厚みを足すための柔らかい歪み（tanh）。倍音が増え、小さなスピーカーでも低音が「聞こえる」 */
const saturationCurve = (() => {
  const n = 1024
  const c = new Float32Array(n)
  const drive = 2.4
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1
    c[i] = Math.tanh(x * drive) / Math.tanh(drive)
  }
  return c
})()

/**
 * 木槌（掛矢）で材を打つ音。**どの AudioContext にも鳴らせる**ように切り出してある
 * （オフラインで描き出して周波数を測り、音を確かめるため）。
 *
 * 以前は 380〜540Hz の正弦波に高い打撃音を重ねただけで、「コッ」と軽く
 * 安っぽかった。本物の掛矢の音は 3 つが重なっている。
 *   胴鳴り   … 材と木槌の胴が鳴る低い「ドン」。100Hz 前後で、打った直後にわずかに下がる
 *   木の響き … 中域の「ゴッ」。木らしさはここで決まる
 *   打撃     … ごく短い当たり。高く明るくすると安っぽくなるので、丸めて小さく
 * 最後に柔らかく歪ませて倍音を足す。スマホのスピーカーは 100Hz を鳴らせないが、
 * 倍音（200〜350Hz）があれば耳が基音を補って「低く厚い」と感じる。
 */
export function synthKnock(
  ctx: BaseAudioContext,
  out: AudioNode,
  noise: AudioBuffer,
  at: number,
  volume: number,
  pan: number
) {
  const r = (a: number, b: number) => a + Math.random() * (b - a)
  const p = ctx.createStereoPanner()
  p.pan.value = pan
  p.connect(out)

  // 歪ませる系統（胴鳴りと木の響き）
  const shaper = ctx.createWaveShaper()
  shaper.curve = saturationCurve
  shaper.oversample = "2x"
  // 歪みを強めに入れて倍音を作る。基音だけだと小さなスピーカーで消える
  const pre = ctx.createGain()
  pre.gain.value = 2.2
  const post = ctx.createGain()
  post.gain.value = 0.62
  pre.connect(shaper).connect(post).connect(p)

  const env = (g: GainNode, peak: number, attack: number, decay: number) => {
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(peak, at + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay)
  }

  // 胴鳴り。基音と、梁の曲げの 2 番目の固有振動（整数倍ではなく約 2.3 倍）
  const f0 = r(95, 125)
  for (const [ratio, amp, decay] of [
    [1, 0.7, 0.42],
    [2.31, 0.5, 0.22],
  ] as const) {
    const o = ctx.createOscillator()
    o.frequency.setValueAtTime(f0 * ratio, at)
    o.frequency.exponentialRampToValueAtTime(f0 * ratio * 0.74, at + 0.14)
    const g = ctx.createGain()
    env(g, volume * amp, 0.003, decay)
    o.connect(g).connect(pre)
    o.start(at)
    o.stop(at + decay + 0.05)
  }

  // 木の響き。中域に絞った雑音
  {
    const src = ctx.createBufferSource()
    src.buffer = noise
    const bp = ctx.createBiquadFilter()
    bp.type = "bandpass"
    bp.frequency.value = r(200, 320)
    bp.Q.value = 1.6
    const g = ctx.createGain()
    env(g, volume * 3.2, 0.003, 0.17)
    src.connect(bp).connect(g).connect(pre)
    src.start(at, Math.random() * 1.5, 0.22)
  }

  // 打撃。丸めて小さく（明るい当たりは安っぽく聞こえる）
  {
    const src = ctx.createBufferSource()
    src.buffer = noise
    const lp = ctx.createBiquadFilter()
    lp.type = "lowpass"
    lp.frequency.value = 2600
    const g = ctx.createGain()
    env(g, volume * 0.45, 0.001, 0.02)
    src.connect(lp).connect(g).connect(p)
    src.start(at, Math.random() * 1.5, 0.05)
  }
}

export function createSoundEngine(): SoundEngine {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new Ctx()

  // --- 出口 ---
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  // 残響。減衰する雑音をその場で作って畳み込む（山の上の広い空間）
  const reverb = ctx.createConvolver()
  {
    const len = Math.floor(ctx.sampleRate * 3.4)
    const ir = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c)
      let prev = 0
      for (let i = 0; i < len; i++) {
        const t = i / ctx.sampleRate
        // 高い音ほど早く消えるよう、ごく軽く平均をとって丸める
        prev = prev * 0.6 + (Math.random() * 2 - 1) * 0.4
        d[i] = prev * Math.exp(-t * 2.1)
      }
    }
    reverb.buffer = ir
  }
  const wet = ctx.createGain()
  wet.gain.value = 0.55
  reverb.connect(wet)
  wet.connect(master)

  /** 音を鳴らす先。dry はそのまま、send は残響へ */
  const bus = (sendAmount: number) => {
    const g = ctx.createGain()
    g.connect(master)
    const send = ctx.createGain()
    send.gain.value = sendAmount
    g.connect(send)
    send.connect(reverb)
    return g
  }
  const ambientBus = bus(0.15)
  ambientBus.gain.value = SOUND.ambient
  const knockBus = bus(0.5)
  knockBus.gain.value = SOUND.knockLevel
  const fireBus = bus(0.2)
  const bellBus = bus(0.8)

  // 白色雑音。風・木槌の打撃・火の爆ぜる音の素になる
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  {
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }

  /** 雑音を短く鳴らす */
  const burst = (
    at: number,
    dur: number,
    filter: BiquadFilterType,
    freq: number,
    q: number,
    gain: number,
    out: AudioNode,
    pan = 0
  ) => {
    const src = ctx.createBufferSource()
    src.buffer = noise
    const f = ctx.createBiquadFilter()
    f.type = filter
    f.frequency.value = freq
    f.Q.value = q
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(gain, at + 0.002)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    const p = ctx.createStereoPanner()
    p.pan.value = pan
    src.connect(f).connect(g).connect(p).connect(out)
    src.start(at, Math.random() * 1.5, dur + 0.05)
  }

  // --- 夜の気配 ---
  const running: Array<AudioScheduledSourceNode> = []

  // 風。低く絞った雑音の音量を、ゆっくり波打たせる
  {
    const src = ctx.createBufferSource()
    src.buffer = noise
    src.loop = true
    const lp = ctx.createBiquadFilter()
    lp.type = "lowpass"
    lp.frequency.value = 420
    const g = ctx.createGain()
    g.gain.value = 0.05
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.07
    const depth = ctx.createGain()
    depth.gain.value = 0.035
    lfo.connect(depth).connect(g.gain)
    src.connect(lp).connect(g).connect(ambientBus)
    src.start()
    lfo.start()
    running.push(src, lfo)
  }

  // 虫。高い正弦波を細かく刻んで「リーリーリー」と鳴らす。声ごとに高さと位置を変える
  const crickets = [4300, 4650, 4050].map((hz, i) => {
    const o = ctx.createOscillator()
    o.frequency.value = hz
    const g = ctx.createGain()
    g.gain.value = 0
    const p = ctx.createStereoPanner()
    p.pan.value = [-0.6, 0.5, 0.1][i]
    o.connect(g).connect(p).connect(ambientBus)
    o.start()
    running.push(o)
    return { gain: g.gain, next: ctx.currentTime + rand(0.2, 1.5), level: [0.018, 0.013, 0.01][i] }
  })

  /** 虫の声を少し先まで予約しておく */
  const scheduleCrickets = () => {
    const horizon = ctx.currentTime + 1.2
    for (const c of crickets) {
      while (c.next < horizon) {
        const pulses = 3 + Math.floor(Math.random() * 3)
        let t = c.next
        for (let k = 0; k < pulses; k++) {
          c.gain.setTargetAtTime(c.level, t, 0.004)
          c.gain.setTargetAtTime(0, t + 0.028, 0.006)
          t += 0.045
        }
        c.next = t + rand(0.5, 1.8)
      }
    }
  }

  // --- 木槌 ---
  const knock = (at: number) => {
    const v = SOUND.knockVolume * rand(0.65, 1)
    const pan = rand(-0.6, 0.6)
    synthKnock(ctx, knockBus, noise, at, v, pan)
    // ときどき、打ち込みを確かめるようにもう一度、少し弱く
    if (Math.random() < SOUND.knockDouble) {
      synthKnock(ctx, knockBus, noise, at + rand(0.19, 0.27), v * 0.55, pan)
    }
  }

  // --- 梵鐘 ---
  const bell = (at: number) => {
    const f = SOUND.bellHz
    // [倍音の比, 大きさ, 消えるまでの秒]。基音とわずかにずれた音を重ねて「うなり」を出す
    const partials: Array<[number, number, number]> = [
      [1.0, 1.0, 11],
      [1.007, 0.7, 11],
      [2.02, 0.45, 7],
      [2.74, 0.3, 5],
      [3.91, 0.2, 3.4],
      [5.37, 0.13, 2.4],
      [6.88, 0.07, 1.6],
    ]
    for (const [ratio, amp, decay] of partials) {
      const o = ctx.createOscillator()
      o.frequency.value = f * ratio
      const g = ctx.createGain()
      const v = SOUND.bellVolume * amp * 0.35
      g.gain.setValueAtTime(0, at)
      g.gain.linearRampToValueAtTime(v, at + 0.008)
      g.gain.exponentialRampToValueAtTime(0.0001, at + decay)
      o.connect(g).connect(bellBus)
      o.start(at)
      o.stop(at + decay + 0.1)
    }
    // 撞木が当たる瞬間の鈍い打撃音
    burst(at, 0.09, "lowpass", 900, 0.7, SOUND.bellVolume * 0.5, bellBus)
  }

  // --- 状態 ---
  let enabled = false
  let active = true
  let lastRaw = -1
  let knockAcc = 0
  let knockNext = rand(...SOUND.knockEvery)
  let bellArmed = true
  let timer: number | null = null

  const applyLevel = () => {
    const on = enabled && active
    const now = ctx.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(on ? SOUND.master : 0, now + SOUND.fade)
    if (on) {
      if (ctx.state !== "running") void ctx.resume()
      if (timer === null) {
        scheduleCrickets()
        timer = window.setInterval(scheduleCrickets, 400)
      }
    } else if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
  }

  return {
    setEnabled(on) {
      enabled = on
      // 操作の中で必ず resume する（iOS はここでしか音が出るようにならない）
      if (on) void ctx.resume()
      applyLevel()
    },
    setActive(a) {
      if (a === active) return
      active = a
      applyLevel()
    },
    update(raw, dt) {
      if (!enabled || !active || ctx.state !== "running") {
        lastRaw = raw
        return
      }
      const now = ctx.currentTime + 0.02

      // 木槌。建て方の範囲で、進んだぶんだけ鳴らす（止まっていれば鳴らない）
      if (lastRaw >= 0) {
        const d = Math.min(Math.abs(raw - lastRaw), 0.02)
        if (raw > SOUND.knockRange[0] && raw < SOUND.knockRange[1]) {
          knockAcc += d
          if (knockAcc >= knockNext) {
            knockAcc = 0
            knockNext = rand(...SOUND.knockEvery)
            knock(now + rand(0, 0.03))
          }
        }
      }

      // 梵鐘。篝火が燃え上がる瞬間を下から越えたら一打
      if (bellArmed && lastRaw >= 0 && lastRaw < IGNITE.fireStart && raw >= IGNITE.fireStart) {
        bell(now)
        bellArmed = false
      }
      if (raw < SOUND.bellRearm) bellArmed = true

      // 篝火の爆ぜる音。燃えている火の量に比例して、ときどき鳴らす
      const fire = Math.min(1, Math.max(0, (raw - IGNITE.fireStart) / 0.03))
      if (fire > 0 && Math.random() < fire * SOUND.crackleRate * dt) {
        burst(now, rand(0.006, 0.022), "highpass", rand(1500, 3200), 0.8, SOUND.crackleVolume * rand(0.4, 1), fireBus, rand(-0.5, 0.5))
      }

      lastRaw = raw
    },
    dispose() {
      if (timer !== null) window.clearInterval(timer)
      for (const s of running) {
        try {
          s.stop()
        } catch {
          /* 既に止まっている */
        }
      }
      void ctx.close()
    },
  }
}
