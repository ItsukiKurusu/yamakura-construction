import type { Metadata } from "next"

/**
 * お問い合わせページのメタデータ。
 *
 * page.tsx が `"use client"` なので、そちらからは metadata を書き出せない。
 * 同じ階層に layout を置いて、サーバー側から与える。
 */
export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "新築・リフォーム・社寺建築のご相談はお気軽に。お電話（077-576-3727／8:00-18:00）またはフォームから承ります。お見積もりは無料です。",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "お問い合わせ | 株式会社山蔵",
    description: "新築・リフォーム・社寺建築のご相談はお気軽に。お電話（077-576-3727／8:00-18:00）またはフォームから承ります。お見積もりは無料です。",
    url: "/contact",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
