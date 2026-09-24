/** @type {import('next').NextConfig} */
const nextConfig = {
  // 型チェックを有効にしてある（元は true ＝ 無視だった）。
  // 潜在していた型エラー 9 件はすべて解消済みで、この状態でビルドが通る。
  // ESLint はこのプロジェクトに未導入のため、ignoreDuringBuilds は現状 効果がない。
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
