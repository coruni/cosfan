# 文章访问权限逻辑说明

## 核心原则

**后端控制内容，前端展示内容**

- 后端根据用户权限返回相应数量的图片
- 前端不做权限判断，只展示后端返回的内容
- 通过 `imageCount` 和 `images.length` 判断是否还有更多内容

## 旧逻辑（错误）❌

```typescript
// 一刀切：如果需要会员且用户不是会员，完全锁定内容
const isLocked = 
  (article.requireLogin && !isAuthenticated) ||
  (article.requireMembership && !user?.membershipStatus);

if (isLocked) {
  // 显示完全锁定的界面，不显示任何图片
  return <LockedView />;
}
```

**问题：**
- 即使后端返回了预览图片，前端也不显示
- 用户无法看到任何内容，体验差
- 不符合"预览+解锁"的产品逻辑

## 新逻辑（正确）✅

```typescript
// 后端会根据权限返回相应数量的图片
// 前端只需要显示后端返回的图片

const hasImages = article.images && article.images.length > 0;
const canViewAllImages = article.imageCount === article.images.length;
const remainingImages = article.imageCount - article.images.length;

// 始终显示后端返回的图片
<ImageGallery images={article.images} />

// 如果还有更多内容，显示解锁提示
{!canViewAllImages && remainingImages > 0 && (
  <UnlockPrompt remainingImages={remainingImages} />
)}
```

**优点：**
- 用户可以看到预览内容
- 清楚地知道还有多少内容未解锁
- 根据不同权限要求显示相应的解锁方式
- 体验更好，转化率更高

## 权限判断逻辑

### 后端职责
1. 根据用户权限决定返回多少图片
2. 设置 `imageCount`（总图片数）
3. 返回 `images` 数组（用户可见的图片）

**示例：**
```json
{
  "imageCount": 20,        // 总共20张图片
  "images": ["url1", "url2", "url3"],  // 未登录用户只能看3张
  "requireLogin": true,
  "requireMembership": false
}
```

### 前端职责
1. 显示后端返回的所有图片
2. 计算剩余图片数：`remainingImages = imageCount - images.length`
3. 如果 `remainingImages > 0`，显示解锁提示
4. 根据文章的权限要求显示相应的解锁按钮

## 解锁提示的显示逻辑

```typescript
// 只有当不能查看全部图片且有剩余图片时才显示
if (!canViewAllImages && remainingImages > 0) {
  // 显示剩余图片数量
  <p>还有 {remainingImages} 张图片未解锁</p>
  
  // 根据不同的权限要求显示不同的提示
  if (article.requireLogin && !isAuthenticated) {
    // 需要登录
    <Button>登录查看更多</Button>
  } else if (article.requireMembership && !user?.membershipStatus) {
    // 需要会员
    <Button>开通VIP</Button>
  } else if (article.requirePayment) {
    // 需要付费
    <Button>支付 {viewPrice} 元解锁</Button>
  }
}
```

## 不同场景的表现

### 场景1：完全公开的文章
```json
{
  "imageCount": 10,
  "images": ["url1", "url2", ..., "url10"],  // 10张全部返回
  "requireLogin": false,
  "requireMembership": false,
  "requirePayment": false
}
```
**前端表现：**
- 显示全部10张图片
- 不显示解锁提示（因为 `imageCount === images.length`）

### 场景2：需要登录的文章（未登录用户）
```json
{
  "imageCount": 15,
  "images": ["url1", "url2", "url3"],  // 只返回3张预览
  "requireLogin": true,
  "requireMembership": false
}
```
**前端表现：**
- 显示3张预览图片
- 显示"还有 12 张图片未解锁"
- 显示"登录查看更多"按钮

### 场景3：需要会员的文章（普通用户）
```json
{
  "imageCount": 20,
  "images": ["url1", "url2", ..., "url5"],  // 返回5张预览
  "requireLogin": true,
  "requireMembership": true
}
```
**前端表现：**
- 显示5张预览图片
- 显示"还有 15 张图片未解锁"
- 显示"VIP会员可查看全部"
- 显示"开通VIP"按钮

### 场景4：需要付费的文章
```json
{
  "imageCount": 30,
  "images": ["url1", "url2", "url3"],  // 返回3张预览
  "requirePayment": true,
  "viewPrice": "9.9"
}
```
**前端表现：**
- 显示3张预览图片
- 显示"还有 27 张图片未解锁"
- 显示"支付 9.9 元查看完整内容"
- 显示"支付 9.9 元解锁"按钮

### 场景5：已解锁的文章
```json
{
  "imageCount": 20,
  "images": ["url1", "url2", ..., "url20"],  // 全部20张
  "requireMembership": true  // 虽然需要会员，但用户已经是会员
}
```
**前端表现：**
- 显示全部20张图片
- 不显示解锁提示（因为 `imageCount === images.length`）

## 总结

新的逻辑遵循以下原则：

1. **信任后端**：后端返回什么，前端就显示什么
2. **不做权限判断**：前端不判断用户是否有权限，只判断是否还有更多内容
3. **渐进式解锁**：先显示预览，再引导解锁
4. **清晰的提示**：明确告诉用户还有多少内容，如何解锁
5. **更好的体验**：用户可以看到部分内容，而不是完全锁定

这样的设计既保护了内容，又提供了良好的用户体验，有利于提高转化率。
