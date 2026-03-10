# 翻译键修复报告

## 问题描述

在运行时发现以下翻译键在英文翻译文件中缺失：
- `settings.edit`
- `settings.bind`
- `settings.change`
- `settings.nav.language`

## 根本原因

设置页面 (`SettingsContent.tsx`) 使用了这些翻译键，但它们只在中文翻译文件的 `common` 命名空间中存在，而在 `settings` 命名空间中缺失。

## 修复内容

### 1. 英文翻译文件 (`src/messages/en.json`)

添加了以下键到 `settings` 命名空间：
```json
{
  "settings": {
    "edit": "Edit",
    "bind": "Bind",
    "change": "Change",
    "nav": {
      "language": "Language"
    }
  }
}
```

### 2. 中文翻译文件 (`src/messages/zh.json`)

添加了以下键到 `settings` 命名空间：
```json
{
  "settings": {
    "edit": "编辑",
    "bind": "绑定",
    "change": "更换",
    "nav": {
      "language": "语言"
    }
  }
}
```

## 使用位置

这些键在 `src/app/[locale]/(main)/settings/SettingsContent.tsx` 中使用：

### 1. `settings.edit`
```typescript
<Button variant="outline" size="sm" onClick={() => setShowPasswordDialog(true)}>
  {t('edit')}
</Button>
```
用于"修改密码"按钮

### 2. `settings.bind` 和 `settings.change`
```typescript
<Button variant="outline" size="sm">
  {user?.phone ? t('change') : t('bind')}
</Button>
```
用于"绑定手机"和"绑定邮箱"按钮，根据是否已绑定显示不同文本

### 3. `settings.nav.language`
```typescript
<p className="font-medium">{t('nav.language') || 'Language'}</p>
```
用于语言选择器的标签

## 验证

修复后，这些翻译键应该能够正常工作：
- ✅ 英文环境下显示 "Edit", "Bind", "Change", "Language"
- ✅ 中文环境下显示 "编辑", "绑定", "更换", "语言"
- ✅ 不再出现 MISSING_MESSAGE 错误

## 相关文件

- `src/messages/zh.json` - 中文翻译文件
- `src/messages/en.json` - 英文翻译文件
- `src/app/[locale]/(main)/settings/SettingsContent.tsx` - 设置页面组件

## 注意事项

虽然 `common` 命名空间中也有 `edit`、`bind`、`change` 键，但为了保持命名空间的独立性和避免混淆，我们在 `settings` 命名空间中也添加了这些键。这样可以：

1. 保持翻译的上下文清晰
2. 避免跨命名空间引用
3. 便于未来可能的文本差异化

## 建议

在未来添加新的翻译键时：
1. 确保同时在 `zh.json` 和 `en.json` 中添加
2. 保持命名空间的一致性
3. 使用有意义的键名
4. 添加后立即测试两种语言环境
