'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { userControllerGetProfile } from '@/api/sdk.gen';
import type { UserControllerGetProfileResponse } from '@/api/types.gen';
import { STORAGE_KEYS } from '@/config/constants';
import { setupClientInterceptors } from '@/lib/hey-api';

type ResponseData = NonNullable<UserControllerGetProfileResponse>;
type UserData = ResponseData['data'];

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, refreshToken?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  serverUser?: UserData | null;
}

const isServer = typeof window === 'undefined';

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

/**
 * 检查客户端是否已登录（仅检查token是否存在）
 * @returns 如果存在有效的access_token返回true，否则返回false
 */
function isClientAuthenticated(): boolean {
  if (isServer) return false;
  const token = getAccessToken();
  return !!token;
}

function getDeviceId(): string {
  if (isServer) return 'ssr';
  
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
  }
  
  // 同步到cookie
  document.cookie = `device_id=${deviceId}; path=/; max-age=31536000; SameSite=Lax`;
  return deviceId;
}

export function AuthProvider({ children, serverUser }: AuthProviderProps) {
  const [user, setUser] = useState<UserData | null>(serverUser || null);
  const [isLoading, setIsLoading] = useState(!serverUser);

  const isAuthenticated = !!user;

  useEffect(() => {
    setupClientInterceptors();
    
    // 确保device_id在cookie和localStorage中同步
    const deviceId = getDeviceId();
    console.log('Device ID initialized:', deviceId);
  }, []);

  useEffect(() => {
    console.log('AuthContext useEffect running, serverUser:', !!serverUser);
    if (serverUser) {
      setUser(serverUser);
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      console.log('initAuth started');
      
      // 先检查是否已登录
      const isAuthenticated = isClientAuthenticated();
      console.log('Init auth - is authenticated:', isAuthenticated);
      
      // 只有在已登录的情况下才尝试获取用户信息
      if (isAuthenticated) {
        const token = getAccessToken();
        // 同步token到localStorage（如果还没有）
        if (token && !localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
        }
        try {
          await refreshUser();
          console.log('Refresh user success');
        } catch (error) {
          console.error('Refresh user failed:', error);
          // 获取用户信息失败，清除认证状态
          logout();
        }
      } else {
        // 没有token，确保用户状态为null
        console.log('Not authenticated, user set to null');
        setUser(null);
      }
      
      console.log('Setting isLoading to false');
      setIsLoading(false);
    };

    initAuth();
  }, [serverUser]);

  const login = async (token: string, refreshToken?: string) => {
    document.cookie = `access_token=${token}; path=/; max-age=604800; SameSite=Lax`;
    if (refreshToken) {
      document.cookie = `refresh_token=${refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
    }
    if (!isServer) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
    }
    await refreshUser();
  };

  const logout = () => {
    document.cookie = 'access_token=; path=/; max-age=0';
    document.cookie = 'refresh_token=; path=/; max-age=0';
    if (!isServer) {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    }
    setUser(null);
    
    // 退出登录后刷新页面，原因：
    // 1. 清空所有认证状态和缓存
    // 2. 重新执行SSR，获取未认证状态的数据
    // 3. 确保所有组件状态重置
    if (!isServer) {
      window.location.href = '/';
    }
  };

  const refreshUser = async () => {
    try {
      // 先检查是否有token，没有token不调用API
      const token = getAccessToken();
      if (!token) {
        console.log('No token found, skipping user refresh');
        setUser(null);
        return;
      }

      const response = await userControllerGetProfile();
      if (response.data?.data) {
        setUser(response.data.data);
      } else {
        // API返回成功但没有数据，清除用户状态
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // 如果获取用户信息失败，清除用户状态
      setUser(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { UserData };
