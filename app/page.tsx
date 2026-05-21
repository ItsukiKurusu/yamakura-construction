"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, MapPin, Users, Wrench, Heart, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { FadeIn, FadeInLeft, FadeInRight, StaggerContainer, StaggerItem } from "@/components/motion-utils"

const ease = [0.22, 1, 0.36, 1]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hero-video-VUVfU4ZDewR15nygcA9jRaAYYCOcZc.mp4" type="video/mp4" />
          <Image src="/placeholder.svg?height=1080&width=1920" alt="建設現場の様子" fill className="object-cover" />
        </video>

        <div className="absolute inset-0 bg-black bg-opacity-40"></div>

        <div className="relative z-10 text-center text-white px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
            >
              <Badge className="bg-black bg-opacity-30 text-white hover:bg-white hover:bg-opacity-30 mb-6 backdrop-blur-sm">
                滋賀・京都エリア対応
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45, ease }}
              className="mb-8"
            >
              <Image
                src="/images/letter.png"
                alt="後世につなげる、人も家も呼吸する建物。"
                width={1200}
                height={400}
                className="w-full max-w-5xl mx-auto h-auto"
                style={{
                  filter: "drop-shadow(4px 4px 8px rgba(0,0,0,0.7)) drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
                }}
                priority
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65, ease }}
              className="text-xl md:text-2xl mb-12 leading-relaxed max-w-3xl mx-auto text-white text-opacity-90"
            >
              宮大工の伝統技術を現代住宅に活かし、百年後も美しい家づくりをお手伝いします。
              一級建築士の資格を持つ宮大工が、お客様の想いを形にいたします。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.85, ease }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg" asChild>
                <a href="tel:077-576-3727">
                  <Phone className="w-6 h-6 mr-3" />
                  今すぐお問い合わせ
                </a>
              </Button>
              <Link href="/works">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-gray-900 bg-transparent px-8 py-4 text-lg backdrop-blur-sm"
                >
                  施工実績を見る
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce"
        >
          <div className="flex flex-col items-center space-y-2">
            <span className="text-sm opacity-75">SCROLL</span>
            <div className="w-px h-8 bg-white opacity-50"></div>
          </div>
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">私たちについて</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              宮大工で修業を積みながら一級建築士の資格を取得。現場作業も設計も熟知した職人が、
              お客様に喜んでもらうことを第一に、心を込めて家づくりをしています。
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <FadeInLeft>
              <Image
                src="/images/yamaguchi.jpg"
                alt="代表 山口祐介"
                width={500}
                height={400}
                className="rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              />
            </FadeInLeft>
            <FadeInRight>
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">代表挨拶</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    宮大工で修業を積みながら一級建築士の資格を取得したため、現場作業も設計など工法の知識も豊富です。
                    日本古来の木組み、継手、仕口を特に得意としています。
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    小さい会社であり販管費がかからないため、コストを下げることができ、
                    お客様により良いものをお届けできます。お客様に喜んでもらうのが一番の喜びです。
                  </p>
                </div>

                <div className="bg-amber-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">会社概要</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">社名</span>
                      <span className="font-medium">株式会社山蔵</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">代表</span>
                      <span className="font-medium">山口祐介</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">設立</span>
                      <span className="font-medium">2017年12月01日</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">所在地</span>
                      <span className="font-medium">滋賀県大津市下坂本3-14-27</span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInRight>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">選ばれる理由</h2>
            <p className="text-xl text-gray-600">なぜ多くのお客様に選ばれているのか</p>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            <StaggerItem>
              <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Heart className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">安心・安全</h3>
                  <p className="text-gray-600">
                    建設業許可取得済み。一級建築士による設計・監理で、 安心してお任せいただけます。
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Wrench className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">確かな技術</h3>
                  <p className="text-gray-600">
                    宮大工修業で培った伝統技術と現代建築の融合。 木を知る職人だからこその仕上がり。
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">適正価格</h3>
                  <p className="text-gray-600">
                    小さな会社だからこそ実現できる適正価格。 販管費を抑え、お客様に還元します。
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">事業内容</h2>
            <p className="text-xl text-gray-600">幅広い建築工事に対応いたします</p>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <StaggerItem>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="overflow-hidden">
                  <Image
                    src="/images/new-construction.jpg"
                    alt="新築住宅"
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">新築住宅</h3>
                  <p className="text-gray-600 mb-4">
                    一級建築士による設計から施工まで一貫対応。 お客様の理想の住まいを実現します。
                  </p>
                  <Badge variant="secondary">戸建て・アパート対応</Badge>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="overflow-hidden">
                  <Image
                    src="/images/renovation.jpg"
                    alt="リフォーム・リノベーション"
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">リフォーム・リノベーション</h3>
                  <p className="text-gray-600 mb-4">
                    簡単なリフォームから大規模リノベーションまで。 住まいの価値を高めます。
                  </p>
                  <Badge variant="secondary">部分改修から全面改修</Badge>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="overflow-hidden">
                  <Image
                    src="/images/exterior.jpg"
                    alt="外構・エクステリア"
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">外構・エクステリア</h3>
                  <p className="text-gray-600 mb-4">住まいの外観を美しく演出。 機能性とデザイン性を両立します。</p>
                  <Badge variant="secondary">庭・駐車場・門扉</Badge>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="overflow-hidden">
                  <Image
                    src="/images/temple.jpg"
                    alt="社寺建築"
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">社寺建築</h3>
                  <p className="text-gray-600 mb-4">宮大工の技術を活かした伝統建築。 文化財の修復・保全も承ります。</p>
                  <Badge variant="secondary">伝統工法</Badge>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="overflow-hidden">
                  <Image
                    src="/images/public-works.jpg"
                    alt="公共工事"
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">公共工事</h3>
                  <p className="text-gray-600 mb-4">公共施設の建設・改修工事。 地域社会への貢献を大切にします。</p>
                  <Badge variant="secondary">官公庁案件対応</Badge>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="overflow-hidden">
                  <Image
                    src="/images/building-management.jpg"
                    alt="ビル・建物監理"
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">ビル・建物監理</h3>
                  <p className="text-gray-600 mb-4">一級建築士による専門的な監理・監修。 品質管理を徹底します。</p>
                  <Badge variant="secondary">設計監理</Badge>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Works Section */}
      <section id="works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">施工実績</h2>
            <p className="text-xl text-gray-600">これまでの代表的な施工事例をご紹介</p>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <StaggerItem>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="overflow-hidden">
                  <Image
                    src="/images/sakamoto-office.jpg"
                    alt="坂本７丁目事務所建築"
                    width={400}
                    height={250}
                    className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <Badge className="mb-3 bg-gray-100 text-black">新築工事</Badge>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">坂本７丁目事務所建築</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>工期</span>
                      <span>2024年11月～2025年2月</span>
                    </div>
                    <div className="flex justify-between">
                      <span>工事内容</span>
                      <span>更地から事務所建築</span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">
                    田んぼだった土地に事務所を新築。お客様から「こんな金額でできたんですか！？」と
                    驚きの声をいただきました。
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="overflow-hidden">
                  <Image
                    src="/images/myohoin-repair.jpg"
                    alt="妙法院柱修復工事"
                    width={400}
                    height={250}
                    className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <Badge className="mb-3 bg-green-100 text-green-800">文化財修復</Badge>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">妙法院柱修復工事</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>工事内容</span>
                      <span>柱の穴埋め修復</span>
                    </div>
                    <div className="flex justify-between">
                      <span>技法</span>
                      <span>伝統工法</span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">
                    宮大工修業時代からの繋がりで依頼された文化財修復工事。 伝統技術を活かした丁寧な施工を行いました。
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>

          <FadeIn className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="border-black text-black hover:bg-gray-50 bg-transparent"
              asChild
            >
              <Link href="/works">施工実績をもっと見る</Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Instagram Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Instagram</h2>
            <p className="text-xl text-gray-600">最新の施工現場や作業風景をご紹介</p>
          </FadeIn>

          <FadeIn>
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">@yamakura_yusuke</h3>
                <p className="text-gray-600 mb-6">
                  施工現場の様子や伝統技術を活かした作業風景を
                  <br />
                  Instagramで随時更新しています
                </p>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">100+</div>
                    <div className="text-sm text-gray-600">フォロワー数</div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">建設現場</div>
                    <div className="text-sm text-gray-600">リアルタイム更新</div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">伝統技術</div>
                    <div className="text-sm text-gray-600">宮大工の技</div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white"
                  asChild
                >
                  <a href="https://www.instagram.com/yamakura_yusuke" target="_blank" rel="noopener noreferrer">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    Instagramで最新情報をチェック
                  </a>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6">お気軽にご相談ください</h2>
              <p className="text-xl text-gray-300 mb-8">
                新築からリフォーム、特殊工事まで幅広く対応。
                まずはお気軽にお問い合わせください。無料でお見積もりいたします。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100" asChild>
                  <a href="tel:077-576-3727">
                    <Phone className="w-5 h-5 mr-2" />
                    電話で相談する
                  </a>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">お問い合わせ</h2>
            <p className="text-xl text-gray-600">お気軽にお問い合わせください</p>
          </FadeIn>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              <FadeInLeft>
                <div className="space-y-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">お電話でのお問い合わせ</h3>
                      <p className="text-2xl font-bold text-black mb-1">077-576-3727</p>
                      <p className="text-gray-600">営業時間：8:00-18:00（不定休）</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">所在地</h3>
                      <p className="text-gray-700">〒520-0105</p>
                      <p className="text-gray-700">滋賀県大津市下坂本3-14-27</p>
                      <p className="text-gray-600 mt-1">対応エリア：滋賀県・京都府</p>
                    </div>
                  </div>
                </div>
              </FadeInLeft>

              <FadeInRight>
                <div className="flex flex-col items-center justify-center">
                  <Card className="p-8 text-center w-full hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="space-y-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .63.285.63.63v4.771zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.348 0 .63.285.63.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.628-.629.628M24 10.314C24 4.943 18.615.572 12.572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">LINE友達追加</h3>
                      <p className="text-gray-600 mb-4">LINEでお気軽にお問い合わせ・ご相談ください</p>

                      <Image
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent("https://line.me/R/ti/p/@037sqkeo")}`}
                        alt="LINE友達追加QRコード"
                        width={200}
                        height={200}
                        className="w-48 h-48 mx-auto rounded-lg"
                      />

                      <p className="text-sm text-gray-500">上記QRコードを読み取って友達追加してください</p>

                      <Button className="bg-green-600 hover:bg-green-700 text-white w-full" asChild>
                        <a href="https://line.me/R/ti/p/@037sqkeo" target="_blank" rel="noopener noreferrer">
                          LINEで相談する
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </FadeInRight>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
