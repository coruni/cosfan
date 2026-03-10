'use client';

import { useState, useCallback } from 'react';

/**
 * 检测是否为严格模式的浏览器（可能阻止支付跳转）
 */
export function isStrictBrowser(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent.toLowerCase();

  // iOS Safari
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
  const isIOSSafari = isIOS && (isSafari || /webkit/.test(ua));

  // Firefox
  const isFirefox = /firefox/.test(ua) && !/seamonkey/.test(ua);

  // 其他基于WebKit的严格浏览器
  const isWebKit = /webkit/.test(ua) && !/chrome/.test(ua) && !/safari/.test(ua);

  // In-app browsers (WeChat, Alipay, QQ, Baidu, etc.)
  const isWeChat = /micromessenger/.test(ua);
  const isAlipay = /alipayclient/.test(ua);
  const isQQ = /qq/.test(ua) && !/qqdownload/.test(ua);
  const isBaidu = /baidu/.test(ua) && /box/.test(ua);
  const isUC = /ucbrowser|ucweb/.test(ua);
  const isSougou = /sogousearch/.test(ua);
  const isAppBrowser = isWeChat || isAlipay || isQQ || isBaidu || isUC || isSougou;

  // 隐私模式或严格追踪保护的浏览器
  const isNewerIOS = isIOS && /os (1[4-9]|[2-9]\d)/.test(ua);
  const isNewerSafari = isSafari && !isWeChat && !isAlipay;

  return isIOSSafari || isAppBrowser || isNewerIOS || isNewerSafari || isFirefox || isWebKit;
}

/**
 * 获取浏览器名称（用于显示给用户）
 */
export function getBrowserName(): string {
  if (typeof window === 'undefined') return 'Unknown';

  const ua = navigator.userAgent.toLowerCase();

  if (/micromessenger/.test(ua)) return '微信';
  if (/alipayclient/.test(ua)) return '支付宝';
  if (/qq/.test(ua)) return 'QQ浏览器';
  if (/baidu/.test(ua) && /box/.test(ua)) return '百度浏览器';
  if (/ucbrowser|ucweb/.test(ua)) return 'UC浏览器';
  if (/sogousearch/.test(ua)) return '搜狗浏览器';
  if (/firefox/.test(ua)) return 'Firefox';
  if (/opr|opera/.test(ua)) return 'Opera';
  if (/edg/.test(ua)) return 'Edge';
  if (/chrome/.test(ua)) return 'Chrome';
  if (/safari/.test(ua)) return 'Safari';

  return '浏览器';
}

/**
 * 检测是否需要在支付跳转前提示用户
 */
export function needsPaymentRedirectHelp(): boolean {
  return isStrictBrowser();
}

interface UseSafePaymentRedirectOptions {
  /**
   * 支付跳转超时时间（毫秒）
   */
  timeout?: number;
  /**
   * 是否显示手动打开按钮
   */
  showManualOpen?: boolean;
}

/**
 * 安全跳转支付
 * 处理Safari等严格浏览器的兼容性问题
 */
export function useSafePaymentRedirect(options: UseSafePaymentRedirectOptions = {}) {
  const { timeout = 5000, showManualOpen = true } = options;

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showRedirectDialog, setShowRedirectDialog] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirect = useCallback(async (url: string) => {
    setIsRedirecting(true);
    setPaymentUrl(url);
    setError(null);

    const isStrict = isStrictBrowser();

    // 对于严格浏览器，先尝试直接跳转
    if (!isStrict) {
      try {
        // 直接跳转
        window.location.href = url;
        return;
      } catch (e) {
        console.warn('Direct redirect failed, using fallback');
      }
    }

    // 对于严格浏览器或直接跳转失败，显示确认对话框
    setShowRedirectDialog(true);
    setIsRedirecting(false);

    // 设置超时自动跳转
    const timeoutId = setTimeout(() => {
      try {
        window.location.href = url;
      } catch (e) {
        setError('跳转失败，请手动打开支付页面');
      }
    }, timeout);

    // 清理函数
    return () => {
      clearTimeout(timeoutId);
    };
  }, [timeout]);

  /**
   * 手动打开支付页面
   */
  const openPaymentInNewTab = useCallback(() => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    }
  }, [paymentUrl]);

  /**
   * 复制支付链接
   */
  const copyPaymentUrl = useCallback(async () => {
    if (paymentUrl) {
      try {
        await navigator.clipboard.writeText(paymentUrl);
        setShowRedirectDialog(false);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }, [paymentUrl]);

  /**
   * 关闭对话框
   */
  const closeDialog = useCallback(() => {
    setShowRedirectDialog(false);
    setPaymentUrl(null);
    setError(null);
  }, []);

  return {
    redirect,
    isRedirecting,
    showRedirectDialog,
    paymentUrl,
    error,
    showManualOpen,
    openPaymentInNewTab,
    copyPaymentUrl,
    closeDialog,
  };
}