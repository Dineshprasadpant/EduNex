// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { LoginForm } from '../../components/login/page';

export default function LoginPage() {
    const router = useRouter();
    const [initialEmail, setInitialEmail] = useState('');
    const [initialRememberMe, setInitialRememberMe] = useState(false);

    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setInitialEmail(savedEmail);
            setInitialRememberMe(true);
        }
    }, []);

    const MobileView = () => (
        <div className="md:hidden relative flex h-screen w-full items-center justify-center font-Urbanist">
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/login.png"
                    alt="Creative background"
                    style={{ objectFit: 'cover' }}
                />
            </div>

            <div className="relative z-10 w-11/12 max-w-md bg-white rounded-lg shadow-xl p-8">
                <div className="flex justify-center mb-8">
                    <div className="relative h-12 w-20 ">
                        <img
                            src="/images/logo.png"
                            alt="Logo"
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Welcome Back</h1>
                <p className="text-center text-gray-600 mb-8">Sign in to access your account</p>

                <LoginForm
                    initialEmail={initialEmail}
                    initialRememberMe={initialRememberMe}
                />

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link href="/register" className="font-medium text-[#010794] hover:text-[#25464e]">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );

    const DesktopView = () => (
        <div className="hidden md:flex h-screen w-full font-Urbanist">
            <div className="w-1/2 relative overflow-hidden">
                <img
                    src="/images/login.png"
                    alt="Creative thinking"
                    style={{ objectFit: 'cover' }}
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-12">
                    <div className="text-white text-center max-w-md">
                        <h2 className="text-4xl font-bold mb-4">Welcome to Our Platform</h2>
                        <p className="text-xl mb-8">Sign in to access your personalized dashboard and manage your account.</p>

                    </div>
                </div>
            </div>

            <div className="w-1/2 flex flex-col items-center justify-center p-12 bg-gray-50">
                <div className="w-full max-w-md">
                    <div className="flex justify-center mb-8">
                        <div className="relative h-24 w-30">
                            <img
                                src="/images/logo.png"
                                alt="Logo"
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                    </div>

                    <div className=" p-8 ">
                        <div className="space-y-2 mb-6 text-center">
                            <h1 className="text-2xl font-bold text-gray-800">
                                Sign In to Your Account
                            </h1>
                            <p className="text-gray-600">
                                Enter your credentials to access your account
                            </p>
                        </div>

                        <LoginForm
                            initialEmail={initialEmail}
                            initialRememberMe={initialRememberMe}
                        />

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link href="/register" className="font-medium text-[#010794] hover:text-[#0a1315]">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <MobileView />
            <DesktopView />
            <Toaster position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'white',
                        color: 'black',
                    },
                    success: {
                        duration: 3000,
                        iconTheme: {
                            primary: '#10B981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        duration: 4000,
                        iconTheme: {
                            primary: '#EF4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </>
    );
}