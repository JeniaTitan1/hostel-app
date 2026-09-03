import React, { useState, useEffect } from "react";

const PWA_INSTALLED_KEY = "mnau_pwa_installed_v1";

/**
 * Адаптивний банер встановлення мобільного додатка під стиль сайту (Light / Dark),
 * який показується при вході, поки додаток не встановлено.
 */
export default function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isAppInstalled, setIsAppInstalled] = useState(true); // за замовчуванням true, поки не перевіримо
    const [isIos, setIsIos] = useState(false);
    const [showIosGuide, setShowIosGuide] = useState(false);
    const [dismissedInSession, setDismissedInSession] = useState(false);

    useEffect(() => {
        // 1. Перевірка чи додаток вже встановлено (Standalone або збережений прапорець)
        const isStandaloneMode =
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true ||
            document.referrer.includes("android-app://");

        const wasInstalledLocally = localStorage.getItem(PWA_INSTALLED_KEY) === "true";

        if (isStandaloneMode || wasInstalledLocally) {
            setIsAppInstalled(true);
            localStorage.setItem(PWA_INSTALLED_KEY, "true");
            return;
        }

        setIsAppInstalled(false);

        // 2. Перевірка iOS Safari
        const ua = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
        setIsIos(isIosDevice);

        // 3. Обробник браузерного промпта встановлення
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const handleAppInstalled = () => {
            setIsAppInstalled(true);
            localStorage.setItem(PWA_INSTALLED_KEY, "true");
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setIsAppInstalled(true);
                localStorage.setItem(PWA_INSTALLED_KEY, "true");
                setDeferredPrompt(null);
            }
        } else if (isIos) {
            setShowIosGuide(true);
        } else {
            // Фолбек для десктопу / браузерів без передчасного промпта
            alert("Щоб додати додаток на телефон, відкрийте меню браузера (⋮) та натисніть «Встановити додаток» або «Додати на головний екран».");
        }
    };

    const handleDismiss = () => {
        setDismissedInSession(true);
    };

    // Якщо додаток вже прив'язано/встановлено або користувач закрив у поточній сесії
    if (isAppInstalled || dismissedInSession) return null;

    return (
        <>
            {/* 1. Адаптивний плаваючий банер (Світла / Темна тема) */}
            <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white/95 dark:bg-gray-800/95 text-slate-800 dark:text-gray-100 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-gray-700/80 shadow-xl shadow-slate-900/10 dark:shadow-2xl dark:shadow-black/50 backdrop-blur-md transition-all duration-300 animate-fade-in-up">
                <div className="flex items-center justify-between gap-3">
                    {/* Ліва частина: Іконка + Текст */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-xs shadow-emerald-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-black text-emerald-700 dark:text-emerald-400 truncate tracking-tight">
                                Додаток МНАУ Кампус
                            </div>
                            <div className="text-[11px] font-medium text-slate-500 dark:text-gray-300 truncate">
                                Швидкий доступ до цифрової QR-перепустки
                            </div>
                        </div>
                    </div>

                    {/* Права частина: Кнопки дії */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleInstallClick}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer touch-manipulation"
                        >
                            Встановити
                        </button>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="w-7 h-7 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700/60 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                            title="Закрити сповіщення"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Інструкція для iOS Safari (Світла / Темна тема) */}
            {showIosGuide && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-white dark:bg-gray-900 text-slate-900 dark:text-white rounded-3xl p-5 border border-slate-200 dark:border-gray-700 shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-3.5">
                            <div className="text-sm font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                <span>Встановлення на iPhone / iPad</span>
                            </div>
                            <button
                                onClick={() => setShowIosGuide(false)}
                                className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-gray-300 text-xs font-bold transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2.5 text-xs text-slate-700 dark:text-gray-200">
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                                <span className="w-6 h-6 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                                    1
                                </span>
                                <span>
                                    Натисніть кнопку <strong>«Поділитися»</strong> (квадрат зі стрілкою внизу в Safari).
                                </span>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                                <span className="w-6 h-6 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                                    2
                                </span>
                                <span>
                                    Прокрутіть меню та виберіть <strong>«На екран "Додому"»</strong>.
                                </span>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                                <span className="w-6 h-6 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                                    3
                                </span>
                                <span>
                                    Натисніть <strong>«Додати»</strong> у правому верхньому кутку.
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setShowIosGuide(false);
                                setIsAppInstalled(true);
                                localStorage.setItem(PWA_INSTALLED_KEY, "true");
                            }}
                            className="w-full mt-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
                        >
                            Зрозуміло, готово
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
