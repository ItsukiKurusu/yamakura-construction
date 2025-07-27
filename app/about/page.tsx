import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Users, Building, Calendar, Phone } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">山</span>
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
              <Link href="/about" className="text-black font-medium">
                会社案内
              </Link>
              <Link href="/services" className="text-gray-700 hover:text-black transition-colors">
                事業内容
              </Link>
              <Link href="/works" className="text-gray-700 hover:text-black transition-colors">
                施工実績
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-black transition-colors">
                お問い合わせ
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-amber-50 to-orange-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">会社案内</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            宮大工の伝統技術と現代建築の融合で、お客様の理想を形にします
          </p>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Image
                src="/images/yamaguchi.jpg"
                alt="代表 山口祐介"
                width={600}
                height={500}
                className="rounded-lg shadow-xl"
              />
            </div>
            <div className="space-y-6">
              <div>
                <Badge className="mb-4 bg-gray-100 text-black">代表挨拶</Badge>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">代表取締役 山口祐介</h2>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    宮大工で修業を積みながら一級建築士の資格を取得したため、現場作業も設計など工法の知識も豊富です。
                    宮大工で修業を積んだため、日本古来の木組み、継手、仕口を特に得意としています。
                  </p>
                  <p>
                    小さい会社であり販管費がかからないため、コストを下げることができ、
                    お客様により良いものをお届けできます。なんでもできる技術力と柔軟性で、
                    簡単なリフォームから鳥居の額制作まで幅広く対応しています。
                  </p>
                  <p className="font-semibold text-black">「お客様に喜んでもらうのが一番」</p>
                  <p>この想いを胸に、一つ一つの工事に心を込めて取り組んでいます。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">会社概要</h2>
            <p className="text-xl text-gray-600">株式会社山蔵の基本情報</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-600">社名</span>
                      <span className="font-semibold text-gray-900">株式会社山蔵</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-600">代表取締役</span>
                      <span className="font-semibold text-gray-900">山口祐介</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-600">設立</span>
                      <span className="font-semibold text-gray-900">2017年12月01日</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-600">営業時間</span>
                      <span className="font-semibold text-gray-900">8:00-18:00</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-600">所在地</span>
                      <span className="font-semibold text-gray-900">
                        〒520-0105
                        <br />
                        滋賀県大津市下坂本3-14-27
                      </span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-600">対応エリア</span>
                      <span className="font-semibold text-gray-900">滋賀県・京都府</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-600">定休日</span>
                      <span className="font-semibold text-gray-900">不定休</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Qualifications & Licenses */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">保有資格・許可</h2>
            <p className="text-xl text-gray-600">確かな技術と信頼の証</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8 text-black" />
                </div>
                <h3 className="font-bold text-gray-900">一級建築士</h3>
                <p className="text-sm text-gray-600">設計・監理の専門資格</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Building className="w-8 h-8 text-black" />
                </div>
                <h3 className="font-bold text-gray-900">建設業許可</h3>
                <p className="text-sm text-gray-600">建設工事の許可取得済み</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-black" />
                </div>
                <h3 className="font-bold text-gray-900">宮大工修業</h3>
                <p className="text-sm text-gray-600">伝統技術の習得</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="w-8 h-8 text-black" />
                </div>
                <h3 className="font-bold text-gray-900">一級建築士事務所</h3>
                <p className="text-sm text-gray-600">設計事務所登録済み</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">経営理念</h2>
            <p className="text-xl text-gray-600">私たちが大切にしていること</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-12 text-center">
              <CardContent className="space-y-8">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white font-bold text-2xl">心</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">お客様に喜んでもらうのが一番</h3>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    私たちは、お客様の笑顔と満足が何よりも大切だと考えています。
                    宮大工の伝統技術と現代建築の知識を融合させ、 お客様一人ひとりのご要望に心を込めてお応えします。
                  </p>
                  <p>
                    小さな会社だからこそできる、きめ細やかなサービスと適正価格で、
                    お客様の理想の住まいづくりをサポートいたします。
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">スタッフ紹介</h2>
            <p className="text-xl text-gray-600">経験豊富な職人たちがお客様をサポート</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <Image
                  src="/images/yamaguchi.jpg"
                  alt="代表 山口祐介"
                  width={200}
                  height={200}
                  className="w-32 h-32 rounded-full mx-auto object-cover"
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">山口祐介</h3>
                  <p className="text-amber-600 font-medium">代表取締役</p>
                  <p className="text-sm text-gray-600 mt-2">一級建築士・宮大工修業経験</p>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="w-32 h-32 rounded-full mx-auto bg-amber-100 flex items-center justify-center">
                  <Users className="w-16 h-16 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">スタッフ募集中</h3>
                  <p className="text-amber-600 font-medium">大工職人</p>
                  <p className="text-sm text-gray-600 mt-2">やる気のある方歓迎</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recruitment */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">採用情報</h2>
            <p className="text-xl text-gray-600">一緒に働く仲間を募集しています</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <CardContent className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">大工職人募集</h3>
                  <p className="text-gray-600">経験者・未経験者問わず、やる気のある方を歓迎します</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">募集要項</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">職種</span>
                        <span className="font-medium">大工工事</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">給与</span>
                        <span className="font-medium">月給20万円〜</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">経験</span>
                        <span className="font-medium">不問</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">年齢</span>
                        <span className="font-medium">10代〜70代</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">求める人材</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                        <span>やる気のある方</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                        <span>10代の全く未経験の方</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                        <span>60代以上の経験者</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                        <span>技術向上に意欲的な方</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-gray-600 mb-6">
                    ※経験・能力によって給与を考慮いたします。まずはお気軽にご相談ください。
                  </p>
                  <Button size="lg" className="bg-black hover:bg-gray-800">
                    <Phone className="w-5 h-5 mr-2" />
                    採用についてお問い合わせ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">お気軽にご相談ください</h2>
            <p className="text-xl text-gray-300 mb-8">
              建築のことなら何でもお任せください。無料でお見積もりいたします。
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
    </div>
  )
}
