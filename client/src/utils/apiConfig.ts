export const getNetworkImageUrl = (dbUrl: string) => {
    if (!dbUrl) return '';
    
    // If the image URL hardcoded 'localhost', swap it for our current active server IP
    if (dbUrl.includes('localhost:5000')) {
        // Extract the base server URL (e.g., http://97.115.198.3:5000)
        const currentServer = API_BASE.replace('/api', '');
        return dbUrl.replace('http://localhost:5000', currentServer);
    }
    
    // If it's already a relative path (e.g., /uploads/image.jpg), append the server URL
    if (dbUrl.startsWith('/uploads')) {
        const currentServer = API_BASE.replace('/api', '');
        return `${currentServer}${dbUrl}`;
    }

    return dbUrl; // Return as-is if it's an external URL (like Unsplash)
};

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
