import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "株式会社山蔵 | 宮大工の技でつくる、住まいの芸術",
  description:
    "滋賀・京都エリアの建設会社。宮大工の伝統技術と現代建築を融合し、新築住宅からリフォーム、社寺建築まで幅広く対応。一級建築士による設計・監理で安心の家づくりをサポートします。",
  keywords: "建設会社,滋賀,京都,宮大工,新築,リフォーム,一級建築士,伝統建築,社寺建築",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
