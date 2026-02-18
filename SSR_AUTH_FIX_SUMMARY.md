# SSR 认证修复总结

## 问题描述
项目中SSR请求没有正确传递 `token` 和 `device_id`，导致后端无法验证用户身份，返回的数据不完整。

## 核心问题
1. 服务端渲染时，API请求没有携带认证信息
2. `device_id` 和 `token` 必须配套使用（后端会校验绑定关系）
3. 客户端和服务端的 `device_id` 必须保持一致

## 解决方案

### 1. 统一在拦截器中处理认证（核心改进）

**文件：`src/lib/hey-api.ts`**

```typescript
export function setupClientInterceptors() {
  client.interceptors.request.use(async (options) => {
    if (isServer) {
      // 服务端：从cookies中获取token和device_id
      const token = await getServerCookie('access_token');
      const deviceId = await getServerCookie('device_id');
      
      if (token) {
        setHeader(options, 'Authorization', `Bearer ${token}`);
      }
      
      setHeader(options, 'Device-Id', deviceId || 'ssr-default');
      setHeader(options, 'Device-Type', 'server');
    } else {
      // 客户端：从localStorage和cookie中获取
      const token = getAccessToken();
      
      if (token) {
        setHeader(options, 'Authorization', `Bearer ${token}`);
      }
      
      const deviceId = getDeviceId();
      setHeader(options, 'Device-Id', deviceId);
      setHeader(options, 'Device-Type', 'web');
      setHeader(options, 'Device-Name', navigator.userAgent);
    }
  });
}
```

### 2. 确保 device_id 在客户端和服务端一致

**文件：`src/middleware.ts`**
- 在每个请求前检查 `device_id` cookie
- 如果不存在，生成一个新的唯一ID
- 设置 `httpOnly=false` 允许客户端读取

**文件：`src/contexts/AuthContext.tsx` 和 `src/lib/hey-api.ts`**
- `getDeviceId()` 优先从 cookie 读取
- 同步到 localStorage 作为备份
- 确保客户端和服务端使用相同的 device_id

### 3. 服务端拦截器初始化

**文件：`src/lib/server-init.ts`**
```typescript
export function initServerInterceptors() {
  if (!initialized) {
    setupClientInterceptors();
    initialized = true;
  }
}
```

**在所有SSR页面中调用：**
```typescript
async function getData() {
  initServerInterceptors();
  client.setConfig({ baseUrl: API_BASE_URL });
  const response = await someApiCall();
  return response.data;
}
```

## 修改的文件

### 核心文件
1. ✅ `src/lib/hey-api.ts` - 拦截器统一处理认证
2. ✅ `src/lib/server-init.ts` - 服务端拦截器初始化
3. ✅ `src/middleware.ts` - 确保 device_id 存在
4. ✅ `src/contexts/AuthContext.tsx` - 客户端 device_id 同步
5. ✅ `src/lib/auth.ts` - 简化，移除手动添加 headers

### SSR 页面
6. ✅ `src/app/[locale]/layout.tsx`
7. ✅ `src/app/[locale]/(main)/page.tsx`
8. ✅ `src/app/[locale]/(main)/article/[id]/page.tsx`
9. ✅ `src/app/[locale]/(main)/cosers/page.tsx`
10. ✅ `src/app/[locale]/(main)/vip/page.tsx`

### 其他修复
11. ✅ `src/app/[locale]/dashboard/articles/[id]/edit/page.tsx` - 修复 images 参数
12. ✅ `src/app/[locale]/dashboard/articles/new/page.tsx` - 修复 images 参数

## 优势

### ✅ 统一管理
- 所有认证逻辑集中在拦截器中
- 无需在每个API调用时手动添加 headers
- 代码更简洁，易于维护

### ✅ 自动处理
- 拦截器自动为所有请求添加认证信息
- 服务端和客户端使用相同的逻辑
- device_id 自动在 cookie 和 localStorage 间同步

### ✅ 正确性保证
- device_id 和 token 始终配套发送
- 客户端和服务端使用相同的 device_id
- 后端可以正确校验 device_id 和 token 的绑定关系

## 工作流程

### 首次访问
1. Middleware 生成 device_id → 设置 cookie
2. SSR 使用 cookie 中的 device_id
3. 客户端 hydration 后从 cookie 读取 device_id
4. 同步到 localStorage

### 登录后
1. 后端返回 token（绑定到当前 device_id）
2. 前端存储 token 到 cookie 和 localStorage
3. 所有请求通过拦截器自动添加：
   - `Authorization: Bearer {token}`
   - `Device-Id: {device_id}`
4. 后端校验 token 和 device_id 的绑定关系

### SSR 请求
1. 调用 `initServerInterceptors()` 初始化拦截器
2. 拦截器从 cookies 读取 token 和 device_id
3. 自动添加到请求头
4. 后端返回完整数据

## 测试要点

1. ✅ 首次访问时 device_id 是否正确生成
2. ✅ 刷新页面后 device_id 是否保持不变
3. ✅ 登录后 SSR 请求是否携带 token 和 device_id
4. ✅ 客户端请求是否携带 token 和 device_id
5. ✅ device_id 在客户端和服务端是否一致
6. ✅ 后端是否能正确校验 token 和 device_id 的绑定关系
