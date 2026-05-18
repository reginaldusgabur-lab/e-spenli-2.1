'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type NetworkState = 'good' | 'weak' | 'offline';

export default function NetworkStatus() {
  const [status, setStatus] = useState<NetworkState>('good');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    const checkConnectivity = async () => {
      try {
        // Use a HEAD request to a highly available, small resource.
        // The `no-cache` header ensures we are hitting the network.
        // A timestamp query parameter (`_=${new Date().getTime()}`) prevents the browser from returning a cached result for the HEAD request itself.
        await fetch(`https://www.google.com/images/cleardot.gif?_=${new Date().getTime()}`, {
          method: 'HEAD',
          cache: 'no-cache',
          mode: 'no-cors', // We only care about the success/failure of the request, not the content
        });

        // If the fetch succeeds, we are online. Now, check the quality.
        const connection = (navigator as any).connection;
        if (connection && connection.effectiveType) {
          switch (connection.effectiveType) {
            case 'slow-2g':
            case '2g':
              setStatus('weak');
              break;
            case '3g':
            case '4g':
            default:
              setStatus('good');
              break;
          }
        } else {
          setStatus('good'); // Fallback to good if quality API is unavailable
        }
      } catch (error) {
        // A failed fetch is the most reliable indicator of being offline.
        setStatus('offline');
      }
    };

    // Check immediately on component mount.
    checkConnectivity();

    // Use event listeners for quick feedback, but rely on polling for ultimate accuracy.
    window.addEventListener('online', checkConnectivity);
    window.addEventListener('offline', checkConnectivity);

    // Set up the robust polling mechanism.
    const pollingInterval = setInterval(checkConnectivity, 5000);

    return () => {
      window.removeEventListener('online', checkConnectivity);
      window.removeEventListener('offline', checkConnectivity);
      clearInterval(pollingInterval);
    };
  }, []);

  const renderIcon = () => {
    if (status === 'offline') {
      return <WifiOff className="h-5 w-5 text-red-500" />;
    }
    const color = status === 'good' ? 'text-green-500' : 'text-yellow-500';
    return <Wifi className={`h-5 w-5 ${color}`} />;
  };

  const getTooltipContent = () => {
    switch (status) {
      case 'offline':
        return 'Offline: Tidak ada koneksi internet';
      case 'weak':
        return 'Online: Koneksi lemah';
      case 'good':
      default:
        return 'Online: Koneksi stabil';
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center h-full">
            {renderIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
