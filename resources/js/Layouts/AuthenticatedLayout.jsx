import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function AuthenticatedLayout({ header, children, user: passedUser }) {
    const { props } = usePage();
    const user = passedUser || props?.auth?.user || { name: 'Гість', email: 'guest@example.com' };

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
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

    const isDashboardActive = route().current('dashboard');

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-gray-900 text-gray-950 dark:text-gray-100 antialiased selection:bg-emerald-100 dark:selection:bg-emerald-900/30 transition-colors duration-200">
            {/* Головна навігаційна панель */}
            <nav className="border-b border-slate-100 dark:border-gray-700/80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            {/* Логотип */}
                            <div className="flex shrink-0 items-center">
                                <Link href={route('dashboard')} className="flex items-center gap-2 focus:outline-none rounded-lg p-1">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm shadow-xs border border-emerald-500/30">
                                        М
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold leading-none text-gray-900 dark:text-white tracking-tight">МНАУ</span>
                                        <span className="text-[9px] font-medium leading-none text-gray-400 mt-0.5 uppercase tracking-wider">Гуртожитки</span>
                                    </div>
                                </Link>
                            </div>

                            {/* Десктопне меню */}
                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <Link
                                    href={route('dashboard')}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 transition-colors duration-150 ease-in-out focus:outline-none ${
                                        isDashboardActive
                                            ? 'border-gray-900 dark:border-emerald-400 text-gray-900 dark:text-white font-semibold'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {user.role === 'admin' ? 'Адмін-панель' : 'Головна'}
                                </Link>
                            </div>
                        </div>

                        {/* Права частина: темна тема + меню користувача */}
                        <div className="hidden sm:ms-6 sm:flex sm:items-center gap-2">
                            {/* Dark mode toggle */}
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-150"
                                title={darkMode ? 'Світла тема' : 'Темна тема'}
                                aria-label="Toggle dark mode"
                            >
                                {darkMode ? (
                                    /* Sun icon */
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    /* Moon icon */
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                    </svg>
                                )}
                            </button>

                            {/* Dropdown меню */}
                            <div className="relative ms-1">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-lg">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium leading-4 text-gray-600 dark:text-gray-200 transition-all duration-150 ease-in-out hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 focus:outline-none"
                                            >
                                                {user.name}
                                                <svg className="-me-0.5 ms-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('profile.edit')}>
                                            Профіль
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button">
                                            Вийти
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Бургер-кнопка для мобілок */}
                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((prev) => !prev)}
                                className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Мобільне меню */}
                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden'}>
                    <div className="space-y-1 pb-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <Link
                            href={route('dashboard')}
                            className={`block w-full ps-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-150 ease-in-out focus:outline-none ${
                                isDashboardActive
                                    ? 'border-gray-900 text-gray-900 bg-gray-50 font-semibold'
                                    : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-800 hover:bg-gray-50/50'
                            }`}
                        >
                            {user.role === 'admin' ? 'Адмін-панель' : 'Головна'}
                        </Link>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pb-1 pt-4 bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-800 dark:text-gray-200">{user.name}</div>
                            <div className="text-sm font-medium text-gray-500">{user.email}</div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <Link href={route('profile.edit')} className="block w-full ps-3 pr-4 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 hover:bg-gray-50 transition-colors duration-150">
                                Профіль
                            </Link>
                            <Link
                                method="post"
                                href={route('logout')}
                                as="button"
                                className="block w-full text-left ps-3 pr-4 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 hover:bg-gray-50 transition-colors duration-150"
                            >
                                Вийти
                            </Link>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="block w-full text-left ps-3 pr-4 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 hover:bg-gray-50 transition-colors duration-150"
                            >
                                {darkMode ? '☀️ Світла тема' : '🌙 Темна тема'}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Підзаголовок сторінки (Шапка) */}
            {header && (
                <header className="bg-white/90 dark:bg-gray-800/90 border-b border-slate-100 dark:border-gray-700/60 backdrop-blur-xs transition-colors duration-200">
                    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            {/* Контент сторінки */}
            <main className="flex-grow">{children}</main>

            {/* Футер університету МНАУ */}
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto py-8 transition-colors duration-200">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                        {/* Лого / Назва */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm">
                                    М
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">МНАУ Гуртожитки</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
                                Інформаційна система розселення та бронювання кімнат у гуртожитках Миколаївського національного аграрного університету.
                            </p>
                        </div>

                        {/* Контакти */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Контакти</h4>
                            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
                                <li><strong>Адреса:</strong> вул. Георгія Гонгадзе, 9, м. Миколаїв, 54020</li>
                                <li><strong>Телефон:</strong> <a href="tel:+380512709331" className="hover:text-emerald-600 transition-colors">+38 (0512) 70-93-31</a></li>
                                <li><strong>Email:</strong> <a href="mailto:rector@mnau.edu.ua" className="hover:text-emerald-600 transition-colors">rector@mnau.edu.ua</a></li>
                            </ul>
                        </div>

                        {/* Корисні посилання */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Корисні посилання</h4>
                            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
                                <li>
                                    <a href="https://www.mnau.edu.ua" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                                        Офіційний сайт МНАУ
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </li>
                                <li>
                                    <a href="https://registry.edbo.gov.ua/university/348/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors">
                                        Реєстр суб'єктів освітньої діяльності
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
                        <span>© {new Date().getFullYear()} Миколаївський національний аграрний університет. Всі права захищені.</span>
                        <span className="font-semibold text-gray-300">ЄДРПОУ 00497213</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
