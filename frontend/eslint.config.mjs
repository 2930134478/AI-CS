// Next.js 16 ESLint 配置
// 简化配置，避免 FlatCompat 的循环引用问题
// 只定义忽略规则，让 Next.js 在构建时处理其他规则

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "*.config.*",
      "dist/**",
    ],
  },
];
