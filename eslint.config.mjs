import next from "@next/eslint-plugin-next"

// Flat config using the Next.js plugin directly. FlatCompat + eslint-config-next
// trips a circular-structure bug on ESLint 9, so we wire the plugin's own flat
// config (`core-web-vitals`) instead.
const eslintConfig = [
  { ignores: ["node_modules/**", ".next/**", "next-env.d.ts"] },
  next.configs["core-web-vitals"],
]

export default eslintConfig
