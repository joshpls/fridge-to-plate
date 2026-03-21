const getBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;

    // If we set it to AUTO, detect if we are at home or away
    if (envUrl === 'AUTO') {
        const { hostname } = window.location;
        
        // If the browser says 'localhost', use local backend
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        
        // Otherwise, use the current IP/Domain we used to get here
        return `http://${hostname}:5000/api`;
    }

    return envUrl;
};

export const API_BASE = getBaseUrl();
