// src/hooks/useWakeLock.ts
import { useEffect, useRef, useState, useCallback } from 'react';

export const useWakeLock = (autoEnable: boolean = false) => {
    const [isLocked, setIsLocked] = useState(false);
    // @ts-ignore - WakeLockSentinel
    const wakeLockRef = useRef<any>(null);

    const requestWakeLock = useCallback(async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                setIsLocked(true);
                
                // If the system overrides and releases the lock (e.g., low battery)
                wakeLockRef.current.addEventListener('release', () => {
                    setIsLocked(false);
                });
            } catch (err: any) {
                console.error(`Wake Lock error: ${err.name}, ${err.message}`);
            }
        } else {
            console.warn('Wake Lock API not supported in this browser.');
        }
    }, []);

    const releaseWakeLock = useCallback(async () => {
        if (wakeLockRef.current !== null) {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
            setIsLocked(false);
        }
    }, []);

    // Handle Auto-Enable on Mount & Cleanup on Unmount
    useEffect(() => {
        if (autoEnable) {
            requestWakeLock();
        }
        return () => {
            releaseWakeLock();
        };
    }, [autoEnable, requestWakeLock, releaseWakeLock]);

    // Handle Tab Visibility Changes - release wake lock if switch tab.
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (autoEnable && document.visibilityState === 'visible' && !isLocked) {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [autoEnable, isLocked, requestWakeLock]);

    return { isLocked, requestWakeLock, releaseWakeLock };
};
