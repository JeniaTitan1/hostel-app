import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children, user: passedUser }) {
    // Безопасно достаем user из глобального состояния Inertia или используем переданный проп,
    // а если ничего нет — создаем пустой объект-заглушку, чтобы не падала ошибка undefined
    const { props } = usePage();
    const user = passedUser || props?.auth?.user || { name: 'Гість', email: 'guest@example.com' };

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    // Перевірка активного роуту для лінків
    const isDashboardActive = route().current('dashboard');

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased selection:bg-gray-200">
            {/* Головна навігаційна панель */}
            <nav className="border-b border-gray-200/80 bg-white sticky top-0 z-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            {/* Логотип (университетский стиль без иконки Laravel) */}
                            <div className="flex shrink-0 items-center">
                                <Link href={route('dashboard')} className="flex items-center gap-2 focus:outline-none rounded-lg p-1">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm shadow-xs border border-emerald-500/30">
                                        М
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold leading-none text-gray-900 tracking-tight">МНАУ</span>
                                        <span className="text-[9px] font-medium leading-none text-gray-400 mt-0.5 uppercase tracking-wider">Гуртожитки</span>
                                    </div>
                                </Link>
                            </div>

                            {/* Десктопне меню */}
                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <Link
                                    href={route('dashboard')}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
                                        isDashboardActive
                                            ? 'border-gray-900 text-gray-900 font-semibold'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {user.role === 'admin' ? 'Адмін-панель' : 'Головна'}
                                </Link>
                            </div>
                        </div>

                        {/* Випадаюче меню користувача */}
                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-lg">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-600 transition-all duration-150 ease-in-out hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                                            >
                                                {user.name}
                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4 text-gray-400 transition-transform duration-150"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('profile.edit')}>
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Бургер-кнопка для мобілок */}
                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((prev) => !prev)}
                                className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
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
                    <div className="space-y-1 pb-3 pt-2 border-t border-gray-100">
                        <Link
                            href={route('dashboard')}
                            className={`block w-full ps-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-150 ease-in-out focus:outline-none ${
                                isDashboardActive
                                    ? 'border-gray-900 text-gray-900 bg-gray-50 font-semibold'
                                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50/50'
                            }`}
                        >
                            {user.role === 'admin' ? 'Адмін-панель' : 'Головна'}
                        </Link>
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4 bg-gray-50/50">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-800">{user.name}</div>
                            <div className="text-sm font-medium text-gray-500">{user.email}</div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <Link href={route('profile.edit')} className="block w-full ps-3 pr-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors duration-150">
                                Profile
                            </Link>
                            <Link
                                method="post"
                                href={route('logout')}
                                as="button"
                                className="block w-full text-left ps-3 pr-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors duration-150"
                            >
                                Log Out
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Підзаголовок сторінки (Шапка) */}
            {header && (
                <header className="bg-white border-b border-gray-200/60">
                    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            {/* Контент сторінки */}
            <main className="flex-grow">{children}</main>

            {/* Футер університету МНАУ */}
            <footer className="bg-white border-t border-gray-200 mt-auto py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-6 border-b border-gray-100">
                        {/* Лого / Назва */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm">
                                    М
                                </div>
                                <span className="font-bold text-gray-900 text-sm tracking-tight">МНАУ Гуртожитки</span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                                Інформаційна система розселення та бронювання кімнат у гуртожитках Миколаївського національного аграрного університету.
                            </p>
                        </div>

                        {/* Контакти */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Контакти</h4>
                            <ul className="text-xs text-gray-500 space-y-2">
                                <li><strong>Адреса:</strong> вул. Георгія Гонгадзе, 9, м. Миколаїв, 54020</li>
                                <li><strong>Телефон:</strong> <a href="tel:+380512709331" className="hover:text-emerald-600 transition-colors">+38 (0512) 70-93-31</a></li>
                                <li><strong>Email:</strong> <a href="mailto:rector@mnau.edu.ua" className="hover:text-emerald-600 transition-colors">rector@mnau.edu.ua</a></li>
                            </ul>
                        </div>

                        {/* Корисні посилання */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Корисні посилання</h4>
                            <ul className="text-xs text-gray-500 space-y-2">
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
