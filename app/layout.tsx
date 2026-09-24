import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./mincho.css"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import SmoothScrollProvider from "@/components/SmoothScrollProvider"

const inter = Inter({ subsets: ["latin"] })

// 見出しと導入文の明朝体（しっぽり明朝）は next/font を使わず自前で配る。
// next/font のままだと日本語の断片を 244 個・約 7.5MB 読んでいた。
// scripts/build-mincho.py がサイトで使う文字だけに絞り、太さ 2 つで計 約 290KB にしている。
// 本文・ボタン・数字・フォームはゴシックのまま（小さい明朝はスマホで細く掠れる）

export const metadata: Metadata = {
  title: {
    default: "株式会社山蔵 | 滋賀・京都の建設会社 | 宮大工の技でつくる住まいの芸術",
    template: "%s | 株式会社山蔵",
  },
  description:
    "滋賀・京都エリアの建設会社。宮大工の伝統技術と現代建築を融合し、新築住宅からリフォーム、社寺建築まで幅広く対応。一級建築士による設計・監理で安心の家づくりをサポートします。",
  keywords: [
    "建設会社",
    "滋賀",
    "京都",
    "大津市",
    "宮大工",
    "新築住宅",
    "リフォーム",
    "一級建築士",
    "伝統建築",
    "社寺建築",
    "文化財修復",
    "外構工事",
    "公共工事",
    "木造住宅",
    "継手",
    "仕口",
    "伝統工法",
    "山口祐介",
    "株式会社山蔵",
  ],
  authors: [{ name: "株式会社山蔵" }],
  creator: "株式会社山蔵",
  publisher: "株式会社山蔵",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://v0-construction-company-website-eta.vercel.app"),
  // metadataBase からの相対。**各ページは自分の layout / page で上書きする。**
  // ここに絶対 URL を書くと、下層ページまでトップページを正規 URL として
  // 申告してしまい、検索結果から下層が消える
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "株式会社山蔵 | 滋賀・京都の建設会社 | 宮大工の技でつくる住まいの芸術",
    description:
      "滋賀・京都エリアの建設会社。宮大工の伝統技術と現代建築を融合し、新築住宅からリフォーム、社寺建築まで幅広く対応。",
    url: "https://v0-construction-company-website-eta.vercel.app",
    siteName: "株式会社山蔵",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/images/og.jpg",
        width: 1200,
        height: 630,
        alt: "株式会社山蔵 - 宮大工の技でつくる住まいの芸術",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "株式会社山蔵 | 滋賀・京都の建設会社",
    description: "宮大工の伝統技術と現代建築を融合した家づくり",
    images: ["/images/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        {/* 社名と見出し（700）は最初の画面に出るので先に取りにいく */}
        <link rel="preload" href="/fonts/shippori-mincho-700.woff2" as="font" type="font/woff2" crossOrigin="" />
        <meta name="geo.region" content="JP-25" />
        <meta name="geo.placename" content="大津市" />
        <meta name="geo.position" content="35.0116;135.8681" />
        <meta name="ICBM" content="35.0116, 135.8681" />
      </head>
      <body className={inter.className}>
        {/* Lenis はトップだけでなく全ページに掛ける。
            トップのみだと下層とスクロールの手触りが変わり一貫性が崩れるため。 */}
        <SmoothScrollProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
