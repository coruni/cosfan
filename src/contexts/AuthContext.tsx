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

function getDeviceId(): string {
  if (isServer) return 'ssr';
  
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

export function AuthProvider({ children, serverUser }: AuthProviderProps) {
  const [user, setUser] = useState<UserData | null>(serverUser || null);
  const [isLoading, setIsLoading] = useState(!serverUser);

  const isAuthenticated = !!user;

  useEffect(() => {
    setupClientInterceptors();
    
    const deviceId = getDeviceId();
    document.cookie = `device_id=${deviceId}; path=/; max-age=31536000; SameSite=Lax`;
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
      const token = getAccessToken();
      console.log('Init auth - token exists:', !!token);
      if (token) {
        if (!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
        }
        try {
          await refreshUser();
          console.log('Refresh user success');
        } catch (error) {
          console.error('Refresh user failed:', error);
          logout();
        }
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
  };

  const refreshUser = async () => {
    try {
      const response = await userControllerGetProfile();
      if (response.data?.data) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
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
