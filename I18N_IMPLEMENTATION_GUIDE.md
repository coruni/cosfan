# 国际化实现指南

## 已完成的文件

### 1. 登录注册页面
- ✅ `src/app/[locale]/(main)/login/page.tsx` - 已完全国际化
- ✅ `src/app/[locale]/(main)/register/page.tsx` - 已修复验证schema

### 2. 主要内容页面
- ✅ `src/app/[locale]/(main)/HomePageContent.tsx` - 已添加国际化
- ✅ `src/app/[locale]/(main)/cosers/CosersContent.tsx` - 已添加国际化

### 3. 翻译文件
- ✅ `src/messages/zh.json` - 已添加 coser 和 article 命名空间
- ✅ `src/messages/en.json` - 已添加对应英文翻译

## 待处理文件清单

### 需要添加的翻译键

在 `src/messages/zh.json` 和 `src/messages/en.json` 中添加以下命名空间：

```json
{
  "discover": {
    "title": "发现",
    "popularCosers": "热门Coser",
    "popularArticles": "热门推荐",
    "articlesCount": "{count} 套",
    "totalArticles": "共 {total} 套图集",
    "empty": "暂无内容",
    "coserWorks": "{name} - Cosplay作品集"
  },
  "profile": {
    "title": "个人中心",
    "pleaseLogin": "请先登录",
    "loginToViewProfile": "登录后查看个人中心",
    "goLogin": "去登录",
    "settings": "设置",
    "editProfile": "编辑资料",
    "editProfileDesc": "修改您的个人信息",
    "changeAvatar": "更换头像",
    "vipMember": "VIP会员",
    "standardMember": "标准会员",
    "validUntil": "有效期至",
    "expired": "已过期",
    "expireTomorrow": "明天到期",
    "expireInDays": "{days}天后到期",
    "renewMembership": "续费会员",
    "openVip": "开通VIP会员",
    "openVipDesc": "解锁高清原图下载、无广告体验等专属权益",
    "openNow": "立即开通",
    "stats": {
      "posts": "发布",
      "followers": "粉丝",
      "following": "关注",
      "points": "积分"
    },
    "tabs": {
      "history": "浏览历史",
      "likes": "我的点赞",
      "favorites": "我的收藏"
    },
    "historyDesc": "最近浏览的图集",
    "likesDesc": "点赞过的图集",
    "favoritesDesc": "收藏的图集",
    "form": {
      "nickname": "昵称",
      "nicknamePlaceholder": "输入昵称",
      "bio": "个人介绍",
      "bioPlaceholder": "介绍一下自己..."
    },
    "profileUpdateSuccess": "资料更新成功",
    "updateFailed": "更新失败",
    "avatarUploadFailed": "头像上传失败"
  },
  "vip": {
    "title": "VIP会员",
    "expired": "已过期",
    "expireTomorrow": "明天到期",
    "expireInDays": "{days}天后到期",
    "expire": "到期",
    "standardMember": "标准会员",
    "validUntil": "有效期至",
    "renew": "续费会员",
    "open": "开通VIP会员",
    "benefitsDesc": "解锁高清原图下载、无广告体验等专属权益",
    "openNow": "立即开通",
    "loginToOpen": "登录后开通",
    "benefits": "会员权益",
    "selectPayment": "选择支付方式",
    "willOpenPlan": "您将开通 {plan}，需支付 ¥{price}",
    "paymentChannel": "支付渠道",
    "selectPaymentMethod": "选择支付方式",
    "paymentType": "支付类型",
    "selectPaymentType": "选择支付类型",
    "confirmPayment": "确认支付",
    "paymentSuccess": "支付成功",
    "paymentSuccessDesc": "恭喜您已成为VIP会员，现在可以享受所有会员权益！",
    "backToHome": "返回首页",
    "viewStatus": "查看会员状态",
    "unlockMore": "解锁更多精彩内容",
    "becomeVipDesc": "成为VIP会员，享受专属权益，畅享海量高清图集",
    "popular": "最受欢迎"
  }
}
```

## 实现步骤

### 对于每个组件文件：

1. **导入 useTranslations**
```typescript
import { useTranslations } from 'next-intl';
```

2. **在组件中使用**
```typescript
export function Component() {
  const t = useTranslations('namespace');
  const tCommon = useTranslations('common');
  
  // 使用翻译
  return <div>{t('key')}</div>;
}
```

3. **替换硬编码文本**
- 将所有中文字符串替换为 `t('key')`
- 对于带参数的文本，使用 `t('key', { param: value })`

### 示例模式

#### 简单文本
```typescript
// 之前
<h1>最新图集</h1>

// 之后
<h1>{t('latestArticles')}</h1>
```

#### 带参数的文本
```typescript
// 之前
<span>共 {total} 套图集</span>

// 之后
<span>{t('totalArticles', { total })}</span>
```

#### 条件文本
```typescript
// 之前
{isVip ? 'VIP会员' : '普通会员'}

// 之后
{isVip ? t('vipMember') : t('standardMember')}
```

## 待处理文件详细列表

### 主要内容页面（续）
- [ ] `src/app/[locale]/(main)/cosers/[id]/layout.tsx`
- [ ] `src/app/[locale]/(main)/cosers/page.tsx`
- [ ] `src/app/[locale]/(main)/article/[id]/ArticleContent.tsx`
- [ ] `src/app/[locale]/(main)/article/[id]/page.tsx`
- [ ] `src/app/[locale]/(main)/profile/ProfileContent.tsx`
- [ ] `src/app/[locale]/(main)/search/SearchContent.tsx`
- [ ] `src/app/[locale]/(main)/discover/DiscoverPageContent.tsx`
- [ ] `src/app/[locale]/(main)/vip/VIPClient.tsx`
- [ ] `src/app/[locale]/(main)/vip/page.tsx`

### 后台管理页面
- [ ] `src/app/[locale]/dashboard/page.tsx`
- [ ] `src/app/[locale]/dashboard/layout.tsx`
- [ ] `src/app/[locale]/dashboard/users/page.tsx`
- [ ] `src/app/[locale]/dashboard/articles/page.tsx`
- [ ] `src/app/[locale]/dashboard/articles/new/page.tsx`
- [ ] `src/app/[locale]/dashboard/articles/[id]/edit/page.tsx`
- [ ] `src/app/[locale]/dashboard/cosers/page.tsx`
- [ ] `src/app/[locale]/dashboard/tags/page.tsx`
- [ ] `src/app/[locale]/dashboard/orders/page.tsx`
- [ ] `src/app/[locale]/dashboard/settings/page.tsx`

### 其他页面
- [ ] `src/app/[locale]/layout.tsx`
- [ ] `src/app/[locale]/HomePageContent.tsx`
- [ ] `src/app/[locale]/(main)/discover/page.tsx`
- [ ] `src/app/[locale]/(main)/search/layout.tsx`
- [ ] `src/contexts/AuthContext.tsx`

## 注意事项

1. **保持一致性**：使用相同的命名空间组织相关翻译
2. **参数化**：对于动态内容，使用参数而不是字符串拼接
3. **复用**：common 命名空间用于通用文本（如"保存"、"取消"等）
4. **测试**：每完成一个文件，测试中英文切换是否正常

## 快速参考

### 常用命名空间
- `common`: 通用文本（按钮、操作等）
- `validation`: 表单验证消息
- `toast`: 提示消息
- `auth`: 认证相关
- `nav`: 导航菜单
- `home`: 首页
- `search`: 搜索
- `profile`: 个人中心
- `settings`: 设置
- `vip`: 会员
- `dashboard`: 后台管理
- `users`: 用户管理
- `articles`: 文章管理
- `orders`: 订单管理
- `coser`: Coser相关
- `article`: 文章详情
- `discover`: 发现页面
