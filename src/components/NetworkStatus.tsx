'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import { WifiOff, Wifi, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Offline status component
 * Shows when user goes offline
 */
export function OfflineIndicator() {
  const { isOffline } = useNetwork();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  // Delay showing to let user see content first
  useEffect(() => {
    if (isOffline) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
    // Hide when network is restored
    setIsVisible(false);
    setIsDismissing(false);
    return undefined;
  }, [isOffline]);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300',
        isDismissing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      )}
    >
      <div className="bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <WifiOff className="h-5 w-5 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="font-medium text-sm">You are offline</span>
          <span className="text-xs opacity-90">Some features may not be available</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-white hover:bg-white/20 ml-2"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

/**
 * Network status badge for good connections
 */
export function NetworkStatusBadge() {
  const { isOnline, effectiveType } = useNetwork();

  if (isOnline && effectiveType !== 'unknown') {
    return null;
  }

  const isSlowNetworkType = ['slow-2g', '2g', '3g'].includes(effectiveType || '');

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 px-3 py-2 rounded-full text-xs flex items-center gap-2 transition-opacity duration-300',
        isSlowNetworkType ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
      )}
    >
      {isSlowNetworkType ? (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>Slow network</span>
        </>
      ) : (
        <>
          <Wifi className="h-3 w-3" />
          <span>Connected</span>
        </>
      )}
    </div>
  );
}

/**
 * Slow network indicator component
 */
export function SlowNetworkIndicator() {
  const { effectiveType, saveData } = useNetwork();
  const [isVisible, setIsVisible] = useState(false);

  const isSlow = ['slow-2g', '2g', '3g'].includes(effectiveType || '');

  useEffect(() => {
    if (isSlow || saveData) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
    return undefined;
  }, [isSlow, saveData]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-blue-600 text-white text-xs px-3 py-2 rounded-md flex items-center gap-2 shadow-lg">
        <AlertCircle className="h-3 w-3" />
        <span>
          {saveData
            ? 'Data saver mode enabled'
            : 'Slow network detected, optimized loading'}
        </span>
      </div>
    </div>
  );
}

/**
 * Auto refresh component - prompts user when network is restored
 */
export function NetworkReconnectPrompt() {
  const { isOnline } = useNetwork();
  const [showPrompt, setShowPrompt] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const handleLater = useCallback(() => {
    setShowPrompt(false);
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // Network restored
      setShowPrompt(true);
    }
  }, [isOnline, wasOffline]);

  if (!showPrompt) return null;

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-background border rounded-lg shadow-xl p-6 max-w-sm text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <Wifi className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">Network Restored</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Your network connection is back. Would you like to refresh to get the latest content?
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={handleLater}>
            Later
          </Button>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}