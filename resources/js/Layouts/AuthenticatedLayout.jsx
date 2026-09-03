import React, { useState, useEffect, useRef } from "react";
import { usePage, router } from "@inertiajs/react";
import IntroWaveAnimation from "@/Components/IntroWaveAnimation";
import ToastContainer from "@/Components/ToastContainer";
import LayoutHeader from "@/Components/LayoutHeader";
import LayoutFooter from "@/Components/LayoutFooter";
import PwaInstallPrompt from "@/Components/PwaInstallPrompt";
import { getEcho } from "@/echo";

// Внутрішній прапорець сесії модуля: ресетиться при перезавантаженні сторінки (F5),
// але зберігається при навігації в межах Inertia (SPA)
let hasSeenIntroInAppSession = false;

// Глобальний захист від дублювання тостів (діє між перемонтуваннями компонентів та паралельними викликами)
const recentToastsMap = new Map();
const DUPLICATE_PREVENTION_WINDOW_MS = 8000;

export default function AuthenticatedLayout({
    header,
    children,
    user: passedUser,
}) {
    const { props } = usePage();
    const user = passedUser ||
        props?.auth?.user || { name: "Гість", email: "guest@example.com" };

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("darkMode") === "true";
        }
        return false;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("darkMode", darkMode);
    }, [darkMode]);

    const flash = props?.flash || {};
    const errors = props?.errors || {};

    const [toasts, setToasts] = useState([]);
    
    // Анімація запускається лише 1 раз за сесію сторінки
    const [animating, setAnimating] = useState(() => {
        if (typeof window !== "undefined") {
            const alreadySeen = sessionStorage.getItem("hasSeenIntroApp");
            if (!alreadySeen) {
                sessionStorage.setItem("hasSeenIntroApp", "true");
                return true;
            }
            return false;
        }
        return false;
    });
    const notifications = props.auth?.notifications || [];

    // Захист мобільної історії: запобігає вильоту на сторінку логіну при натисканні «Назад» на телефоні
    useEffect(() => {
        if (typeof window === "undefined" || !window.history) return;

        try {
            window.history.replaceState({ appHostel: true, root: true }, "", window.location.href);
        } catch (e) {}

        const handlePopState = (event) => {
            // Якщо користувач на головній сторінці кабінету натискає «Назад» на телефоні,
            // утримуємо його в застосунку, щоб не було вильоту на екран авторизації
            if (!event.state || event.state?.root) {
                try {
                    window.history.pushState({ appHostel: true, active: true }, "", window.location.href);
                } catch (e) {}
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    const handleCloseIntroAnimation = React.useCallback(() => {
        setAnimating(false);
    }, []);

    const isDuplicateToast = (message) => {
        if (!message || typeof message !== "string") return true;
        const cleanMsg = message.trim();
        const now = Date.now();
        const lastSeen = recentToastsMap.get(cleanMsg);
        if (lastSeen && now - lastSeen < DUPLICATE_PREVENTION_WINDOW_MS) {
            return true;
        }
        recentToastsMap.set(cleanMsg, now);

        // Очищення записів, старіших за 30 секунд
        for (const [msg, timestamp] of recentToastsMap.entries()) {
            if (now - timestamp > 30000) {
                recentToastsMap.delete(msg);
            }
        }
        return false;
    };

    const calculateToastDuration = (msg, type) => {
        if (!msg || typeof msg !== "string") return 6500;
        const cleanMsg = msg.trim();
        const length = cleanMsg.length;

        // Базовий час для коротких повідомлень — мінімум 6.5 секунд
        let duration = 6500;

        // Для довгих текстів додаємо по 85мс на символ понад 25 символів
        if (length > 25) {
            duration += (length - 25) * 85;
        }

        // Для попереджень та системних помилок даємо ще +2.5 секунди на комфортне читання
        const isWarningOrError =
            type === "warning" ||
            type === "error" ||
            /помилка|не вдалося|error|не визначити|заборонено|немає прав|увага|попередження|warning|не налаштовано|налаштуйте/i.test(
                cleanMsg
            );

        if (isWarningOrError) {
            duration += 2500;
        }

        // Обмежуємо комфортним діапазоном: від 6.5с до 16с
        return Math.min(16000, Math.max(6500, Math.round(duration)));
    };

    const showToastOnce = (msg, customDuration, type) => {
        if (!msg || typeof msg !== "string") return;
        const cleanMsg = msg.trim();
        if (isDuplicateToast(cleanMsg)) {
            return;
        }

        const duration =
            customDuration || calculateToastDuration(cleanMsg, type);

        window.dispatchEvent(
            new CustomEvent("show-toast", {
                detail: { message: cleanMsg, duration, type },
            })
        );
    };

    // Global Toast listener & window.alert override
    useEffect(() => {
        const handleToast = (e) => {
            const message = e.detail?.message;
            if (!message || typeof message !== "string") return;
            const cleanMsg = message.trim();

            // Динамічний комфортний час читання
            const duration = Math.max(
                e.detail.duration || 0,
                calculateToastDuration(cleanMsg, e.detail.type)
            );
            const type = e.detail.type;

            setToasts((prev) => {
                // Захист від дублювання: якщо тост з таким самим текстом вже висить на екрані — не додаємо другий
                if (prev.some((t) => t.message.trim() === cleanMsg)) {
                    return prev;
                }
                const newToast = {
                    id: Date.now() + Math.random(),
                    message: cleanMsg,
                    duration,
                    type,
                };
                return [...prev, newToast];
            });
        };
        window.addEventListener("show-toast", handleToast);

        window.alert = (message) => {
            window.dispatchEvent(
                new CustomEvent("show-toast", { detail: { message } }),
            );
        };

        return () => {
            window.removeEventListener("show-toast", handleToast);
        };
    }, []);

    // Initial mount flash check
    useEffect(() => {
        if (flash.success) {
            showToastOnce(flash.success, undefined, "success");
        }
        if (flash.warning) {
            showToastOnce(flash.warning, undefined, "warning");
        }
        if (flash.error) {
            showToastOnce(flash.error, undefined, "error");
        }
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
            showToastOnce(errors[errorKeys[0]], undefined, "error");
        }
    }, []);

    // Subsequent Inertia page flash check (ігнорує фонові GET reload запити)
    useEffect(() => {
        const removeSuccessListener = router.on("success", (event) => {
            // Якщо це фоновий GET-запит (background reload), не показуємо застарілі флеш-повідомлення
            if (
                event.detail.visit?.method === "get" &&
                event.detail.visit?.only &&
                event.detail.visit?.only.length > 0
            ) {
                return;
            }

            const pageFlash = event.detail.page.props.flash || {};
            if (pageFlash.success) {
                showToastOnce(pageFlash.success, undefined, "success");
            }
            if (pageFlash.warning) {
                showToastOnce(pageFlash.warning, undefined, "warning");
            }
            if (pageFlash.error) {
                showToastOnce(pageFlash.error, undefined, "error");
            }
            const pageErrors = event.detail.page.props.errors || {};
            const errorKeys = Object.keys(pageErrors);
            if (errorKeys.length > 0) {
                showToastOnce(pageErrors[errorKeys[0]], undefined, "error");
            }
        });

        return () => {
            removeSuccessListener();
        };
    }, []);

    // Слухаємо персональні сповіщення в реальному часі (WebSockets)
    useEffect(() => {
        if (!user?.id) return;
        const echo = getEcho();
        if (!echo) return;

        const userChannel = echo.channel(`user.${user.id}`);
        userChannel.listen(".NotificationCreated", (e) => {
            const msg = e.notification?.message || e.message || "Нове сповіщення";
            window.dispatchEvent(
                new CustomEvent("show-toast", { detail: { message: msg, duration: 4000 } })
            );
            router.reload({
                only: ["auth"],
                preserveScroll: true,
                preserveState: true,
            });
        });

        return () => {
            echo.leaveChannel(`user.${user.id}`);
        };
    }, [user?.id]);

    return (
        <div className="min-h-screen flex flex-col antialiased bg-slate-50 dark:bg-gray-900 text-gray-950 dark:text-gray-100 selection:bg-emerald-100 dark:selection:bg-emerald-900/30 transition-colors duration-200 relative">
            {/* Легкий витончений фоновий патерн та м'яке ембієнт-освітлення */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0" aria-hidden="true">
                {/* Делікатна мікро-сітка точок */}
                <div className="absolute inset-0 bg-dot-pattern opacity-40 dark:opacity-20" />

                {/* М'які пастельні світлові плями (ambient lighting) */}
                <div className="absolute -top-40 -right-32 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-emerald-400/12 via-teal-300/8 to-transparent blur-[120px] dark:from-emerald-500/10 dark:via-teal-600/5 animate-ambient-slow" />
                <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-teal-400/9 via-cyan-300/6 to-transparent blur-[110px] dark:from-teal-500/8 dark:via-cyan-600/5 animate-ambient-reverse" />
                <div className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-emerald-300/8 via-green-200/5 to-transparent blur-[130px] dark:from-emerald-600/5 dark:via-slate-800/10" />
            </div>

            {/* Flash Message Toasts */}
            <ToastContainer toasts={toasts} setToasts={setToasts} />

            {/* Intro Canvas Wave Animation */}
            {animating && (
                <IntroWaveAnimation onClose={handleCloseIntroAnimation} />
            )}

            {/* Impersonation Banner */}
            {props.auth?.impersonator && (
                <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 text-white px-4 py-2.5 text-xs shadow-lg sticky top-0 z-50 flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-purple-500/30">
                    <div className="flex items-center gap-2.5 text-center sm:text-left">
                        <span className="flex h-2.5 w-2.5 relative shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300"></span>
                        </span>
                        <span>
                            <strong>Режим перегляду:</strong> Ви увійшли під акаунтом <span className="text-amber-300 font-bold underline">{user.name}</span> ({user.role === 'commandant' ? 'Комендант' : user.role === 'admin' ? 'Адміністратор' : 'Студент'}). Початковий акаунт: <strong>{props.auth.impersonator.name}</strong>
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.post(route('impersonate.leave'))}
                        className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 active:scale-95 text-white font-bold rounded-xl transition-all border border-white/30 shadow-xs flex items-center gap-1.5 shrink-0"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Повернутися до мого акаунту</span>
                    </button>
                </div>
            )}

            {/* Header & Subheader */}
            <LayoutHeader
                user={user}
                notifications={notifications}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                showingNavigationDropdown={showingNavigationDropdown}
                setShowingNavigationDropdown={setShowingNavigationDropdown}
                animating={animating}
                header={header}
            />

            {/* Main Content */}
            <main className="flex-grow animate-fade-in relative z-10">
                {children}
            </main>

            {/* Кнопка та банер встановлення PWA додатка */}
            <PwaInstallPrompt />

            {/* Footer */}
            <LayoutFooter />
        </div>
    );
}
