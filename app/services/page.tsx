import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, MapPin, Clock, CheckCircle, Users, Wrench, Building, Hammer, TreePine, Shield } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ServicesPage() {
  const services = [
    {
      id: 1,
      title: "新築住宅",
      icon: Building,
      image: "/images/new-construction.jpg",
      description: "一級建築士による設計から施工まで一貫対応。お客様の理想の住まいを実現します。",
      features: [
        "木造軸組工法による堅牢な構造",
        "宮大工の技術を活かした継手・仕口",
        "自然素材を使用した健康住宅",
        "耐震等級3の安全設計",
        "省エネ住宅による光熱費削減",
        "将来のライフスタイル変化に対応",
      ],
      process: [
        "ご相談・現地調査",
        "プラン提案・お見積り",
        "設計・確認申請",
        "地盤調査・基礎工事",
        "上棟・構造工事",
        "内装・設備工事",
        "完成・お引き渡し",
      ],
      price: "坪単価60万円〜",
      period: "4〜6ヶ月",
    },
    {
      id: 2,
      title: "リフォーム・リノベーション",
      icon: Hammer,
      image: "/images/renovation.jpg",
      description: "簡単なリフォームから大規模リノベーションまで。住まいの価値を高めます。",
      features: [
        "部分改修から全面改修まで対応",
        "既存構造を活かした設計",
        "断熱性能の向上",
        "耐震補強工事",
        "バリアフリー対応",
        "最新設備への更新",
      ],
      process: [
        "現状調査・診断",
        "改修プラン提案",
        "詳細設計・お見積り",
        "工事開始",
        "中間検査",
        "仕上げ工事",
        "完成・お引き渡し",
      ],
      price: "100万円〜",
      period: "1〜3ヶ月",
    },
    {
      id: 3,
      title: "社寺建築",
      icon: TreePine,
      image: "/images/temple.jpg",
      description: "宮大工の技術を活かした伝統建築。文化財の修復・保全も承ります。",
      features: [
        "伝統工法による本格施工",
        "継手・仕口技術の継承",
        "文化財修復の豊富な経験",
        "木材の選定から加工まで",
        "歴史的価値の保全",
        "職人技術の結集",
      ],
      process: [
        "文化財調査・診断",
        "修復計画の策定",
        "材料調達・加工",
        "伝統工法による施工",
        "品質管理・検査",
        "完成・引き渡し",
        "アフターメンテナンス",
      ],
      price: "ご相談ください",
      period: "プロジェクトにより異なります",
    },
    {
      id: 4,
      title: "外構・エクステリア",
      icon: Users,
      image: "/images/exterior.jpg",
      description: "住まいの外観を美しく演出。機能性とデザイン性を両立します。",
      features: [
        "庭園・造園工事",
        "駐車場・アプローチ",
        "門扉・フェンス工事",
        "ウッドデッキ・テラス",
        "照明・電気工事",
        "水回り・排水工事",
      ],
      process: [
        "現地調査・測量",
        "デザイン提案",
        "詳細設計・積算",
        "工事着手",
        "造成・基礎工事",
        "仕上げ工事",
        "完成・お引き渡し",
      ],
      price: "50万円〜",
      period: "2週間〜2ヶ月",
    },
    {
      id: 5,
      title: "公共工事",
      icon: Shield,
      image: "/images/public-works.jpg",
      description: "公共施設の建設・改修工事。地域社会への貢献を大切にします。",
      features: [
        "官公庁案件への対応",
        "公共建築物の設計・施工",
        "学校・病院等の改修",
        "バリアフリー対応",
        "環境配慮型建築",
        "地域材の活用",
      ],
      process: [
        "入札参加・提案",
        "契約・詳細設計",
        "施工計画策定",
        "工事着手",
        "品質管理・安全管理",
        "完成検査",
        "引き渡し・保証",
      ],
      price: "案件により異なります",
      period: "3ヶ月〜1年",
    },
    {
      id: 6,
      title: "ビル・建物監理",
      icon: Wrench,
      image: "/images/building-management.jpg",
      description: "一級建築士による専門的な監理・監修。品質管理を徹底します。",
      features: [
        "一級建築士による監理",
        "工事品質の管理",
        "安全管理の徹底",
        "工程管理・調整",
        "法令遵守の確認",
        "完成検査・引き渡し",
      ],
      process: ["監理契約", "施工図面の確認", "工事監理開始", "定期検査・報告", "品質確認", "完成検査", "監理業務完了"],
      price: "工事費の3〜5%",
      period: "工事期間に準じます",
    },
  ]

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
              <Link href="/services" className="text-black font-medium">
                事業内容
              </Link>
              <Link href="/works" className="text-gray-700 hover:text-black transition-colors">
                施工実績
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-black transition-colors">
                お問い合わせ
              </Link>
            </nav>
            <Button className="bg-black hover:bg-gray-800" asChild>
              <a href="tel:077-576-3727">
                <Phone className="w-4 h-4 mr-2" />
                お問い合わせ
              </a>
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
            <span className="text-black font-medium">事業内容</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-amber-50 to-orange-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">事業内容</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            新築住宅から文化財修復まで、宮大工の伝統技術と現代建築の融合で、 幅広い建築工事に対応いたします。
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {services.map((service) => (
              <Card key={service.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="relative">
                  <Image
                    src={service.image || "/placeholder.svg"}
                    alt={service.title}
                    width={600}
                    height={300}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                      <service.icon className="w-6 h-6 text-black" />
                    </div>
                  </div>
                </div>

                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">{service.description}</p>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">主な特徴</h4>
                      <ul className="space-y-2">
                        {service.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">施工の流れ</h4>
                      <ul className="space-y-2">
                        {service.process.slice(0, 3).map((step, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm">
                            <span className="w-5 h-5 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <span className="text-gray-700">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">目安価格:</span>
                        <span className="ml-2 text-gray-900">{service.price}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">工期:</span>
                        <span className="ml-2 text-gray-900">{service.period}</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full bg-black hover:bg-gray-800" asChild>
                    <a href="tel:077-576-3727">
                      <Phone className="w-4 h-4 mr-2" />
                      この工事について相談する
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">選ばれる理由</h2>
            <p className="text-xl text-gray-600">なぜ多くのお客様に選ばれているのか</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">宮大工の技術</h3>
                <p className="text-gray-600">
                  宮大工修業で培った伝統技術と現代建築の融合。木を知る職人だからこその仕上がり。
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">一級建築士</h3>
                <p className="text-gray-600">一級建築士による設計・監理で、安心してお任せいただけます。</p>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">適正価格</h3>
                <p className="text-gray-600">
                  小さな会社だからこそ実現できる適正価格。販管費を抑え、お客様に還元します。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">お気軽にご相談ください</h2>
            <p className="text-xl text-gray-300 mb-8">
              どんな小さな工事でも、まずはお気軽にお問い合わせください。 無料でお見積もりいたします。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100" asChild>
                <a href="tel:077-576-3727">
                  <Phone className="w-5 h-5 mr-2" />
                  電話で相談する
                </a>
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
                  <Clock className="w-4 h-4" />
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
