import type { RequestOptions } from '@/api/client/types.gen';
import { CreateClientConfig } from '@/api/client.gen';
import { API_BASE_URL, STORAGE_KEYS } from '@/config/constants';
import { client } from '@/api/client.gen';
import { userControllerRefreshToken } from '@/api/sdk.gen';

const isServer = typeof window === 'undefined';

function getDeviceId(): string {
  if (isServer) return 'server';
  
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
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

export function setupClientInterceptors() {
  client.interceptors.request.use((options) => {
    const token = getAccessToken();
    
    if (token) {
      setHeader(options, 'Authorization', `Bearer ${token}`);
    }
    
    if (!isServer) {
      const deviceId = getDeviceId();
      setHeader(options, 'Device-Id', deviceId);
      setHeader(options, 'Device-Type', 'web');
      setHeader(options, 'Device-Name', navigator.userAgent);
    } else {
      setHeader(options, 'Device-Type', 'server');
      setHeader(options, 'Device-Id', 'ssr');
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
