import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiClient';

export const JoinHousehold = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { user, switchHousehold } = useAuth();
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Joining household...');

    // [FIX] Moved outside of the useEffect
    const joinAttempted = useRef(false); 

    useEffect(() => {
        const join = async () => {
            if (!user) {
                // Allows brand new users to create an account, then routes them right back here!
                const encodedReturnUrl = encodeURIComponent(`/join/${token}`);
                navigate(`/auth?returnUrl=${encodedReturnUrl}`);
                return;
            }

            if (joinAttempted.current) return;
            joinAttempted.current = true;

            try {
                const res = await fetchWithAuth(`${API_BASE}/household/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage('Successfully joined the household!');
                    if (data.data?.householdId) {
                        await switchHousehold(data.data.householdId);
                    }
                    setTimeout(() => navigate('/pantry'), 2000);
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Failed to join household.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('A network error occurred.');
            }
        };

        if (token) join();
    }, [token, user, navigate, switchHousehold]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4 dark:text-white">Household Invitation</h2>
                
                {status === 'loading' && (
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-300">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-green-600 dark:text-green-400 font-medium">
                        <p>{message}</p>
                        <p className="text-sm mt-2 text-gray-500">Redirecting to your new pantry...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-red-600 dark:text-red-400 font-medium">
                        <p>{message}</p>
                        <button 
                            onClick={() => navigate('/')}
                            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Go Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
