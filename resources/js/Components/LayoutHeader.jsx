import React from "react";
import Dropdown from "@/Components/Dropdown";
import NotificationDropdown from "@/Components/NotificationDropdown";
import { Link } from "@inertiajs/react";

export default function LayoutHeader({
    user,
    notifications = [],
    darkMode,
    setDarkMode,
    showingNavigationDropdown,
    setShowingNavigationDropdown,
    animating,
    header,
}) {
    const isAdminOrCommandant = user?.role === "admin" || user?.role === "commandant";
    const homeRoute = isAdminOrCommandant ? route("admin.dashboard") : route("dashboard");
    const isDashboardActive = route().current("dashboard") || route().current("admin.dashboard");
    const isProfileActive = route().current("profile.edit");

    return (
        <>
            <nav
                className="bg-white/95 dark:bg-gray-900/95 border-b border-slate-100 dark:border-gray-800/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200"
                style={animating ? { border: "none" } : {}}
            >
                <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Left: Logo & Desktop Links */}
                        <div className="flex items-center gap-4 sm:gap-8">
                            <Link
                                href={homeRoute}
                                className="flex items-center gap-2.5 focus:outline-none rounded-xl p-1 group"
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-sm shadow-xs shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                                    М
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black leading-none text-gray-950 dark:text-white tracking-tight">
                                        МНАУ
                                    </span>
                                    <span className="text-[9px] font-semibold leading-none text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-wider">
                                        Гуртожитки
                                    </span>
                                </div>
                            </Link>

                            {/* Desktop Menu */}
                            <div className="hidden sm:flex sm:items-center sm:space-x-2">
                                <Link
                                    href={homeRoute}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        isDashboardActive
                                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    {user.role === "admin"
                                        ? "Панель керування"
                                        : user.role === "commandant"
                                        ? "Панель коменданта"
                                        : "Головна"}
                                </Link>
                            </div>
                        </div>

                        {/* Right Section: Mobile & Desktop Controls */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Dark mode toggle */}
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                type="button"
                                className="p-2 rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/80 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-2xs active:scale-95 touch-manipulation"
                                title={darkMode ? "Світла тема" : "Темна тема"}
                                aria-label="Toggle dark mode"
                            >
                                {darkMode ? (
                                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                    </svg>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            <div className="relative">
                                <NotificationDropdown
                                    notifications={notifications}
                                    user={user}
                                />
                            </div>

                            {/* Desktop User Profile Dropdown */}
                            <div className="hidden sm:flex sm:items-center relative ms-1">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/80 dark:bg-gray-800 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-2xs focus:outline-none"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black flex items-center justify-center">
                                                {user.name?.charAt(0)?.toUpperCase() || "U"}
                                            </div>
                                            <span className="max-w-[120px] truncate">{user.name}</span>
                                            <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content contentClasses="py-1 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-xl rounded-xl">
                                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                            <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.name}</div>
                                            <div className="text-[10px] text-gray-400 truncate">{user.email}</div>
                                        </div>
                                        <Dropdown.Link href={route("profile.edit")}>
                                            Налаштування профілю
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route("logout")} method="post" as="button">
                                            Вийти з системи
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>

                            {/* Mobile Hamburger Button */}
                            <div className="flex items-center sm:hidden">
                                <button
                                    onClick={() => setShowingNavigationDropdown((prev) => !prev)}
                                    type="button"
                                    className="p-2 rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/80 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-2xs active:scale-95 touch-manipulation"
                                    aria-label="Головне меню"
                                >
                                    <svg className="h-5 w-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                        <path
                                            className={!showingNavigationDropdown ? "inline-flex" : "hidden"}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2.5"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                        <path
                                            className={showingNavigationDropdown ? "inline-flex" : "hidden"}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2.5"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Dropdown Menu */}
                {showingNavigationDropdown && (
                    <div className="sm:hidden border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg px-4 pt-3 pb-5 space-y-3 animate-fade-in shadow-xl">
                        {/* User info card on mobile */}
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                                {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                    {user.name}
                                </div>
                                <div className="text-[10px] text-gray-400 truncate">
                                    {user.email}
                                </div>
                                <span className="inline-block px-2 py-0.5 mt-1 rounded-md text-[9px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                    {user.role === "admin" ? "Адміністратор" : user.role === "commandant" ? "Комендант" : "Студент"}
                                </span>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="space-y-1">
                            <Link
                                href={homeRoute}
                                className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                                    isDashboardActive
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                            >
                                <span>
                                    {user.role === "admin"
                                        ? "Панель керування"
                                        : user.role === "commandant"
                                        ? "Панель коменданта"
                                        : "Головна"}
                                </span>
                                <span className="text-gray-400">→</span>
                            </Link>

                            <Link
                                href={route("profile.edit")}
                                className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                                    isProfileActive
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                            >
                                <span>Налаштування профілю</span>
                                <span className="text-gray-400">→</span>
                            </Link>
                        </div>

                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className="w-full flex items-center justify-center gap-2 p-3 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                            >
                                <span>Вийти з системи</span>
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {header && (
                <header className="bg-white/90 dark:bg-[#0c1322]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/80 transition-colors duration-200 relative overflow-hidden">
                    {/* Живий фон «Aurora / Ambient Gradient Mesh» */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                        <div className="absolute inset-0 bg-dot-pattern opacity-40 dark:opacity-30" />
                        <div className="absolute -top-10 -left-12 w-80 h-40 bg-gradient-to-r from-emerald-400/25 to-teal-400/20 dark:from-emerald-500/20 dark:to-teal-500/15 rounded-full blur-2xl animate-aurora-1" />
                        <div className="absolute -top-8 -right-12 w-80 h-40 bg-gradient-to-l from-sky-400/25 to-emerald-400/20 dark:from-sky-500/20 dark:to-emerald-500/15 rounded-full blur-2xl animate-aurora-2" />
                    </div>
                    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 relative z-10">
                        {header}
                    </div>
                </header>
            )}
        </>
    );
}
