import React, { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import IntroWaveAnimation from "@/Components/IntroWaveAnimation";
import ToastContainer from "@/Components/ToastContainer";
import LayoutHeader from "@/Components/LayoutHeader";
import LayoutFooter from "@/Components/LayoutFooter";

export default function AuthenticatedLayout({
    header,
    children,
    user: passedUser,
}) {
    const { props } = usePage();
    const user =
        passedUser ||
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

    const [toasts, setToasts] = useState([]);
    const [animating, setAnimating] = useState(true);
    const notifications = props.auth?.notifications || [];

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
                new CustomEvent("show-toast", { detail: { message } })
            );
        };

        return () => {
            window.removeEventListener("show-toast", handleToast);
        };
    }, []);

    const flash = props?.flash || {};
    const errors = props?.errors || {};

    // Initial mount flash check
    useEffect(() => {
        if (flash.success) {
            window.alert(flash.success);
        }
        if (flash.error) {
            window.alert(flash.error);
        }
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
            window.alert(errors[errorKeys[0]]);
        }
    }, []);

    // Subsequent Inertia page flash check
    useEffect(() => {
        const removeEventListener = router.on("success", (event) => {
            const pageFlash = event.detail.page.props.flash || {};
            if (pageFlash.success) {
                window.alert(pageFlash.success);
            }
            if (pageFlash.error) {
                window.alert(pageFlash.error);
            }
            const pageErrors = event.detail.page.props.errors || {};
            const errorKeys = Object.keys(pageErrors);
            if (errorKeys.length > 0) {
                window.alert(pageErrors[errorKeys[0]]);
            }
        });

        return () => {
            removeEventListener();
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col antialiased text-gray-950 dark:text-gray-100 selection:bg-emerald-100 dark:selection:bg-emerald-900/30 transition-colors duration-200">
            {/* Flash Message Toasts */}
            <ToastContainer toasts={toasts} setToasts={setToasts} />

            {/* Intro Canvas Wave Animation */}
            {animating && (
                <IntroWaveAnimation onClose={() => setAnimating(false)} />
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
