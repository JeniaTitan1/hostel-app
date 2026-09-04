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
        if (typeof window !== "undefined") {
            window.dispatchEvent(
                new CustomEvent("app-theme-change", { detail: { darkMode } })
            );
        }
    }, [darkMode]);

    // Синхронізація зміни теми з модальними вікнами (КПП-сканер тощо)
    useEffect(() => {
        const handleThemeChange = (e) => {
            if (typeof e?.detail?.darkMode === "boolean") {
                setDarkMode(e.detail.darkMode);
            } else if (typeof window !== "undefined") {
                setDarkMode(
                    document.documentElement.classList.contains("dark") ||
                    localStorage.getItem("darkMode") === "true"
                );
            }
        };

        window.addEventListener("app-theme-change", handleThemeChange);
        window.addEventListener("storage", handleThemeChange);
        return () => {
            window.removeEventListener("app-theme-change", handleThemeChange);
            window.removeEventListener("storage", handleThemeChange);
        };
    }, []);

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

// Глобальний набір уже показаних флеш-повідомлень (запобігає повторному показу при фонових оновленнях)
const consumedFlashSet = new Set();

    const showToastOnce = (msg, customDuration, type) => {
        if (!msg || typeof msg !== "string") return;
        const cleanMsg = msg.trim();
        if (consumedFlashSet.has(cleanMsg) || isDuplicateToast(cleanMsg)) {
            return;
        }

        consumedFlashSet.add(cleanMsg);

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
        if (flash.success && !consumedFlashSet.has(flash.success.trim())) {
            showToastOnce(flash.success, undefined, "success");
        }
        if (flash.warning && !consumedFlashSet.has(flash.warning.trim())) {
            showToastOnce(flash.warning, undefined, "warning");
        }
        if (flash.error && !consumedFlashSet.has(flash.error.trim())) {
            showToastOnce(flash.error, undefined, "error");
        }
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0 && errors[errorKeys[0]]) {
            showToastOnce(errors[errorKeys[0]], undefined, "error");
        }
    }, []);

    // Subsequent Inertia page flash check (повністю ігнорує фонові GET reload запити)
    useEffect(() => {
        const removeSuccessListener = router.on("success", (event) => {
            const method = (event.detail.visit?.method || "").toLowerCase();
            const isPartialReload = Boolean(
                event.detail.visit?.only && event.detail.visit.only.length > 0
            );

            // Якщо це фоновий GET-запит або часткове оновлення (background polling), не повторюємо флеш-повідомлення
            if (method === "get" || isPartialReload) {
                return;
            }

            const pageFlash = event.detail.page?.props?.flash || {};
            if (pageFlash.success && !consumedFlashSet.has(pageFlash.success.trim())) {
                showToastOnce(pageFlash.success, undefined, "success");
            }
            if (pageFlash.warning && !consumedFlashSet.has(pageFlash.warning.trim())) {
                showToastOnce(pageFlash.warning, undefined, "warning");
            }
            if (pageFlash.error && !consumedFlashSet.has(pageFlash.error.trim())) {
                showToastOnce(pageFlash.error, undefined, "error");
            }
            const pageErrors = event.detail.page?.props?.errors || {};
            const errorKeys = Object.keys(pageErrors);
            if (errorKeys.length > 0 && pageErrors[errorKeys[0]]) {
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
        <div className="min-h-screen flex flex-col antialiased bg-slate-50/90 dark:bg-[#070e1b] text-gray-950 dark:text-gray-100 selection:bg-emerald-100 dark:selection:bg-emerald-900/30 transition-colors duration-200 relative">
            {/* Органічний живий фон «Liquid Lava Waves & Aurora Mesh» для всього сайту */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0" aria-hidden="true">
                {/* Делікатна мікро-сітка точок для створення глибини */}
                <div className="absolute inset-0 bg-dot-pattern opacity-45 dark:opacity-25" />

                {/* 1. Верхня ліва смарагдово-м'ятна лавова хвиля */}
                <div className="absolute -top-28 -left-28 w-[620px] h-[620px] rounded-full bg-gradient-to-br from-emerald-400/30 via-teal-400/20 to-transparent dark:from-emerald-500/25 dark:via-teal-600/15 blur-[85px] animate-lava-1" />

                {/* 2. Верхня права ціаново-смарагдова хвиля */}
                <div className="absolute -top-16 -right-28 w-[580px] h-[580px] rounded-full bg-gradient-to-bl from-cyan-400/28 via-emerald-400/20 to-transparent dark:from-cyan-500/20 dark:via-teal-500/15 blur-[95px] animate-lava-2" />

                {/* 3. Центрально-ліва жива морська хвиля */}
                <div className="absolute top-1/3 -left-20 w-[540px] h-[540px] rounded-full bg-gradient-to-tr from-teal-400/25 via-emerald-500/18 to-transparent dark:from-teal-600/20 dark:via-emerald-700/12 blur-[90px] animate-lava-3" />

                {/* 4. Нижня права лавова хвиля */}
                <div className="absolute -bottom-28 -right-20 w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-emerald-400/28 via-teal-300/18 to-transparent dark:from-emerald-600/22 dark:via-cyan-900/15 blur-[105px] animate-lava-4" />

                {/* 5. Нижня ліва плаваюча лавова крапля */}
                <div className="absolute -bottom-36 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-cyan-300/22 via-emerald-400/18 to-transparent dark:from-teal-500/18 dark:via-slate-800/15 blur-[95px] animate-lava-1" />
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
