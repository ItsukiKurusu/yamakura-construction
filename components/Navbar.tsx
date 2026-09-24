"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Phone, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

const navLinks = [
  { href: "/", label: "ホーム" },
  { href: "/about", label: "会社案内" },
  { href: "/services", label: "事業内容" },
  { href: "/works", label: "施工実績" },
  { href: "/recruit", label: "採用情報" },
  { href: "/contact", label: "お問い合わせ" },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === "/"

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const transparent = isHome && !scrolled && !mobileOpen

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        transparent
          ? "bg-transparent"
          : "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* ロゴ。マークは白地の箱に入れず、背景に合わせて白と墨色を差し替える。
              社名とサブ見出しは明朝で字間を開け、看板の彫り文字の品に寄せる */}
          <Link href="/" className="flex items-center gap-3">
            <span className="relative block h-11 w-11 shrink-0">
              <Image
                src="/images/logo-mark-white-sm.webp"
                alt=""
                width={256}
                height={261}
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
                  transparent ? "opacity-100" : "opacity-0"
                }`}
              />
              <Image
                src="/images/logo-mark-black.webp"
                alt=""
                width={256}
                height={261}
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
                  transparent ? "opacity-0" : "opacity-100"
                }`}
              />
            </span>
            <span
              aria-hidden="true"
              className={`hidden h-9 w-px transition-colors duration-300 sm:block ${
                transparent ? "bg-white/35" : "bg-gray-300"
              }`}
            />
            <span
              className={`flex flex-col font-mincho leading-none transition-colors duration-300 ${
                transparent ? "text-white" : "text-gray-900"
              }`}
            >
              <span className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-medium tracking-[0.2em] opacity-75">株式会社</span>
                <span className="text-[22px] font-extrabold tracking-[0.22em]">山蔵</span>
              </span>
              <span
                className={`mt-1.5 text-[10.5px] font-medium tracking-[0.2em] transition-colors duration-300 ${
                  transparent ? "text-white/70" : "text-gray-500"
                }`}
              >
                宮大工の技でつくる、住まいの芸術
              </span>
            </span>
          </Link>

          {/* デスクトップナビ */}
          <nav className="hidden lg:flex items-center space-x-5 xl:space-x-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors relative group/link ${
                  pathname === link.href
                    ? transparent
                      ? "text-white font-semibold"
                      : "text-black font-semibold"
                    : transparent
                    ? "text-white/80 hover:text-white"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-px transition-all duration-300 ${
                    transparent ? "bg-white" : "bg-black"
                  } ${pathname === link.href ? "w-full" : "w-0 group-hover/link:w-full"}`}
                />
              </Link>
            ))}
          </nav>

          {/* デスクトップCTA */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* 一番かさばるうえ、フッターにも同じ内容がある。
                狭いところでは落として、ナビと問い合わせボタンを優先する */}
            <div className="hidden text-right xl:block">
              <p className={`text-xs transition-colors duration-300 ${transparent ? "text-white/70" : "text-gray-500"}`}>
                お気軽にお電話ください
              </p>
              <p className={`text-sm font-semibold transition-colors duration-300 ${transparent ? "text-white" : "text-black"}`}>
                8:00-18:00
              </p>
            </div>
            <Button
              className={`transition-all duration-300 ${
                transparent ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-gray-800"
              }`}
              asChild
            >
              <a href="tel:077-576-3727">
                <Phone className="w-4 h-4 mr-2" />
                お問い合わせ
              </a>
            </Button>
          </div>

          {/* モバイルメニューボタン */}
          <button
            className={`lg:hidden p-2 transition-colors ${
              transparent ? "text-white hover:text-white/80" : "text-gray-700 hover:text-black"
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="メニュー"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* モバイルメニュー */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden bg-white border-t border-gray-100"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-3 px-4 rounded-lg text-sm transition-colors ${
                    pathname === link.href
                      ? "bg-gray-50 text-black font-semibold"
                      : "text-gray-700 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-100 mt-2">
                <Button className="w-full bg-black hover:bg-gray-800" asChild>
                  <a href="tel:077-576-3727">
                    <Phone className="w-4 h-4 mr-2" />
                    077-576-3727
                  </a>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
