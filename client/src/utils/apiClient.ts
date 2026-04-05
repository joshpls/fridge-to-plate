import { API_BASE } from './apiConfig';

// holds the active refresh request
let refreshPromise: Promise<string | null> | null = null;

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    let token = localStorage.getItem('token');

    const headers = new Headers(options.headers || {});
    
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include',
    };

    // Make the original request
    let response = await fetch(url, config);

    // Intercept 401 Unauthorized errors
    if (response.status === 401) {
        
        // If a refresh isn't already happening, start one
        if (!refreshPromise) {
            refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                credentials: 'include'
            }).then(async (res) => {
                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem('token', data.token);
                    return data.token;
                }
                throw new Error('Session expired');
            }).catch(() => {
                // If the refresh token is also expired, dispatch an event to force logout
                window.dispatchEvent(new Event('auth:forceLogout'));
                return null;
            }).finally(() => {
                refreshPromise = null; // Clear the lock when done
            });
        }

        // Wait for the new token
        const newToken = await refreshPromise;

        // If successfully got a new token, retry the original request
        if (newToken) {
            headers.set('Authorization', `Bearer ${newToken}`);
            response = await fetch(url, { ...config, headers });
        }
    }

    return response;
};
