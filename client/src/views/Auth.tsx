// src/pages/Auth.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/apiConfig';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [searchParams] = useSearchParams();
    
    // Core Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Optional Profile State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [alias, setAlias] = useState('');
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (isAuthenticated) {
            const returnUrl = searchParams.get('returnUrl');
            // If there's a returnUrl, use it. Otherwise, default to home.
            navigate(returnUrl ? decodeURIComponent(returnUrl) : '/', { replace: true });
        }
    }, [isAuthenticated, navigate, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const payload = isLogin 
            ? { email, password } 
            : { email, password, firstName, lastName, alias };

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            login(data.token, data.data);
            
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-gray-100 dark:border-gray-800/50 shadow-2xl shadow-orange-100/50">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
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
                    {!isLogin && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-1">
                                        First Name <span className="text-gray-300 normal-case tracking-normal">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none border-2 border-transparent focus:border-orange-300 font-bold text-gray-900 dark:text-white transition-colors"
                                        placeholder="Jane"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-1">
                                        Last Name <span className="text-gray-300 normal-case tracking-normal">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none border-2 border-transparent focus:border-orange-300 font-bold text-gray-900 dark:text-white transition-colors"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-1">
                                    Display Name <span className="text-gray-300 normal-case tracking-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={alias}
                                    onChange={(e) => setAlias(e.target.value)}
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none border-2 border-transparent focus:border-orange-300 font-bold text-gray-900 dark:text-white transition-colors"
                                    placeholder="ChefJane99"
                                />
                            </div>
                        </>
                    )}

                    {/* Standard Auth Fields */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none border-2 border-transparent focus:border-orange-300 font-bold text-gray-900 dark:text-white transition-colors"
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
                            className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none border-2 border-transparent focus:border-orange-300 font-bold text-gray-900 dark:text-white transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 py-4 bg-gray-900 hover:bg-orange-50 dark:bg-orange-500/150 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            setFirstName('');
                            setLastName('');
                            setAlias('');
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
