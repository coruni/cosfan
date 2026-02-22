# Next.js 项目构建输出说明

## 📦 构建目录

### 主要构建目录：`.next/`

这是 Next.js 的默认构建输出目录，包含所有编译后的文件。

## 🗂️ 目录结构说明

```
.next/
├── server/              # 服务端代码
│   ├── app/            # App Router 页面（服务端组件）
│   ├── pages/          # Pages Router 页面（如果使用）
│   ├── chunks/         # 代码分块
│   └── middleware/     # 中间件代码
│
├── static/             # 静态资源
│   ├── chunks/         # 客户端 JavaScript 分块
│   ├── media/          # 媒体文件（字体、图片等）
│   └── [BUILD_ID]/     # 构建ID目录（用于缓存）
│
├── cache/              # 构建缓存
│   ├── fetch-cache/    # Fetch 请求缓存
│   └── images/         # 图片优化缓存
│
├── types/              # TypeScript 类型定义
│   └── routes.d.ts     # 路由类型
│
└── [配置文件]
    ├── BUILD_ID        # 构建ID
    ├── routes-manifest.json      # 路由清单
    ├── prerender-manifest.json   # 预渲染清单
    └── ...其他配置文件
```

## 🚀 构建命令

### 开发模式
```bash
npm run dev
```
- 启动开发服务器
- 使用 `.next/dev/` 目录
- 支持热更新（HMR）
- 端口：默认 3000

### 生产构建
```bash
npm run build
```
- 编译生产版本
- 输出到 `.next/` 目录
- 优化代码和资源
- 生成静态文件

### 启动生产服务器
```bash
npm start
```
- 启动生产服务器
- 使用 `.next/` 目录的构建文件
- 端口：默认 3000

## 📁 关键文件说明

### 1. `.next/BUILD_ID`
- 唯一的构建标识符
- 用于缓存管理
- 每次构建都会更新

### 2. `.next/routes-manifest.json`
- 所有路由的清单
- 包含动态路由配置
- 重定向和重写规则

### 3. `.next/prerender-manifest.json`
- 预渲染页面列表
- ISR (Incremental Static Regeneration) 配置
- 包含 revalidate 时间

### 4. `.next/server/app/`
- App Router 的服务端代码
- 包含所有页面组件
- 服务端组件和 API 路由

### 5. `.next/static/chunks/`
- 客户端 JavaScript 代码分块
- 按需加载的代码
- 优化后的生产代码

## 🔧 配置说明

### next.config.ts 关键配置

```typescript
const nextConfig: NextConfig = {
  // 图片优化配置
  images: {
    remotePatterns: [...],  // 允许的远程图片域名
    formats: ['image/avif', 'image/webp'],  // 支持的图片格式
    unoptimized: true,      // 禁用图片优化（开发时）
  },
  
  // 实验性功能
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },
  
  // 安全头部
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

## 📊 构建输出类型

### 1. 服务端渲染 (SSR)
- 文件位置：`.next/server/app/`
- 运行时：Node.js 服务器
- 特点：动态生成 HTML

### 2. 静态生成 (SSG)
- 文件位置：`.next/server/app/` + HTML 文件
- 构建时：生成静态 HTML
- 特点：最快的加载速度

### 3. 增量静态再生成 (ISR)
- 配置：`export const revalidate = 3600`
- 特点：定期更新静态页面
- 示例：sitemap.ts 使用 ISR

### 4. 客户端渲染 (CSR)
- 文件位置：`.next/static/chunks/`
- 运行时：浏览器
- 特点：交互式组件

## 🚢 部署选项

### 1. Vercel（推荐）
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```
- 自动构建和部署
- 全球 CDN
- 零配置

### 2. 自托管（Node.js）
```bash
# 构建
npm run build

# 启动
npm start
```
- 需要 Node.js 环境
- 使用 `.next/` 目录
- 端口：3000（可配置）

### 3. Docker 部署
```dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码和构建文件
COPY . .
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

### 4. 静态导出（如果适用）
```typescript
// next.config.ts
const nextConfig = {
  output: 'export',  // 导出为静态 HTML
};
```
```bash
npm run build
# 输出到 out/ 目录
```

## 📦 需要部署的文件

### 必需文件
```
.next/              # 构建输出（完整目录）
public/             # 静态资源
package.json        # 依赖配置
package-lock.json   # 锁定依赖版本
next.config.ts      # Next.js 配置
.env.production     # 生产环境变量
```

### 不需要部署的文件
```
src/                # 源代码（已编译到 .next/）
node_modules/       # 依赖（在服务器上重新安装）
.git/               # Git 仓库
.vscode/            # 编辑器配置
*.md                # 文档文件
```

## 🔍 构建分析

### 查看构建大小
```bash
npm run build
```
输出示例：
```
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         120 kB
├ ○ /article/[id]                        8.1 kB         123 kB
├ ○ /discover                            6.3 kB         121 kB
└ ○ /sitemap.xml                         0 B                0 B

○  (Static)  prerendered as static content
```

### 分析工具
```bash
# 安装分析工具
npm install --save-dev @next/bundle-analyzer

# 在 next.config.ts 中启用
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# 运行分析
ANALYZE=true npm run build
```

## 🧹 清理构建

### 清理 .next 目录
```bash
# Windows
rmdir /s /q .next

# Linux/Mac
rm -rf .next

# 或使用 npm 脚本
npm run clean  # 如果配置了
```

### 完全清理
```bash
# 删除所有构建产物和依赖
rm -rf .next node_modules
npm install
npm run build
```

## ⚡ 性能优化

### 1. 代码分割
- 自动按路由分割
- 动态导入：`const Component = dynamic(() => import('./Component'))`

### 2. 图片优化
- 使用 Next.js Image 组件
- 自动格式转换（WebP, AVIF）
- 懒加载

### 3. 字体优化
- 使用 `next/font`
- 自动字体优化
- 减少布局偏移

### 4. 缓存策略
- 静态资源：长期缓存
- API 路由：自定义缓存
- ISR：定期更新

## 🐛 常见问题

### 问题 1: 构建失败
```bash
# 清理并重新构建
rm -rf .next
npm run build
```

### 问题 2: 内存不足
```bash
# 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### 问题 3: 端口被占用
```bash
# 使用不同端口
PORT=3001 npm start
```

### 问题 4: 环境变量未生效
- 检查 `.env.production` 文件
- 确保变量以 `NEXT_PUBLIC_` 开头（客户端）
- 重新构建项目

## 📚 相关文档

- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Next.js 构建优化](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Vercel 部署指南](https://vercel.com/docs)

## 🎯 总结

**构建输出位置：** `.next/` 目录

**部署步骤：**
1. 运行 `npm run build` 构建项目
2. 确保 `.next/` 目录完整
3. 上传必需文件到服务器
4. 运行 `npm install --production`
5. 启动服务 `npm start`

**关键点：**
- `.next/` 包含所有编译后的代码
- 生产环境需要 Node.js 运行时
- 静态资源在 `.next/static/` 中
- 服务端代码在 `.next/server/` 中
