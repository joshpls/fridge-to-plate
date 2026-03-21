// src/pages/Auth.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/apiConfig';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/auth/login' : '/auth/register';

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Pass the token and user data into our global context
                login(data.token, data.data);
                
                // Redirect to the home/discovery page
                navigate('/');
            } else {
                setError(data.message || 'Authentication failed');
            }
        } catch (err) {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl border-2 border-gray-100 shadow-2xl shadow-orange-100/50">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        {isLogin ? 'Enter your credentials to continue' : 'Join the fridge-to-plate experience'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 bg-gray-50 rounded-xl outline-none border-2 border-transparent focus:border-orange-300 font-bold text-gray-900 transition-colors"
                            placeholder="chef@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-1">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 bg-gray-50 rounded-xl outline-none border-2 border-transparent focus:border-orange-300 font-bold text-gray-900 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 py-4 bg-gray-900 hover:bg-orange-500 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        className="text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors"
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
