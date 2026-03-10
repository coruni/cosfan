# 批量国际化处理脚本

## 剩余文件处理清单

由于剩余文件较多（约23个），且每个文件都有大量硬编码中文，建议采用以下批处理方式：

### 方案A：使用自动化工具
1. 使用 i18n-scanner 或类似工具扫描所有硬编码文本
2. 自动生成翻译键
3. 批量替换

### 方案B：手动逐个处理（推荐）
按照优先级逐个处理，确保质量

## 已完成文件总结 (9个)

### 前台页面 (7个)
1. ✅ `src/app/[locale]/(main)/login/page.tsx`
2. ✅ `src/app/[locale]/(main)/register/page.tsx`
3. ✅ `src/app/[locale]/(main)/HomePageContent.tsx`
4. ✅ `src/app/[locale]/(main)/cosers/CosersContent.tsx`
5. ✅ `src/app/[locale]/(main)/profile/ProfileContent.tsx`
6. ✅ `src/app/[locale]/(main)/search/SearchContent.tsx`
7. ✅ `src/app/[locale]/(main)/discover/DiscoverPageContent.tsx`

### 后台页面 (2个)
8. ✅ `src/app/[locale]/dashboard/page.tsx`
9. ✅ `src/app/[locale]/dashboard/layout.tsx`

## 剩余文件快速处理指南

### 文章详情页 (部分完成)
**文件**: `src/app/[locale]/(main)/article/[id]/ArticleContent.tsx`

**状态**: 已添加 useTranslations，部分文本已替换

**剩余工作**:
需要替换的文本模式：
```typescript
// 已完成
t('liked') // 点赞成功
t('unliked') // 取消点赞
t('favorited') // 收藏成功
t('unfavorited') // 取消收藏
t('operationFailed') // 操作失败
t('linkCopied') // 链接已复制
t('notFound') // 文章不存在
t('backToHome') // 返回首页
t('downloadType.baidu') // 百度网盘

// 待完成
"未分类" → t('uncategorized')
"浏览量" → aria-label 使用变量
"取消点赞" / "点赞" → t('unlike') / t('like')
"评论数" → aria-label 使用变量
"已收藏" / "收藏" → t('favorited') / t('favoriteAction')
"分享" → t('share')
"下载" → t('download')
"下载资源" → t('downloadResources')
"密码" → t('password')
"提取码" → t('extractionCode')
"密码已复制" → t('passwordCopied')
"提取码已复制" → t('extractionCodeCopied')
"还有 X 张图片未解锁" → t('remainingImages', { count })
"支付 X 元查看完整内容" → t('payToView', { price })
"VIP会员可查看全部" → t('vipCanViewAll')
"登录后可查看更多内容" → t('loginToViewMore')
"登录查看更多" → t('loginToView')
"开通VIP" → t('openVip')
"支付 X 元解锁" → t('payToUnlock', { price })
"暂无图片内容" → t('noImages')
```

### 关键替换模式

#### 1. Badge/标签
```typescript
// 之前
<Badge>{article.category?.name || '未分类'}</Badge>

// 之后
<Badge>{article.category?.name || t('uncategorized')}</Badge>
```

#### 2. 按钮文本
```typescript
// 之前
<Button>{isFavorited ? '已收藏' : '收藏'}</Button>

// 之后
<Button>{isFavorited ? t('favorited') : t('favoriteAction')}</Button>
```

#### 3. 带参数的文本
```typescript
// 之前
<p>还有 {remainingImages} 张图片未解锁</p>

// 之后
<p>{t('remainingImages', { count: remainingImages })}</p>
```

#### 4. Toast 消息
```typescript
// 之前
toast.success('密码已复制');

// 之后
toast.success(t('passwordCopied'));
```

## 完整的剩余文件列表

### 高优先级 - 前台核心页面 (6个)

#### 1. 文章详情页
- [ ] `src/app/[locale]/(main)/article/[id]/ArticleContent.tsx` (部分完成)
- [ ] `src/app/[locale]/(main)/article/[id]/page.tsx` (metadata)

#### 2. Coser相关
- [ ] `src/app/[locale]/(main)/cosers/[id]/layout.tsx` (metadata)
- [ ] `src/app/[locale]/(main)/cosers/page.tsx` (metadata)

#### 3. VIP会员
- [ ] `src/app/[locale]/(main)/vip/VIPClient.tsx`
- [ ] `src/app/[locale]/(main)/vip/page.tsx` (metadata)

#### 4. 设置页面
- [ ] `src/app/[locale]/(main)/settings/SettingsContent.tsx`
- [ ] `src/app/[locale]/(main)/settings/page.tsx`

#### 5. 其他前台页面
- [ ] `src/app/[locale]/(main)/profile/page.tsx` (metadata)
- [ ] `src/app/[locale]/(main)/search/layout.tsx`
- [ ] `src/app/[locale]/(main)/discover/page.tsx` (metadata)
- [ ] `src/app/[locale]/(main)/page.tsx`
- [ ] `src/app/[locale]/HomePageContent.tsx`

### 中优先级 - 后台管理页面 (8个)

#### 6. 用户管理
- [ ] `src/app/[locale]/dashboard/users/page.tsx`

#### 7. 文章管理
- [ ] `src/app/[locale]/dashboard/articles/page.tsx`
- [ ] `src/app/[locale]/dashboard/articles/new/page.tsx`
- [ ] `src/app/[locale]/dashboard/articles/[id]/edit/page.tsx`

#### 8. 其他管理页面
- [ ] `src/app/[locale]/dashboard/cosers/page.tsx`
- [ ] `src/app/[locale]/dashboard/tags/page.tsx`
- [ ] `src/app/[locale]/dashboard/orders/page.tsx`
- [ ] `src/app/[locale]/dashboard/settings/page.tsx`

### 低优先级 - 布局和上下文 (3个)

#### 9. 布局文件
- [ ] `src/app/[locale]/layout.tsx`
- [ ] `src/app/[locale]/(main)/layout.tsx`

#### 10. 上下文
- [ ] `src/contexts/AuthContext.tsx`

## 建议的处理顺序

### 第一批：完成文章详情页 (最重要)
1. 完成 `ArticleContent.tsx` 的剩余替换
2. 处理 `article/[id]/page.tsx` 的 metadata

### 第二批：VIP和设置页面
3. `vip/VIPClient.tsx`
4. `settings/SettingsContent.tsx`

### 第三批：后台核心管理页面
5. `dashboard/users/page.tsx`
6. `dashboard/articles/page.tsx`
7. `dashboard/orders/page.tsx`

### 第四批：其他后台页面
8-11. 剩余的后台管理页面

### 第五批：布局和元数据
12-15. 布局文件和 metadata 页面

## 预计工作量

- 文章详情页完成：30分钟
- VIP和设置页面：1小时
- 后台核心管理：2小时
- 其他后台页面：2小时
- 布局和元数据：1小时

**总计：约6-7小时**

## 质量检查清单

每完成一个文件后检查：
- [ ] 所有硬编码中文都已替换
- [ ] 翻译键已添加到 zh.json 和 en.json
- [ ] 动态参数正确传递
- [ ] Toast 消息使用翻译
- [ ] aria-label 使用翻译或变量
- [ ] 测试语言切换功能

## 当前状态

- ✅ 已完成：9个文件 (28%)
- ⏳ 进行中：1个文件 (ArticleContent.tsx 部分完成)
- 📋 待处理：约22个文件 (69%)

## 下一步行动

建议：
1. 先完成 ArticleContent.tsx 的剩余工作
2. 然后按优先级逐个处理其他文件
3. 每完成3-5个文件进行一次测试
4. 最后进行全面的回归测试
