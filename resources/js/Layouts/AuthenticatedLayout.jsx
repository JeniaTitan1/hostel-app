import React, { useState, useEffect, useRef } from "react";
import { usePage, router } from "@inertiajs/react";
import IntroWaveAnimation from "@/Components/IntroWaveAnimation";
import ToastContainer from "@/Components/ToastContainer";
import LayoutHeader from "@/Components/LayoutHeader";
import LayoutFooter from "@/Components/LayoutFooter";

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
    
    // Анімація запускається при первинному вході та ручному перезавантаженні (F5),
    // але не повторюється при переході по внутрішніх посиланнях Inertia
    const [animating, setAnimating] = useState(() => {
        if (!hasSeenIntroInAppSession) {
            hasSeenIntroInAppSession = true;
            return true;
        }
        return false;
    });
    const notifications = props.auth?.notifications || [];

    const handleCloseIntroAnimation = () => {
        setAnimating(false);
    };

    // Захист від дублювання тостів
    const lastShownToastRef = useRef({ message: "", time: 0 });
    const showToastOnce = (msg) => {
        if (!msg) return;
        const now = Date.now();
        if (
            lastShownToastRef.current.message === msg &&
            now - lastShownToastRef.current.time < 1500
        ) {
            return;
        }
        lastShownToastRef.current = { message: msg, time: now };
        window.alert(msg);
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

    // Subsequent Inertia page flash check
    useEffect(() => {
        const removeEventListener = router.on("success", (event) => {
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
            removeEventListener();
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col antialiased bg-slate-50 dark:bg-gray-900 text-gray-950 dark:text-gray-100 selection:bg-emerald-100 dark:selection:bg-emerald-900/30 transition-colors duration-200">
            {/* Flash Message Toasts */}
            <ToastContainer toasts={toasts} setToasts={setToasts} />

            {/* Intro Canvas Wave Animation */}
            {animating && (
                <IntroWaveAnimation onClose={handleCloseIntroAnimation} />
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
