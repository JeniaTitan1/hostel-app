import React from "react";
import Dropdown from "@/Components/Dropdown";
import NotificationDropdown from "@/Components/NotificationDropdown";
import { Link } from "@inertiajs/react";
import { useIsMobileApp } from "@/Utils/mobileAppDetector";

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
    const isMobileApp = useIsMobileApp();

    return (
        <>
            <nav className="bg-white/85 dark:bg-[#0c1427]/85 border-b border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl sticky top-0 z-50 transition-all duration-300 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
                <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
                    <div className="flex h-14 items-center justify-between">
                        {/* Left: Logo & Desktop Links */}
                        <div className="flex items-center gap-4 sm:gap-8">
                            <Link
                                href={homeRoute}
                                className="flex items-center gap-2.5 sm:gap-3 focus:outline-none rounded-2xl p-1 group"
                            >
                                <div className="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 text-white font-black text-sm shadow-md shadow-emerald-500/25 ring-1 ring-white/30 dark:ring-white/20 transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-emerald-500/35 active:scale-95">
                                    <span className="tracking-tight">М</span>
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-300 dark:bg-teal-400 ring-2 ring-white dark:ring-[#070e1b] animate-pulse" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5 leading-none">
                                        <span className="text-sm font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 dark:from-white dark:via-slate-100 dark:to-emerald-200 bg-clip-text text-transparent">
                                            МНАУ
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-400/25">
                                            Кампус
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-semibold leading-none text-slate-400 dark:text-slate-400 mt-1 uppercase tracking-widest">
                                        Гуртожитки
                                    </span>
                                </div>
                            </Link>

                            {/* Desktop Menu */}
                            <div className="hidden sm:flex sm:items-center sm:space-x-2">
                                <Link
                                    href={homeRoute}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                                        isDashboardActive
                                            ? "bg-emerald-500/12 dark:bg-emerald-400/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/25 dark:border-emerald-400/30 shadow-xs shadow-emerald-500/10"
                                            : "text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.06]"
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full transition-all ${isDashboardActive ? "bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] scale-110" : "bg-transparent"}`} />
                                    <span>
                                        {user.role === "admin"
                                            ? "Панель керування"
                                            : user.role === "commandant"
                                            ? "Панель коменданта"
                                            : "Головна"}
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Right Section: Mobile & Desktop Controls */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Dark mode toggle */}
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                type="button"
                                className="relative p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.06] text-slate-600 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-white/[0.12] transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer touch-manipulation group"
                                title={darkMode ? "Увімкнути світлу тему" : "Увімкнути темну тему"}
                                aria-label="Toggle dark mode"
                            >
                                {darkMode ? (
                                    <svg className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)] group-hover:rotate-45 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 text-slate-700 group-hover:-rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
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
                                            className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.06] pl-2 pr-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-white/[0.12] transition-all shadow-xs hover:shadow-sm focus:outline-none cursor-pointer"
                                        >
                                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs ring-1 ring-white/30 dark:ring-white/15">
                                                {user.name?.charAt(0)?.toUpperCase() || "U"}
                                            </div>
                                            <span className="max-w-[130px] truncate">{user.name}</span>
                                            <svg className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content contentClasses="py-1.5 bg-white/95 dark:bg-[#0c1427]/95 border border-slate-200/80 dark:border-white/10 shadow-2xl rounded-2xl backdrop-blur-xl">
                                        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/10">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate">{user.email}</div>
                                        </div>
                                        <Dropdown.Link href={route("profile.edit")}>
                                            Налаштування профілю
                                        </Dropdown.Link>
                                        {!isMobileApp && (
                                            <button
                                                type="button"
                                                onClick={() => window.dispatchEvent(new CustomEvent("open-pwa-install"))}
                                                className="w-full text-start px-4 py-2 text-xs leading-5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 focus:outline-none transition-colors duration-150 flex items-center gap-1.5 font-semibold cursor-pointer"
                                            >
                                                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                <span>Мобільний додаток</span>
                                            </button>
                                        )}
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
                                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.12] transition-all shadow-xs active:scale-95 touch-manipulation cursor-pointer"
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
                    <div className="sm:hidden border-t border-slate-200/60 dark:border-white/10 bg-white/90 dark:bg-[#080f1e]/90 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-3 animate-fade-in shadow-2xl">
                        {/* User info card on mobile */}
                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold text-sm flex items-center justify-center shadow-xs ring-1 ring-white/30 dark:ring-white/20">
                                {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {user.name}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
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
                                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                                }`}
                            >
                                <span>
                                    {user.role === "admin"
                                        ? "Панель керування"
                                        : user.role === "commandant"
                                        ? "Панель коменданта"
                                        : "Головна"}
                                </span>
                                <span className="text-slate-400">→</span>
                            </Link>

                            <Link
                                href={route("profile.edit")}
                                className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                                    isProfileActive
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                                }`}
                            >
                                <span>Налаштування профілю</span>
                                <span className="text-slate-400">→</span>
                            </Link>

                            {!isMobileApp && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowingNavigationDropdown(false);
                                        window.dispatchEvent(new CustomEvent("open-pwa-install"));
                                    }}
                                    className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 transition-all cursor-pointer"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <span>Встановити мобільний додаток</span>
                                    </span>
                                    <span className="text-emerald-500 font-bold">📲</span>
                                </button>
                            )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-white/10">
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
                <div className="relative z-40 transition-colors duration-300">
                    {/* Чистий, суцільний скляний бар підрозділу без розмитих градієнтів */}
                    <div className="bg-white/75 dark:bg-[#0c1427]/75 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/[0.06] shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
                        <div className="mx-auto max-w-7xl px-4 py-2.5 sm:py-3 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
