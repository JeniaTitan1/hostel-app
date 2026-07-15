import ApplicationLogo from '@/Components/ApplicationLogo';
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
        <div className="min-h-screen bg-gray-50 text-gray-900 antialiased selection:bg-gray-200">
            {/* Головна навігаційна панель */}
            <nav className="border-b border-gray-200/80 bg-white sticky top-0 z-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            {/* Логотип */}
                            <div className="flex shrink-0 items-center">
                                <Link href="/" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 rounded-lg p-1">
                                    <ApplicationLogo className="block h-8 w-auto fill-current text-gray-900" />
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
                                    Dashboard
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
                            Dashboard
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
            <main>{children}</main>
        </div>
    );
}
