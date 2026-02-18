import type { RequestOptions } from '@/api/client/types.gen';
import { CreateClientConfig } from '@/api/client.gen';
import { API_BASE_URL, STORAGE_KEYS } from '@/config/constants';
import { client } from '@/api/client.gen';
import { userControllerRefreshToken } from '@/api/sdk.gen';

const isServer = typeof window === 'undefined';

function getDeviceId(): string {
  if (isServer) return 'server';
  
  // 优先从cookie中读取device_id（由middleware设置）
  const cookieDeviceId = getCookie('device_id');
  if (cookieDeviceId) {
    // 同步到localStorage
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, cookieDeviceId);
    return cookieDeviceId;
  }
  
  // 如果cookie中没有，从localStorage读取
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    // 如果都没有，生成新的
    deviceId = 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    // 同步到cookie
    document.cookie = `device_id=${deviceId}; path=/; max-age=31536000; SameSite=Lax`;
  }
  
  return deviceId;
}

function getCookie(name: string): string | null {
  if (isServer) return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function getAccessToken(): string | null {
  if (isServer) return null;
  
  const cookieToken = getCookie('access_token');
  if (cookieToken) return cookieToken;
  
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

function getRefreshToken(): string | null {
  if (isServer) return null;
  
  const cookieToken = getCookie('refresh_token');
  if (cookieToken) return cookieToken;
  
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

function setTokens(accessToken: string, refreshToken?: string) {
  if (isServer) return;
  
  document.cookie = `access_token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  
  if (refreshToken) {
    document.cookie = `refresh_token=${refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
}

function clearTokens() {
  if (isServer) return;
  
  document.cookie = 'access_token=; path=/; max-age=0';
  document.cookie = 'refresh_token=; path=/; max-age=0';
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: API_BASE_URL,
});

function setHeader(options: RequestOptions, key: string, value: string) {
  const headers = options.headers as Record<string, string> | Headers | [string, string][] | undefined;
  
  if (!headers) {
    options.headers = { [key]: value };
    return;
  }
  
  if (headers instanceof Headers) {
    headers.set(key, value);
  } else if (Array.isArray(headers)) {
    headers.push([key, value]);
  } else if (typeof headers === 'object') {
    (headers as Record<string, string>)[key] = value;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return false;
  }
  
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await userControllerRefreshToken({
        body: { refreshToken }
      });
      
      const data = response.data as { accessToken?: string; refreshToken?: string } | undefined;
      if (data?.accessToken) {
        setTokens(data.accessToken, data.refreshToken);
        return true;
      }
      
      clearTokens();
      return false;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      clearTokens();
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}

// 用于服务端设置认证信息的回调
let serverAuthCallback: (() => Promise<{ token?: string; deviceId?: string }>) | null = null;

export function setServerAuthCallback(callback: () => Promise<{ token?: string; deviceId?: string }>) {
  serverAuthCallback = callback;
}

export function setupClientInterceptors() {
  client.interceptors.request.use(async (options) => {
    if (isServer) {
      // 服务端：使用回调函数获取认证信息
      if (serverAuthCallback) {
        const { token, deviceId } = await serverAuthCallback();
        
        if (token) {
          setHeader(options, 'Authorization', `Bearer ${token}`);
        }
        
        setHeader(options, 'Device-Id', deviceId || 'ssr-default');
        setHeader(options, 'Device-Type', 'server');
      } else {
        setHeader(options, 'Device-Type', 'server');
        setHeader(options, 'Device-Id', 'ssr-default');
      }
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

  client.interceptors.error.use(async (error, response) => {
    if (response?.status === 401 && !isServer) {
      const refreshed = await refreshAccessToken();
      
      if (refreshed) {
        clearTokens();
        window.location.reload();
        return error;
      }
      
      clearTokens();
      window.location.href = '/login';
    }
    
    return error;
  });
}

export { client };
