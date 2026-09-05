import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function GuestLayout({ children }) {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('darkMode') === 'true';
        }
        return false;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);
    return (
        <div className="flex min-h-screen flex-col items-center bg-[#f8fafc] dark:bg-[#0b0f19] pt-6 sm:justify-center sm:pt-0 text-gray-900 dark:text-gray-100 transition-colors duration-300 relative overflow-hidden">
            {/* Живий делікатний фон «Ambient Aura Mesh» */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
                {/* Невагома мікро-текстура */}
                <div className="absolute inset-0 bg-dot-pattern opacity-25 dark:opacity-10" />

                {/* М'які живі розсіяні хвилі */}
                <div className="absolute -top-[10%] -left-[10%] w-[550px] h-[550px] sm:w-[700px] sm:h-[700px] bg-gradient-to-br from-emerald-400/12 via-teal-300/8 to-transparent dark:from-emerald-500/15 dark:via-teal-600/10 rounded-full blur-[130px] animate-lava-1" />
                <div className="absolute top-[20%] -right-[15%] w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] bg-gradient-to-bl from-cyan-400/10 via-sky-300/8 to-transparent dark:from-cyan-500/12 dark:via-teal-500/8 rounded-full blur-[140px] animate-lava-2" />
                <div className="absolute -bottom-[20%] left-[20%] w-[550px] h-[550px] bg-gradient-to-tr from-teal-400/8 via-indigo-400/6 to-transparent dark:from-teal-600/10 dark:via-indigo-900/10 rounded-full blur-[140px] animate-lava-3" />
            </div>

            {/* Dark mode toggle */}
            <div className="absolute top-4 right-4 z-55">
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    type="button"
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150 shadow-xs"
                    title={darkMode ? 'Світла тема' : 'Темна тема'}
                    aria-label="Toggle dark mode"
                >
                    {darkMode ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                    )}
                </button>
            </div>

            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-gray-500 dark:text-emerald-500" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg relative">
                {children}
            </div>
        </div>
    );
}
