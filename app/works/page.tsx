"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Phone, Filter } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export default function WorksPage() {
  const [selectedCategory, setSelectedCategory] = useState("すべて")

  const works = [
    {
      id: 1,
      title: "阪本7丁目事務所建築",
      category: "新築工事",
      image: "/images/sakamoto-office.jpg",
      period: "2024年11月～2025年2月",
      location: "滋賀県大津市",
      description:
        "田んぼだった土地に事務所を新築。お客様から「こんな金額でできたんですか！？」と驚きの声をいただきました。",
      details: "更地から事務所建築",
      features: ["鉄骨造", "事務所用途", "駐車場完備", "省エネ設計"],
      categoryColor: "bg-blue-100 text-blue-800",
    },
    {
      id: 2,
      title: "妙法院柱修復工事",
      category: "文化財修復",
      image: "/images/myohoin-repair.jpg",
      period: "2024年春",
      location: "京都府",
      description: "宮大工修業時代からの繋がりで依頼された文化財修復工事。伝統技術を活かした丁寧な施工を行いました。",
      details: "柱の穴埋め修復",
      features: ["伝統工法", "文化財保護", "継手・仕口技術", "木材選定"],
      categoryColor: "bg-green-100 text-green-800",
    },
    {
      id: 4,
      title: "住宅新築工事",
      category: "新築工事",
      image: "/images/new-construction.jpg",
      period: "2024年春～夏",
      location: "滋賀県大津市",
      description: "お客様のこだわりを活かした木造住宅。宮大工の技術を現代住宅に融合させました。",
      details: "木造2階建て住宅",
      features: ["木造軸組工法", "自然素材使用", "耐震等級3", "省エネ住宅"],
      categoryColor: "bg-blue-100 text-blue-800",
    },
    {
      id: 5,
      title: "古民家リノベーション",
      category: "リフォーム",
      image: "/images/renovation.jpg",
      period: "2023年秋～冬",
      location: "京都府",
      description: "築100年の古民家を現代の暮らしに合わせてリノベーション。伝統美を残しながら快適性を向上。",
      details: "全面改修工事",
      features: ["伝統工法保持", "断熱性能向上", "設備更新", "耐震補強"],
      categoryColor: "bg-orange-100 text-orange-800",
    },
    {
      id: 6,
      title: "神社鳥居修復",
      category: "文化財修復",
      image: "/images/temple.jpg",
      period: "2023年夏",
      location: "滋賀県",
      description: "地域の神社の鳥居修復工事。宮大工の伝統技術を活かした本格的な修復を実施。",
      details: "鳥居の修復・塗装",
      features: ["伝統工法", "木材加工", "継手技術", "塗装仕上げ"],
      categoryColor: "bg-green-100 text-green-800",
    },
  ]

  const categories = ["すべて", "新築工事", "リフォーム", "文化財修復", "特殊工事"]

  const filteredWorks =
    selectedCategory === "すべて" ? works : works.filter((work) => work.category === selectedCategory)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border">
                <Image
                  src="/images/logo.jpg"
                  alt="株式会社山蔵ロゴ"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">株式会社山蔵</h1>
                <p className="text-sm text-gray-600">宮大工の技でつくる、住まいの芸術</p>
              </div>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-black transition-colors">
                ホーム
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-black transition-colors">
                会社案内
              </Link>
              <Link href="/services" className="text-gray-700 hover:text-black transition-colors">
                事業内容
              </Link>
              <Link href="/works" className="text-black font-medium">
                施工実績
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-black transition-colors">
                お問い合わせ
              </Link>
            </nav>
            <Button className="bg-black hover:bg-gray-800">
              <Phone className="w-4 h-4 mr-2" />
              お問い合わせ
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-black">
              ホーム
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-black font-medium">施工実績</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-amber-50 to-orange-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">施工実績</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              新築住宅から文化財修復まで、これまでに手がけた代表的な施工事例をご紹介します。
              宮大工の伝統技術と現代建築の融合をご覧ください。
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>2023年〜現在</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>滋賀県・京都府</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">工事実績一覧</h2>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600">カテゴリー別表示</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === selectedCategory ? "default" : "outline"}
                size="sm"
                className={selectedCategory === category ? "bg-black hover:bg-gray-800" : ""}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Works Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorks.map((work) => (
              <Card key={work.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="relative overflow-hidden">
                  <Image
                    src={work.image || "/placeholder.svg"}
                    alt={work.title}
                    width={400}
                    height={300}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className={`${work.categoryColor} font-medium`}>{work.category}</Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-amber-600 transition-colors">
                    {work.title}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{work.period}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{work.location}</span>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm mb-4 leading-relaxed">{work.description}</p>

                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">主な特徴</h4>
                    <div className="flex flex-wrap gap-1">
                      {work.features.map((feature, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {work.id === 1 ? (
                    <Link href={`/works/${work.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full group-hover:bg-black group-hover:text-white transition-colors bg-transparent"
                      >
                        詳細を見る
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-gray-100 text-gray-400 cursor-not-allowed"
                      disabled
                    >
                      準備中
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">施工実績数</h2>
            <p className="text-xl text-gray-600">これまでの実績をご紹介</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-black mb-2">50+</div>
              <div className="text-gray-600">新築住宅</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-black mb-2">100+</div>
              <div className="text-gray-600">リフォーム</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-black mb-2">20+</div>
              <div className="text-gray-600">文化財修復</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-black mb-2">7年</div>
              <div className="text-gray-600">創業からの実績</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">お客様の理想を形にします</h2>
            <p className="text-xl text-gray-300 mb-8">
              新築・リフォーム・特殊工事まで、どんなご要望でもお気軽にご相談ください。 無料でお見積もりいたします。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                <Phone className="w-5 h-5 mr-2" />
                電話で相談する
              </Button>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                >
                  お問い合わせフォーム
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <Image
                    src="/images/logo.jpg"
                    alt="株式会社山蔵ロゴ"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold">株式会社山蔵</h3>
                  <p className="text-sm text-gray-400">宮大工の技でつくる、住まいの芸術</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                伝統建築の技術を現代住宅に活かし、お客様に喜んでもらえる家づくりを心がけています。
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">事業内容</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>新築住宅設計・施工</li>
                <li>リフォーム・リノベーション</li>
                <li>外構・エクステリア</li>
                <li>社寺建築</li>
                <li>公共工事</li>
                <li>建物監理・監修</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">会社情報</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>滋賀県大津市下坂本3-14-27</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>8:00-18:00（不定休）</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>077-576-3727</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">&copy; 2024 株式会社山蔵. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
