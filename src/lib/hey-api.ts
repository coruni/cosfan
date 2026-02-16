import type {RequestOptions } from '@/api/client/types.gen';
import { CreateClientConfig } from '@/api/client.gen';
import { API_BASE_URL, STORAGE_KEYS } from '@/config/constants';
import { client } from '@/api/client.gen';

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

  client.interceptors.response.use((response) => {
    return response;
  });
}

export { client };
