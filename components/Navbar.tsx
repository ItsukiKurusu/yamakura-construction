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
          {/* ロゴ */}
          <Link href="/" className="flex items-center space-x-3">
            <div
              className={`w-11 h-11 rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300 ${
                transparent
                  ? "bg-white/20 backdrop-blur-sm border border-white/30"
                  : "bg-white border border-gray-200"
              }`}
            >
              <Image
                src="/images/logo.jpg"
                alt="株式会社山蔵ロゴ"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p
                className={`text-lg font-bold leading-tight transition-colors duration-300 ${
                  transparent ? "text-white" : "text-gray-900"
                }`}
              >
                株式会社山蔵
              </p>
              <p
                className={`text-xs transition-colors duration-300 ${
                  transparent ? "text-white/70" : "text-gray-500"
                }`}
              >
                宮大工の技でつくる、住まいの芸術
              </p>
            </div>
          </Link>

          {/* デスクトップナビ */}
          <nav className="hidden md:flex items-center space-x-7">
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
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
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
            className={`md:hidden p-2 transition-colors ${
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
            className="md:hidden overflow-hidden bg-white border-t border-gray-100"
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
