import { useEffect } from 'react';

/**
 * Hook to automatically check for new deployments on Vercel / production.
 * When a new git push is deployed, it detects the new build ID from /version.json
 * and automatically reloads the page for all connected clients.
 */
export function useAutoUpdate() {
    useEffect(() => {
        // Skip during local development to avoid interfering with Vite HMR
        if (import.meta.env.DEV) return;

        const currentVersion = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : null;
        if (!currentVersion) return;

        console.log(
            `%c[UIU Planner AutoUpdate] Active | Current build: ${currentVersion}`,
            'color: #10b981; font-weight: bold; font-size: 11px;'
        );

        let isChecking = false;

        const checkLatestVersion = async () => {
            if (isChecking) return;
            isChecking = true;

            try {
                // Bust cache with query timestamp and no-cache headers
                const res = await fetch(`/version.json?t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.version && data.version !== currentVersion) {
                        // Prevent rapid reload loops during edge propagation
                        const lastReload = sessionStorage.getItem('uiu_last_reload_ver');
                        const lastReloadTime = Number(sessionStorage.getItem('uiu_last_reload_time') || 0);
                        const now = Date.now();

                        if (lastReload === data.version && now - lastReloadTime < 20000) {
                            return;
                        }

                        sessionStorage.setItem('uiu_last_reload_ver', data.version);
                        sessionStorage.setItem('uiu_last_reload_time', String(now));

                        console.log(
                            `%c[UIU Planner AutoUpdate] 🚀 New deployment detected: ${data.version} (current: ${currentVersion}). Reloading...`,
                            'color: #f59e0b; font-weight: bold; font-size: 12px;'
                        );

                        // Reload to apply the newly deployed bundle
                        window.location.reload();
                    }
                }
            } catch {
                // Silently ignore transient network drops
            } finally {
                isChecking = false;
            }
        };

        // Poll every 12 seconds for prompt update detection
        const intervalId = setInterval(checkLatestVersion, 12000);

        // Also check immediately when the user returns to this tab or window gains focus
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkLatestVersion();
            }
        };

        window.addEventListener('focus', checkLatestVersion);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', checkLatestVersion);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
}
