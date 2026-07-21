import React from "react";
import Dropdown from "@/Components/Dropdown";
import { router } from "@inertiajs/react";

export function getNotificationStyle(title) {
    const lowerTitle = title.toLowerCase();
    if (
        lowerTitle.includes("схвалено") ||
        lowerTitle.includes("заселення")
    ) {
        return {
            bg: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/20",
            icon: (
                <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                    />
                </svg>
            ),
        };
    } else if (
        lowerTitle.includes("відхилено") ||
        lowerTitle.includes("виселення")
    ) {
        return {
            bg: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100/50 dark:border-red-900/20",
            icon: (
                <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            ),
        };
    } else if (
        lowerTitle.includes("переселення") ||
        lowerTitle.includes("переведен")
    ) {
        return {
            bg: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100/50 dark:border-blue-900/20",
            icon: (
                <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                    />
                </svg>
            ),
        };
    } else {
        return {
            bg: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/20",
            icon: (
                <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            ),
        };
    }
}

export default function NotificationDropdown({ notifications = [], user }) {
    const handleDismissNotification = (id) => {
        router.post(
            route("notifications.read", id),
            {},
            { preserveScroll: true }
        );
    };

    const handleClearAllNotifications = () => {
        router.post(
            route("notifications.readAll"),
            {},
            { preserveScroll: true }
        );
    };

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <span className="inline-flex rounded-lg">
                    <button
                        type="button"
                        className="group relative inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-150 ease-in-out focus:outline-none"
                        title="Сповіщення"
                    >
                        {/* Bell icon with hover wiggle */}
                        <svg
                            className="w-4 h-4 group-hover:animate-wiggle transition-transform origin-top"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-white dark:ring-gray-700 animate-pulse">
                                {notifications.length}
                            </span>
                        )}
                    </button>
                </span>
            </Dropdown.Trigger>

            <Dropdown.Content width="80">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700/80 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/40">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                        Сповіщення
                    </span>
                    {notifications.length > 0 && user?.role !== "admin" && (
                        <button
                            onClick={handleClearAllNotifications}
                            className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors uppercase tracking-wider"
                        >
                            Очистити все
                        </button>
                    )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50 w-72">
                    {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400 dark:text-gray-500">
                            Немає нових сповіщень
                        </div>
                    ) : (
                        notifications.map((n) => {
                            const style = getNotificationStyle(n.title);
                            return (
                                <div
                                    key={n.id}
                                    className="p-3.5 flex items-start gap-3 hover:bg-slate-50/70 dark:hover:bg-gray-750/30 transition-all duration-200 relative group border-l-2 border-transparent hover:border-emerald-500/50 dark:hover:border-emerald-500/30"
                                >
                                    <div
                                        className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border ${style.bg} transition-all group-hover:scale-105 duration-200 shadow-sm`}
                                    >
                                        {style.icon}
                                    </div>
                                    <div className="flex-grow space-y-1 pr-4">
                                        <p className="text-[11px] font-semibold text-gray-900 dark:text-white leading-snug">
                                            {n.title}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
                                            {n.message}
                                        </p>
                                        <span className="text-[8px] font-semibold text-gray-400 dark:text-gray-500 block pt-0.5">
                                            {new Date(
                                                n.created_at
                                            ).toLocaleDateString()}{" "}
                                            {new Date(
                                                n.created_at
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                    {user?.role !== "admin" && (
                                        <button
                                            onClick={() =>
                                                handleDismissNotification(n.id)
                                            }
                                            className="absolute top-3.5 right-2.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 focus:opacity-100 focus:translate-x-0"
                                            title="Видалити"
                                        >
                                            <svg
                                                className="w-3.5 h-3.5 hover:rotate-90 hover:scale-110 transition-transform duration-200"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </Dropdown.Content>
        </Dropdown>
    );
}
