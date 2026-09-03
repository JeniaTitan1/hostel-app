import React, { useState, useEffect } from "react";

/**
 * Кнопка та банер для встановлення мобільного додатка PWA в 1 клік
 * з підтримкою Android (WebAPK direct install) та iOS (Safari guide).
 */
export default function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [showIosGuide, setShowIosGuide] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Перевірка чи додаток вже запущено у standalone режимі
        const isStandaloneMode =
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone ||
            document.referrer.includes("android-app://");
        setIsStandalone(isStandaloneMode);

        // Перевірка iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIos(isIosDevice);

        // Обробник стандартного PWA prompt від браузера (Android/Chrome/Edge)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Перевірка чи користувач не закрив банер у поточній сесії
        if (sessionStorage.getItem("pwa_banner_dismissed") === "true") {
            setDismissed(true);
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setDeferredPrompt(null);
            }
        } else if (isIos) {
            setShowIosGuide(true);
        } else {
            // Для інших випадків
            alert("Для встановлення додатка натисніть меню браузера (три крапки) та виберіть 'Встановити додаток' або 'Додати на головний екран'.");
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem("pwa_banner_dismissed", "true");
    };

    // Якщо вже встановлено або закрито користувачем (і немає активного промпта)
    if (isStandalone) return null;

    return (
        <>
            {/* 1. Плаваючий мобільний міні-банер (якщо доступно) */}
            {!dismissed && (deferredPrompt || isIos) && (
                <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm z-40 bg-slate-900/95 dark:bg-gray-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-emerald-500/40 shadow-2xl shadow-emerald-950/40 flex items-center justify-between gap-3 animate-fade-in-up">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-xs">
                            📱
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-black text-emerald-400 truncate">
                                Додаток МНАУ Кампус
                            </div>
                            <div className="text-[10px] text-gray-300 truncate">
                                Офлайн QR-перепустка та 3D лампа
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={handleInstallClick}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-black transition-all shadow-xs"
                        >
                            Встановити
                        </button>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="w-7 h-7 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
                            title="Закрити сповіщення"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Інструкція для iOS Safari */}
            {showIosGuide && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-slate-900 text-white rounded-3xl p-5 border border-emerald-500/30 shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-3">
                            <div className="text-sm font-black text-emerald-400">
                                Встановлення на iPhone / iPad
                            </div>
                            <button
                                onClick={() => setShowIosGuide(false)}
                                className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-xs text-gray-200">
                            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                                    1
                                </span>
                                <span>
                                    Натисніть кнопку <strong>«Поділитися»</strong> (іконка <span className="inline-block px-1 bg-white/20 rounded">⎋</span> або квадрат зі стрілкою внизу Safari).
                                </span>
                            </div>

                            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                                    2
                                </span>
                                <span>
                                    Прокрутіть меню та виберіть <strong>«На екран "Додому"»</strong> (<span className="inline-block px-1 bg-white/20 rounded">➕</span>).
                                </span>
                            </div>

                            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                                    3
                                </span>
                                <span>
                                    Натисніть <strong>«Додати»</strong> у правому верхньому кутку.
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowIosGuide(false)}
                            className="w-full mt-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-all"
                        >
                            Зрозуміло
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
