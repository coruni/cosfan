# 依赖修复说明

## 🐛 问题描述

构建时出现错误：
```
Module not found: Can't resolve '@radix-ui/react-dialog'
```

## 🔍 问题原因

项目中错误地安装了 `radix-ui` 包，这是一个不正确的包名。

正确的包名应该是 `@radix-ui/react-*` 系列包（带有 `@` 前缀和具体的组件名）。

## ✅ 解决方案

### 1. 移除错误的包
```bash
npm uninstall radix-ui
```

### 2. 安装正确的 Radix UI 包
```bash
npm install @radix-ui/react-dialog @radix-ui/react-slot @radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-checkbox @radix-ui/react-label @radix-ui/react-scroll-area @radix-ui/react-separator @radix-ui/react-avatar @radix-ui/react-navigation-menu
```

## 📦 已安装的 Radix UI 包

现在项目中包含以下正确的 Radix UI 包：

- `@radix-ui/react-avatar` - 头像组件
- `@radix-ui/react-checkbox` - 复选框组件
- `@radix-ui/react-dialog` - 对话框组件
- `@radix-ui/react-dropdown-menu` - 下拉菜单组件
- `@radix-ui/react-label` - 标签组件
- `@radix-ui/react-navigation-menu` - 导航菜单组件
- `@radix-ui/react-popover` - 弹出框组件
- `@radix-ui/react-scroll-area` - 滚动区域组件
- `@radix-ui/react-select` - 选择器组件
- `@radix-ui/react-separator` - 分隔符组件
- `@radix-ui/react-slot` - 插槽组件（基础组件）

## 🎯 使用说明

### ImageGallery 组件
该组件使用了 `@radix-ui/react-dialog` 来实现图片预览功能：

```typescript
import * as DialogPrimitive from '@radix-ui/react-dialog';
```

### 其他 UI 组件
项目中的 shadcn/ui 组件也依赖这些 Radix UI 包：

- `src/components/ui/dialog.tsx` - 使用 `@radix-ui/react-dialog`
- `src/components/ui/dropdown-menu.tsx` - 使用 `@radix-ui/react-dropdown-menu`
- `src/components/ui/select.tsx` - 使用 `@radix-ui/react-select`
- `src/components/ui/checkbox.tsx` - 使用 `@radix-ui/react-checkbox`
- 等等...

## 🔧 验证修复

运行以下命令验证问题已解决：

```bash
# 开发模式
npm run dev

# 或构建生产版本
npm run build
```

应该不再出现 "Module not found" 错误。

## 📚 关于 Radix UI

Radix UI 是一个无样式的 UI 组件库，提供：
- 完全的可访问性支持
- 无样式设计（可自定义样式）
- 高质量的组件实现
- TypeScript 支持

shadcn/ui 基于 Radix UI 构建，提供了预设样式的组件。

## 🚨 注意事项

1. **包名格式**
   - ❌ 错误：`radix-ui`
   - ✅ 正确：`@radix-ui/react-dialog`

2. **按需安装**
   - 只安装项目中实际使用的 Radix UI 组件
   - 避免安装不需要的包

3. **版本兼容性**
   - 确保所有 `@radix-ui/*` 包版本兼容
   - 建议使用相近的版本号

## 📝 相关文档

- [Radix UI 官方文档](https://www.radix-ui.com/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Radix UI GitHub](https://github.com/radix-ui/primitives)

## ✨ 总结

问题已修复！现在项目包含了所有必需的 Radix UI 依赖，可以正常构建和运行。
