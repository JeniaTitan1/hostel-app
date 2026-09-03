import React, { useState, useEffect, useRef } from "react";
import { usePage, router } from "@inertiajs/react";
import IntroWaveAnimation from "@/Components/IntroWaveAnimation";
import ToastContainer from "@/Components/ToastContainer";
import LayoutHeader from "@/Components/LayoutHeader";
import LayoutFooter from "@/Components/LayoutFooter";
import { getEcho } from "@/echo";

// Внутрішній прапорець сесії модуля: ресетиться при перезавантаженні сторінки (F5),
// але зберігається при навігації в межах Inertia (SPA)
let hasSeenIntroInAppSession = false;

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

    const handleCloseIntroAnimation = React.useCallback(() => {
        setAnimating(false);
    }, []);

    // Захист від дублювання тостів
    const seenFlashMessagesRef = useRef(new Set());
    const showToastOnce = (msg) => {
        if (!msg || typeof msg !== "string") return;
        if (seenFlashMessagesRef.current.has(msg)) {
            return;
        }
        seenFlashMessagesRef.current.add(msg);
        
        window.dispatchEvent(
            new CustomEvent("show-toast", { detail: { message: msg, duration: 3500 } }),
        );
    };

    // Global Toast listener & window.alert override
    useEffect(() => {
        const handleToast = (e) => {
            const id = Date.now() + Math.random();
            const newToast = {
                id,
                message: e.detail.message,
                duration: e.detail.duration || 3000,
            };
            setToasts((prev) => [...prev, newToast]);
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
            showToastOnce(flash.success);
        }
        if (flash.error) {
            showToastOnce(flash.error);
        }
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
            showToastOnce(errors[errorKeys[0]]);
        }
    }, []);

    // Subsequent Inertia page flash check (ігнорує фонові GET reload запити)
    useEffect(() => {
        const removeBeforeListener = router.on("before", (event) => {
            // При новому POST/PATCH/DELETE запиті очищаємо історію показаних повідомлень
            if (event.detail.visit.method !== "get") {
                seenFlashMessagesRef.current.clear();
            }
        });

        const removeSuccessListener = router.on("success", (event) => {
            // Якщо це фоновий GET-запит (background reload), не показуємо застарілі флеш-повідомлення
            if (event.detail.visit?.method === "get" && event.detail.visit?.only && event.detail.visit?.only.length > 0) {
                return;
            }

            const pageFlash = event.detail.page.props.flash || {};
            if (pageFlash.success) {
                showToastOnce(pageFlash.success);
            }
            if (pageFlash.error) {
                showToastOnce(pageFlash.error);
            }
            const pageErrors = event.detail.page.props.errors || {};
            const errorKeys = Object.keys(pageErrors);
            if (errorKeys.length > 0) {
                showToastOnce(pageErrors[errorKeys[0]]);
            }
        });

        return () => {
            removeBeforeListener();
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
        <div className="min-h-screen flex flex-col antialiased bg-slate-50 dark:bg-gray-900 text-gray-950 dark:text-gray-100 selection:bg-emerald-100 dark:selection:bg-emerald-900/30 transition-colors duration-200">
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
                            👁️ <strong>Режим перегляду:</strong> Ви увійшли під акаунтом <span className="text-amber-300 font-bold underline">{user.name}</span> ({user.role === 'commandant' ? 'Комендант' : user.role === 'admin' ? 'Адміністратор' : 'Студент'}). Початковий акаунт: <strong>{props.auth.impersonator.name}</strong>
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

            {/* Footer */}
            <LayoutFooter />
        </div>
    );
}
