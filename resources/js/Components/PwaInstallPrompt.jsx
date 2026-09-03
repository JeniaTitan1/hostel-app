import React, { useState, useEffect } from "react";
import QRCode from "qrcode";

const PWA_INSTALLED_KEY = "mnau_pwa_installed_v1";

/**
 * Розумний помічник встановлення мобільного додатка:
 * - Автоматично детектує пристрій (Android, iOS iPhone/iPad, або Desktop комп'ютер)
 * - На комп'ютері генерує QR-код для швидкого сканування смартфоном
 * - На Android викликає 1-клік інсталяцію (WebAPK)
 * - На iPhone показує нативну 3-крокову інструкцію Safari
 * - Має постійні тригери у футері та меню профілю
 */
export default function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isAppInstalled, setIsAppInstalled] = useState(false);
    const [deviceType, setDeviceType] = useState("desktop"); // 'android' | 'ios' | 'desktop'
    const [showModal, setShowModal] = useState(false);
    const [showFloatingBanner, setShowFloatingBanner] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

    useEffect(() => {
        // 1. Детекція типу пристрою
        const ua = (window.navigator.userAgent || "").toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
        const isAndroidDevice = /android/.test(ua);

        if (isIosDevice) {
            setDeviceType("ios");
        } else if (isAndroidDevice) {
            setDeviceType("android");
        } else {
            setDeviceType("desktop");
        }

        // 2. Перевірка чи додаток вже встановлено
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true ||
            document.referrer.includes("android-app://");

        const wasInstalledLocally = localStorage.getItem(PWA_INSTALLED_KEY) === "true";

        if (isStandalone || wasInstalledLocally) {
            setIsAppInstalled(true);
            localStorage.setItem(PWA_INSTALLED_KEY, "true");
        } else {
            setIsAppInstalled(false);
            // Показуємо банер при вході, якщо це мобільний або десктоп
            setShowFloatingBanner(true);
        }

        // 3. Обробник стандартного браузерного PWA prompt (Chrome / Android / Edge)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const handleAppInstalled = () => {
            setIsAppInstalled(true);
            setShowFloatingBanner(false);
            setShowModal(false);
            localStorage.setItem(PWA_INSTALLED_KEY, "true");
            setDeferredPrompt(null);
        };

        // 4. Глобальний слухач для відкриття модалки з будь-якого посилання на сайті
        const handleOpenInstaller = () => {
            setShowModal(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);
        window.addEventListener("open-pwa-install", handleOpenInstaller);

        // 5. Генерація QR-коду сайту для ПК-версії
        if (typeof window !== "undefined") {
            QRCode.toDataURL(window.location.origin, {
                width: 220,
                margin: 1,
                color: {
                    dark: "#064e3b",
                    light: "#ffffff",
                },
                errorCorrectionLevel: "M",
            })
                .then((url) => setQrCodeDataUrl(url))
                .catch((err) => console.error("PWA QR generation error:", err));
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
            window.removeEventListener("open-pwa-install", handleOpenInstaller);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setIsAppInstalled(true);
                setShowFloatingBanner(false);
                setShowModal(false);
                localStorage.setItem(PWA_INSTALLED_KEY, "true");
                setDeferredPrompt(null);
            }
        } else {
            // Відкриваємо детальне вікно з інструкціями відповідно до пристрою
            setShowModal(true);
        }
    };

    return (
        <>
            {/* 1. Плаваючий стартовий міні-банер (якщо додаток ще не встановлено) */}
            {showFloatingBanner && !isAppInstalled && (
                <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white/95 dark:bg-gray-800/95 text-slate-800 dark:text-gray-100 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-gray-700/80 shadow-xl shadow-slate-900/10 dark:shadow-2xl dark:shadow-black/50 backdrop-blur-md transition-all duration-300 animate-fade-in-up">
                    <div className="flex items-center justify-between gap-3">
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
                                    {deviceType === "ios"
                                        ? "Додати на екран iPhone"
                                        : deviceType === "android"
                                        ? "Встановити додаток на Android"
                                        : "Швидкий доступ до цифрової перепустки"}
                                </div>
                            </div>
                        </div>

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
                                onClick={() => setShowFloatingBanner(false)}
                                className="w-7 h-7 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700/60 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                                title="Закрити"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Повноцінна розумна модалка встановлення (з визначенням пристрою та QR-кодом) */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 text-slate-900 dark:text-white rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-gray-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        {/* Заголовок */}
                        <div className="flex justify-between items-start pb-3.5 border-b border-slate-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-base shadow-sm">
                                    М
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                                        Мобільний додаток МНАУ
                                    </h3>
                                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                        {deviceType === "android" && "📱 Виявлено пристрій: Android"}
                                        {deviceType === "ios" && "🍏 Виявлено пристрій: Apple iPhone / iPad"}
                                        {deviceType === "desktop" && "💻 Виявлено: Комп'ютер / Ноутбук"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-gray-300 text-xs font-bold transition-colors flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Вміст залежно від типу пристрою */}
                        <div className="mt-4 space-y-4 text-xs">
                            {/* СЦЕНАРІЙ 1: ANDROID */}
                            {deviceType === "android" && (
                                <div className="space-y-3">
                                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200">
                                        <p className="font-semibold text-xs">
                                            Додаток встановлюється як нативний WebAPK з іконкою МНАУ на робочий стіл та зберігає вашу авторизацію.
                                        </p>
                                    </div>

                                    {deferredPrompt ? (
                                        <button
                                            type="button"
                                            onClick={handleInstallClick}
                                            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            <span>Встановити додаток в 1 клік</span>
                                        </button>
                                    ) : (
                                        <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300">
                                            <p className="font-bold text-gray-900 dark:text-white">Інструкція для браузера:</p>
                                            <p>1. Натисніть меню браузера (<strong>три крапки ⋮</strong> у верхньому або нижньому кутку).</p>
                                            <p>2. Виберіть <strong>«Встановити додаток»</strong> або <strong>«Додати на головний екран»</strong>.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* СЦЕНАРІЙ 2: iOS (IPHONE / IPAD) */}
                            {deviceType === "ios" && (
                                <div className="space-y-2.5 text-slate-700 dark:text-gray-200">
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                                        <span className="w-6 h-6 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                                            1
                                        </span>
                                        <span>
                                            Натисніть кнопку <strong>«Поділитися»</strong> (квадрат зі стрілкою <span className="inline-block px-1.5 py-0.5 bg-slate-200 dark:bg-white/20 rounded font-bold">⎋</span> внизу Safari).
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                                        <span className="w-6 h-6 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                                            2
                                        </span>
                                        <span>
                                            Прокрутіть меню та виберіть пункт <strong>«На екран "Додому"»</strong> (<span className="inline-block px-1.5 py-0.5 bg-slate-200 dark:bg-white/20 rounded font-bold">➕</span>).
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
                            )}

                            {/* СЦЕНАРІЙ 3: ДЕСКТОП (КОМП'ЮТЕР) */}
                            {deviceType === "desktop" && (
                                <div className="text-center space-y-3">
                                    <p className="text-xs text-slate-600 dark:text-gray-300">
                                        Відскануйте цей QR-код камерою свого смартфона (Android або iPhone), щоб відкрити сайт на телефоні та додати додаток:
                                    </p>

                                    {qrCodeDataUrl && (
                                        <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500/30 w-fit mx-auto shadow-md">
                                            <img
                                                src={qrCodeDataUrl}
                                                alt="QR-код для встановлення на телефон"
                                                className="w-40 h-40 object-contain block mx-auto"
                                            />
                                        </div>
                                    )}

                                    {deferredPrompt && (
                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={handleInstallClick}
                                                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-800 dark:text-gray-200 font-bold text-xs transition-all"
                                            >
                                                💻 Встановити як додаток на комп'ютер (Chrome / Edge)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Нижня кнопка закриття */}
                        <button
                            type="button"
                            onClick={() => {
                                setShowModal(false);
                                setIsAppInstalled(true);
                                localStorage.setItem(PWA_INSTALLED_KEY, "true");
                            }}
                            className="w-full mt-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
                        >
                            Зрозуміло
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
