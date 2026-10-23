import { useEffect } from 'react';

/**
 * Hook to automatically check for new deployments.
 * When a new git push / build is deployed, this detects the version change
 * and reloads the page so all users/clients get the latest updates automatically.
 */
export function useAutoUpdate() {
    useEffect(() => {
        // Skip in local development to avoid interfering with Vite HMR
        if (import.meta.env.DEV) return;

        const currentVersion = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : null;
        if (!currentVersion) return;

        let isChecking = false;

        const checkLatestVersion = async () => {
            if (isChecking) return;
            isChecking = true;

            try {
                // Bust cache with query param & no-store headers
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
                        // Prevent rapid reload loops in case of edge CDN propagation lag
                        const lastReload = sessionStorage.getItem('uiu_last_reload_ver');
                        const lastReloadTime = Number(sessionStorage.getItem('uiu_last_reload_time') || 0);
                        const now = Date.now();

                        if (lastReload === data.version && now - lastReloadTime < 30000) {
                            return;
                        }

                        sessionStorage.setItem('uiu_last_reload_ver', data.version);
                        sessionStorage.setItem('uiu_last_reload_time', String(now));
                        console.log(`[AutoUpdate] New version detected: ${data.version} (current: ${currentVersion}). Refreshing...`);
                        window.location.reload();
                    }
                }
            } catch {
                // Silently ignore network errors (e.g. user offline)
            } finally {
                isChecking = false;
            }
        };

        // Poll every 25 seconds
        const intervalId = setInterval(checkLatestVersion, 25000);

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
