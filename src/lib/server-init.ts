import { setupClientInterceptors, setServerAuthCallback } from './hey-api';
import { cookies } from 'next/headers';

// 在服务端初始化拦截器
let initialized = false;

export function initServerInterceptors() {
  if (!initialized) {
    // 设置服务端认证回调
    setServerAuthCallback(async () => {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;
        const deviceId = cookieStore.get('device_id')?.value;
        
        return { token, deviceId };
      } catch (error) {
        console.error('Failed to get server cookies:', error);
        return {};
      }
    });
    
    setupClientInterceptors();
    initialized = true;
  }
}
