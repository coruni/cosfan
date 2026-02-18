# Device ID 同步流程

## 目标
确保客户端和服务端使用相同的 device_id，因为后端会校验 device_id 和 token 的绑定关系。

## 流程

### 1. 首次访问（无 device_id）

```
用户访问 → Middleware
  ↓
检查 cookie 中的 device_id
  ↓ (不存在)
生成新的 device_id
  ↓
设置 cookie: device_id=xxx (httpOnly=false, 1年有效期)
  ↓
SSR 渲染（使用 cookie 中的 device_id）
  ↓
客户端 hydration
  ↓
AuthContext.useEffect 执行
  ↓
getDeviceId() 从 cookie 读取 device_id
  ↓
同步到 localStorage
  ↓
完成：cookie 和 localStorage 中的 device_id 一致
```

### 2. 后续访问（已有 device_id）

```
用户访问 → Middleware
  ↓
检查 cookie 中的 device_id
  ↓ (存在)
使用现有的 device_id
  ↓
SSR 渲染（使用 cookie 中的 device_id）
  ↓
客户端 hydration
  ↓
AuthContext.useEffect 执行
  ↓
getDeviceId() 从 cookie 读取 device_id
  ↓
验证 localStorage 中的 device_id 是否一致
  ↓
完成：保持一致
```

### 3. 登录流程

```
用户登录
  ↓
后端返回 token（绑定到当前 device_id）
  ↓
前端存储 token 到 cookie 和 localStorage
  ↓
后续请求：
  - Authorization: Bearer {token}
  - Device-Id: {device_id}
  ↓
后端校验：token 是否属于这个 device_id
  ↓
校验通过 → 返回数据
```

## 关键点

1. **Middleware 优先级最高**
   - 在所有请求之前执行
   - 确保 cookie 中始终有 device_id
   - httpOnly=false 允许客户端 JavaScript 读取

2. **客户端优先使用 cookie**
   - getDeviceId() 优先从 cookie 读取
   - 同步到 localStorage 作为备份
   - 确保与服务端一致

3. **服务端拦截器**
   - 从 cookie 读取 device_id
   - 如果没有，使用 'ssr-default'（理论上不会发生）

4. **Token 和 Device ID 绑定**
   - 登录时，后端将 token 绑定到当前 device_id
   - 每次请求都必须同时发送 token 和 device_id
   - 后端校验两者的绑定关系

## 文件修改

- `src/middleware.ts`: 生成并设置 device_id cookie
- `src/contexts/AuthContext.tsx`: 客户端优先使用 cookie 中的 device_id
- `src/lib/hey-api.ts`: 拦截器从 cookie 读取 device_id
- `src/lib/server-init.ts`: 服务端拦截器初始化
