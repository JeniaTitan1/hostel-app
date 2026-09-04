import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Html5Qrcode } from "html5-qrcode";

/**
 * Синтез звукового сигналу через Web Audio API (працює без зовнішніх аудіофайлів)
 */
function playBeep(type = "success") {
    if (typeof window === "undefined") return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "success") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.25);
        } else {
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.setValueAtTime(160, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
        }
    } catch (e) {
        console.warn("Audio Context beep error:", e);
    }
}

export default function QrAccessScannerModal({ isOpen, onClose, onScanSuccess }) {
    const [mode, setMode] = useState("auto"); // 'auto' | 'entry' | 'exit'
    const [manualCode, setManualCode] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [updatingDirection, setUpdatingDirection] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [activeTab, setActiveTab] = useState("camera"); // 'camera' | 'manual'
    const [notes, setNotes] = useState("");
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== "undefined") {
            return (
                document.documentElement.classList.contains("dark") ||
                localStorage.getItem("darkMode") === "true"
            );
        }
        return false;
    });

    const html5QrCodeRef = useRef(null);
    const lastScannedCodeRef = useRef(null);
    const lastScanTimeRef = useRef(0);

    // Синхронізація теми з сайтом
    useEffect(() => {
        const syncTheme = (e) => {
            if (typeof e?.detail?.darkMode === "boolean") {
                setIsDark(e?.detail?.darkMode);
            } else if (typeof window !== "undefined") {
                setIsDark(
                    document.documentElement.classList.contains("dark") ||
                    localStorage.getItem("darkMode") === "true"
                );
            }
        };

        window.addEventListener("app-theme-change", syncTheme);
        window.addEventListener("storage", syncTheme);
        const observer = new MutationObserver(() => syncTheme());
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => {
            window.removeEventListener("app-theme-change", syncTheme);
            window.removeEventListener("storage", syncTheme);
            observer.disconnect();
        };
    }, []);

    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("darkMode", next.toString());
        if (typeof window !== "undefined") {
            window.dispatchEvent(
                new CustomEvent("app-theme-change", { detail: { darkMode: next } })
            );
        }
    };

    // Блокування скролу сторінки (body) при відкритому повноекранному КПП
    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    // Інтуїтивна навігація на мобільних: закриття по кнопці «Назад» на телефоні
    useEffect(() => {
        if (!isOpen || typeof window === "undefined") return;

        try {
            window.history.pushState({ qrScannerOpen: true }, "");
        } catch (e) {}

        const handlePopState = () => {
            onClose();
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [isOpen]);

    // Гарячі клавіші для ПК (Esc - закрити, Пробіл - наступний, 1/2/3 - напрямки)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.code === "Space" && lastResult && activeTab === "camera") {
                e.preventDefault();
                handleContinueScan();
            } else if (e.key === "1" && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== "INPUT") {
                setMode("auto");
            } else if (e.key === "2" && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== "INPUT") {
                setMode("entry");
            } else if (e.key === "3" && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== "INPUT") {
                setMode("exit");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, lastResult, activeTab]);

    // Ініціалізація та зупинка камери при відкритті/закритті
    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            setLastResult(null);
            setManualCode("");
            setNotes("");
            return;
        }

        if (activeTab === "camera") {
            startCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen, activeTab]);

    const startCamera = async () => {
        setCameraError(null);
        setIsScanning(true);

        try {
            if (html5QrCodeRef.current) {
                try {
                    await html5QrCodeRef.current.stop();
                } catch (e) {}
            }

            const html5QrCode = new Html5Qrcode("access-qr-reader");
            html5QrCodeRef.current = html5QrCode;

            const config = {
                fps: 20,
                qrbox: { width: 280, height: 280 },
                aspectRatio: 1.0,
            };

            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                onQrDecoded,
                () => {}
            );
        } catch (err) {
            console.error("Camera start error:", err);
            setIsScanning(false);
            setCameraError(
                "Не вдалося отримати доступ до камери. Перевірте дозволи або використовуйте ручне введення коду."
            );
        }
    };

    const stopCamera = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
                html5QrCodeRef.current.clear();
            } catch (err) {
                console.error("Error stopping camera:", err);
            }
            html5QrCodeRef.current = null;
        }
        setIsScanning(false);
    };

    const onQrDecoded = (decodedText) => {
        const now = Date.now();
        if (
            lastScannedCodeRef.current === decodedText &&
            now - lastScanTimeRef.current < 4000
        ) {
            return;
        }

        lastScannedCodeRef.current = decodedText;
        lastScanTimeRef.current = now;

        handleSendCode(decodedText);
    };

    const handleSendCode = async (codeToSend) => {
        if (!codeToSend || processing) return;
        setProcessing(true);
        setCameraError(null);

        try {
            if (typeof window !== "undefined" && window.navigator?.vibrate) {
                window.navigator.vibrate(20);
            }

            const res = await fetch(route("admin.access-logs.scan"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    code: codeToSend,
                    forced_type: mode,
                    notes: notes.trim() || null,
                }),
            });

            const data = await res.json();

            if (data.valid) {
                playBeep("success");
            } else {
                playBeep("error");
            }

            setLastResult(data);
            setManualCode("");
            setNotes("");

            if (onScanSuccess) {
                onScanSuccess(data);
            }
        } catch (err) {
            console.error("Scan error:", err);
            playBeep("error");
            setLastResult({
                valid: false,
                status: "error",
                message: "Помилка зв'язку із сервером перевірки.",
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualCode.trim()) return;
        handleSendCode(manualCode.trim());
    };

    const handleContinueScan = () => {
        setLastResult(null);
        setManualCode("");
        setNotes("");
        lastScannedCodeRef.current = null;
        lastScanTimeRef.current = 0;
        if (activeTab === "camera" && !isScanning) {
            startCamera();
        }
    };

    const handleToggleDirection = async (newType) => {
        if (!lastResult?.log?.id || updatingDirection) return;
        setUpdatingDirection(true);

        try {
            const res = await fetch(
                route("admin.access-logs.update-direction", lastResult.log.id),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN":
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute("content") || "",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ type: newType }),
                }
            );

            const data = await res.json();

            if (data.success) {
                setLastResult((prev) => ({
                    ...prev,
                    type: newType,
                    direction_name: newType === "entry" ? "ВХІД" : "ВИХІД",
                    log: {
                        ...prev.log,
                        type: newType,
                    },
                }));

                if (onScanSuccess) {
                    onScanSuccess({
                        ...lastResult,
                        type: newType,
                        direction_name: newType === "entry" ? "ВХІД" : "ВИХІД",
                        log: { ...lastResult.log, type: newType },
                    });
                }
            }
        } catch (e) {
            console.error("Toggle direction error:", e);
        } finally {
            setUpdatingDirection(false);
        }
    };

    if (!isOpen || typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[999999] w-screen h-[100dvh] max-h-[100dvh] bg-slate-100/90 dark:bg-[#070e1b]/95 text-slate-900 dark:text-white flex flex-col overflow-hidden select-none animate-in fade-in duration-200 transition-colors duration-200 relative">
            {/* Живий фон «Lava Waves & Aurora Mesh» для КПП */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0" aria-hidden="true">
                <div className="absolute inset-0 bg-dot-pattern opacity-35 dark:opacity-20" />
                <div className="absolute -top-32 -left-28 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-emerald-500/25 via-teal-400/20 to-transparent blur-[90px] dark:from-emerald-500/20 dark:via-teal-600/15 animate-lava-1" />
                <div className="absolute top-1/4 -right-28 w-[520px] h-[520px] rounded-full bg-gradient-to-bl from-cyan-400/25 via-emerald-400/20 to-transparent blur-[100px] dark:from-cyan-500/15 dark:via-teal-500/15 animate-lava-2" />
                <div className="absolute -bottom-32 left-1/3 w-[580px] h-[580px] rounded-full bg-gradient-to-tr from-teal-400/25 via-emerald-500/20 to-transparent blur-[110px] dark:from-teal-600/15 dark:via-slate-800/20 animate-lava-3" />
            </div>

            {/* ВЕРХНЯ ПАНЕЛЬ УПРАВЛІННЯ КПП (WORKSTATION TOP BAR - 100% ШИРИНИ) */}
            <header className="kpp-header w-full h-11 sm:h-14 lg:h-16 px-2.5 sm:px-4 lg:px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-1.5 sm:gap-4 shrink-0 shadow-xs dark:shadow-lg transition-colors duration-200 relative z-10">
                {/* Ліва частина: Логотип та назва пункту */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex sm:hidden w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 items-center justify-center transition-all active:scale-95 cursor-pointer"
                        title="Назад"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                    </div>

                    <div className="hidden sm:block">
                        <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">
                            Пропускний пункт
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Робоче місце оператора вахти • Сканування цифрових перепусток
                        </p>
                    </div>
                </div>

                {/* Центр: Перемикачі режимів напрямку та введення */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Напрямок */}
                    <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-slate-200/70 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl sm:rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setMode("auto")}
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                mode === "auto"
                                    ? "bg-emerald-600 text-white shadow-xs font-black"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                            title="Клавіша [1] на клавіатурі"
                        >
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="hidden sm:inline">Авто</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("entry")}
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                mode === "entry"
                                    ? "bg-emerald-600 text-white shadow-xs font-black"
                                    : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                            }`}
                            title="Клавіша [2] на клавіатурі"
                        >
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            <span>Вхід</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("exit")}
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                mode === "exit"
                                    ? "bg-amber-600 text-white shadow-xs font-black"
                                    : "text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                            }`}
                            title="Клавіша [3] на клавіатурі"
                        >
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Вихід</span>
                        </button>
                    </div>

                    {/* Камера / Ручний (на ПК) */}
                    <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("camera");
                                handleContinueScan();
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === "camera"
                                    ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-black"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Камера</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("manual")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === "manual"
                                    ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-black"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Код / Email</span>
                        </button>
                    </div>
                </div>

                {/* Права частина: Тема, Годинник та Кнопка виходу */}
                <div className="flex items-center gap-1.5 sm:gap-3">
                    {/* Кнопка перемикання теми (Світла / Темна) */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                        title={isDark ? "Перемкнути на світлу тему" : "Перемкнути на темну тему"}
                    >
                        {isDark ? (
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 dark:hover:bg-rose-500/25 border border-rose-500/30 hover:border-rose-500/50 text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 text-xs font-black transition-all flex items-center gap-1 sm:gap-2 active:scale-95 cursor-pointer shadow-xs"
                        title="Закрити режим КПП (Esc)"
                    >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="hidden sm:inline">Вийти з КПП</span>
                    </button>
                </div>
            </header>

            {/* ОСНОВНА ЧАСТИНА: 2-КОЛОНКОВИЙ FULL-SCREEN РОБОЧИЙ ПРОСТІР НА ВЕСЬ ЕКРАН */}
            <main className="kpp-workspace flex-1 min-h-0 w-full p-2 sm:p-4 lg:p-6 flex flex-col lg:flex-row gap-2.5 sm:gap-4 lg:gap-6 items-stretch justify-start lg:justify-center overflow-y-auto lg:overflow-hidden pb-4 sm:pb-6 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative z-10">
                {/* ЛІВА КОЛОНКА (НА ПК) / ВЕРХНІЙ БЛОК (НА ТЕЛЕФОНІ): ВІДЕОПОТІК КАМЕРИ / РУЧНИЙ ВВІД */}
                <div
                    className={`kpp-camera-panel w-full lg:w-1/2 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl shadow-lg dark:shadow-2xl relative min-h-0 shrink-0 lg:shrink overflow-hidden transition-all duration-200 ${
                        lastResult
                            ? "p-2 sm:p-4 lg:p-6"
                            : "p-3 sm:p-5 lg:p-6"
                    }`}
                >
                    {/* Перемикач вкладок для мобільних екранів */}
                    <div className="flex sm:hidden items-center gap-1 mb-1.5 p-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl w-full shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("camera");
                                handleContinueScan();
                            }}
                            className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 ${
                                activeTab === "camera"
                                    ? "bg-emerald-600 text-white font-black"
                                    : "text-slate-600 dark:text-slate-400"
                            }`}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Камера</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("manual")}
                            className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 ${
                                activeTab === "manual"
                                    ? "bg-emerald-600 text-white font-black"
                                    : "text-slate-600 dark:text-slate-400"
                            }`}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Код / Email</span>
                        </button>
                    </div>

                    {activeTab === "camera" && (
                        <div className="w-full flex flex-col items-center justify-center flex-1 min-h-0 max-w-lg">
                            <div
                                className={`kpp-camera-box relative bg-black rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.25)] flex items-center justify-center shrink-0 transition-all duration-200 ${
                                    lastResult
                                        ? "w-full max-w-[200px] sm:max-w-[340px] lg:max-w-[440px] h-20 sm:h-auto aspect-[16/9] sm:aspect-square"
                                        : "w-full max-w-[260px] sm:max-w-[380px] lg:max-w-[440px] aspect-square"
                                }`}
                            >
                                <div id="access-qr-reader" className="w-full h-full" />

                                {processing && (
                                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-20">
                                        <div className="w-8 h-8 sm:w-12 sm:h-12 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-[11px] sm:text-sm font-black tracking-wide text-emerald-400">
                                            Перевірка перепустки...
                                        </span>
                                    </div>
                                )}
                            </div>

                            {cameraError ? (
                                <div className="mt-2 p-2 sm:p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs text-center w-full max-w-[440px]">
                                    <p className="font-semibold">{cameraError}</p>
                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        className="mt-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                                    >
                                        Спробувати знову
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-1.5 sm:mt-3 flex items-center justify-between w-full max-w-[440px] px-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 shrink-0">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                                        Сканер активний
                                    </span>
                                    <span className="opacity-75">
                                        Наведіть на QR
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "manual" && (
                        <div className="w-full max-w-md flex flex-col justify-center my-auto py-2 sm:py-4">
                            <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white mb-1">
                                Ручний пошук перепустки
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                                Якщо студент не має з собою смартфона або QR-код пошкоджено
                            </p>

                            <form onSubmit={handleManualSubmit} className="space-y-2.5 sm:space-y-4">
                                <div>
                                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Номер ордера або Email:
                                    </label>
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        placeholder="ORD-2026-XXXX або пошта..."
                                        className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        Службова примітка вахтера:
                                    </label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Запізнення, валіза..."
                                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || !manualCode.trim()}
                                    className="w-full py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <span>{processing ? "Перевірка..." : "Перевірити та зафіксувати"}</span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* ПРАВА КОЛОНКА (НА ПК) / НИЖНІЙ БЛОК (НА ТЕЛЕФОНІ): РЕЗУЛЬТАТ СКАНУВАННЯ / КАРТКА СТУДЕНТА */}
                <div className="kpp-details-panel w-full lg:w-1/2 flex flex-col justify-center bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-3 sm:p-6 lg:p-8 shadow-lg dark:shadow-2xl relative min-h-0 shrink-0 lg:shrink overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-colors duration-200">
                    {lastResult ? (
                        <div className="w-full space-y-3 sm:space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Статусний бейдж пропуску */}
                            <div
                                className={`p-3 sm:p-4.5 rounded-2xl sm:rounded-3xl border-2 flex items-center gap-3.5 sm:gap-4.5 ${
                                    lastResult.valid
                                        ? lastResult.type === "entry"
                                            ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-500/80 text-emerald-950 dark:text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                                            : "bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-500/80 text-amber-950 dark:text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                                        : "bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-500/80 text-rose-950 dark:text-rose-100 shadow-[0_0_30px_rgba(244,63,94,0.2)]"
                                }`}
                            >
                                <div
                                    className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                                        lastResult.valid
                                            ? lastResult.type === "entry"
                                                ? "bg-emerald-600 text-white shadow-emerald-600/40"
                                                : "bg-amber-600 text-white shadow-amber-600/40"
                                            : "bg-rose-600 text-white shadow-rose-600/40"
                                    }`}
                                >
                                    {lastResult.valid ? (
                                        lastResult.type === "entry" ? (
                                            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                        ) : (
                                            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                        )
                                    ) : (
                                        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider block opacity-75">
                                        Результат верифікації
                                    </span>
                                    <h3 className="text-sm sm:text-xl font-black truncate">
                                        {lastResult.valid
                                            ? lastResult.type === "entry"
                                                ? "ВХІД ДОЗВОЛЕНО"
                                                : "ВИХІД ДОЗВОЛЕНО"
                                            : "ДОСТУП ЗАБОРОНЕНО"}
                                    </h3>
                                    {lastResult.message && (
                                        <p className="text-[11px] sm:text-xs opacity-80 mt-0.5 truncate">{lastResult.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Персональні дані студента */}
                            {lastResult.student ? (
                                <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3 sm:space-y-4">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white text-base sm:text-xl font-black shadow-inner shrink-0">
                                            {lastResult.student.name?.charAt(0).toUpperCase() || "С"}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                                                {lastResult.student.name}
                                            </h4>
                                            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                                                {lastResult.student.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2.5 sm:pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                                        <div>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">Спеціальність / Курс:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {lastResult.student.specialty || "Студент"}{" "}
                                                {lastResult.student.course ? `(${lastResult.student.course} курс)` : ""}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">Академічна група:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {lastResult.student.group || "Не вказано"}
                                            </span>
                                        </div>

                                        {lastResult.room && (
                                            <div className="col-span-2 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60">
                                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-bold">Місце проживання:</span>
                                                <span className="font-black text-emerald-950 dark:text-white text-xs sm:text-sm">
                                                    Кімната {lastResult.room.room_number} (Поверх {lastResult.room.floor}) • {lastResult.room.building?.name}
                                                </span>
                                            </div>
                                        )}

                                        {lastResult.order_number && (
                                            <div className="col-span-2 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                                Ордер: {lastResult.order_number}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            {/* Блок швидкої зміни напрямку запису */}
                            {lastResult.valid && lastResult.log && (
                                <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                            Помилковий напрямок запису?
                                        </span>
                                        <span className="text-[10px] sm:text-[11px] text-slate-400">
                                            (змінити дію)
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                        <button
                                            type="button"
                                            disabled={updatingDirection || lastResult.type === "entry"}
                                            onClick={() => handleToggleDirection("entry")}
                                            className={`py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xs ${
                                                lastResult.type === "entry"
                                                    ? "bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400"
                                                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                            }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                            <span>Вхід</span>
                                            {lastResult.type === "entry" && (
                                                <span className="w-2 h-2 rounded-full bg-white animate-pulse ml-1" />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={updatingDirection || lastResult.type === "exit"}
                                            onClick={() => handleToggleDirection("exit")}
                                            className={`py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xs ${
                                                lastResult.type === "exit"
                                                    ? "bg-amber-600 text-white shadow-amber-600/30 ring-2 ring-amber-400"
                                                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                            }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span>Вихід</span>
                                            {lastResult.type === "exit" && (
                                                <span className="w-2 h-2 rounded-full bg-white animate-pulse ml-1" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Велика головна кнопка «Продовжити сканування» */}
                            <button
                                type="button"
                                onClick={handleContinueScan}
                                className="w-full py-3.5 sm:py-4.5 px-4 sm:px-6 rounded-xl sm:rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-base tracking-wide transition-all shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/50 flex items-center justify-center gap-2.5 sm:gap-3 active:scale-[0.98] cursor-pointer ring-2 ring-emerald-400/40 hover:ring-emerald-400"
                            >
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    </svg>
                                </div>
                                <span>Продовжити сканування</span>
                                <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold bg-white/20 border border-white/30 rounded-lg tracking-wider">
                                    ПРОБІЛ
                                </kbd>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4 sm:p-8 space-y-2 sm:space-y-3 my-auto">
                            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 shadow-inner">
                                <svg className="w-6 h-6 sm:w-10 sm:h-10 text-emerald-600 dark:text-emerald-500/80 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <div className="max-w-xs">
                                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                                    Очікування перепустки
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Піднесіть QR-код студента до об'єктива камери або введіть номер ордера вручну.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>,
        document.body
    );
}
