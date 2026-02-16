export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export const APP_NAME = 'PicArt';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ARTICLE: (id: string | number) => `/article/${id}`,
  COSER: (id: string | number) => `/cosers/${id}`,
  SEARCH: '/search',
  USER: (id: string | number) => `/user/${id}`,
  PROFILE: '/profile',
  SETTINGS: '/settings',
  WALLET: '/wallet',
  VIP: '/vip',
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  DEVICE_ID: 'device_id',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
