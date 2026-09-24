import Link from "next/link"
import Image from "next/image"
import { Phone, MapPin, Clock } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            {/* メニューバーと同じ組み方（白いマーク＋明朝の社名） */}
            <div className="mb-5 flex items-center gap-3">
              <Image
                src="/images/logo-mark-white-sm.webp"
                alt=""
                width={256}
                height={261}
                className="h-11 w-11 shrink-0 object-contain"
              />
              <span aria-hidden="true" className="h-9 w-px bg-white/25" />
              <div className="font-mincho leading-none">
                <h3 className="flex items-baseline gap-1.5">
                  <span className="text-[11px] font-medium tracking-[0.2em] text-gray-400">株式会社</span>
                  <span className="text-[22px] font-extrabold tracking-[0.22em]">山蔵</span>
                </h3>
                <p className="mt-1.5 text-[10.5px] font-medium tracking-[0.2em] text-gray-400">
                  宮大工の技でつくる、住まいの芸術
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              伝統建築の技術を現代住宅に活かし、お客様に喜んでもらえる家づくりを心がけています。
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-5">事業内容</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  新築住宅設計・施工
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  リフォーム・リノベーション
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  外構・エクステリア
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  社寺建築
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  公共工事
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  建物監理・監修
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-5">会社情報</h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>滋賀県大津市下坂本3-14-27</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>8:00-18:00（不定休）</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href="tel:077-576-3727" className="hover:text-white transition-colors">
                  077-576-3727
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-500 text-sm">&copy; 2024 株式会社山蔵. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
