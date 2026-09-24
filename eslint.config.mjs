import { FlatCompat } from "@eslint/eslintrc"

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

/**
 * ESLint の設定。
 *
 * これまでプロジェクトに ESLint が入っておらず、
 * next.config.mjs の `eslint.ignoreDuringBuilds: false` は**効果が無かった**。
 * 入れたことで、ビルド時に実際の検査が走るようになる。
 */
const config = [
  {
    ignores: [".next/**", "node_modules/**", "public/**", "scripts/**"],
  },
  ...compat.extends("next/core-web-vitals"),
]

export default config
