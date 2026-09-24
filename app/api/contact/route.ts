import { NextResponse } from "next/server"

/**
 * お問い合わせの送信。
 *
 * **これが無い状態で「ありがとうございます。後日ご連絡いたします」とだけ
 * 表示していた。** 入力内容はどこにも送られず、静かに消えていた。
 * 問い合わせが届いていると思い込むのは、届かないことより悪い。
 *
 * メール送信は Resend の HTTP API を fetch で叩くだけにしてある。
 * npm の依存を増やさずに済み、他のサービスへ乗り換えるのも
 * この 1 ファイルを直すだけで済む。
 *
 * **必要な環境変数（未設定なら 501 を返して、成功を騙らない）**
 *   RESEND_API_KEY      … https://resend.com で取得
 *   CONTACT_TO_EMAIL    … 受信するアドレス（山蔵さんの窓口）
 *   CONTACT_FROM_EMAIL  … 送信元。Resend で認証済みのドメインのもの
 */

const MAX = { name: 100, phone: 40, email: 200, subject: 120, message: 4000 }

type Body = {
  name?: string
  phone?: string
  email?: string
  subject?: string
  message?: string
  /** 罠。人間には見えない項目なので、埋まっていれば機械 */
  company?: string
}

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : ""

export async function POST(request: Request) {
  let body: Body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "形式が正しくありません" }, { status: 400 })
  }

  // 罠に掛かったものは、成功したふりをして捨てる。
  // 弾いたことを教えると、避け方を学習されるため
  if (clean(body.company, 100)) {
    return NextResponse.json({ ok: true })
  }

  const name = clean(body.name, MAX.name)
  const phone = clean(body.phone, MAX.phone)
  const email = clean(body.email, MAX.email)
  const subject = clean(body.subject, MAX.subject)
  const message = clean(body.message, MAX.message)

  const missing: string[] = []
  if (!name) missing.push("お名前")
  if (!phone) missing.push("電話番号")
  if (!message) missing.push("お問い合わせ内容")
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    missing.push("メールアドレスの形式")
  }
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `${missing.join("・")}をご確認ください` },
      { status: 400 }
    )
  }

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  const from = process.env.CONTACT_FROM_EMAIL

  // **未設定なら成功を騙らない。** 画面側は電話と LINE をご案内する
  if (!apiKey || !to || !from) {
    return NextResponse.json({ configured: false }, { status: 501 })
  }

  const lines = [
    `お名前: ${name}`,
    `電話番号: ${phone}`,
    `メール: ${email || "（未記入）"}`,
    `ご用件: ${subject || "（未選択）"}`,
    "",
    "── お問い合わせ内容 ──",
    message,
  ].join("\n")

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        // 返信ボタンでそのままお客様へ返せるようにする
        reply_to: email || undefined,
        subject: `【ホームページ】${subject || "お問い合わせ"}／${name} 様`,
        text: lines,
      }),
    })

    if (!res.ok) {
      // 送信側の事情は利用者に出さない。ログにだけ残す
      console.error("contact: resend failed", res.status, await res.text())
      return NextResponse.json({ error: "送信に失敗しました" }, { status: 502 })
    }
  } catch (e) {
    console.error("contact: resend error", e)
    return NextResponse.json({ error: "送信に失敗しました" }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
