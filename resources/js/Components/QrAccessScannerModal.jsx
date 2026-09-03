import React, { useState, useEffect, useRef } from "react";
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
    const [currentTime, setCurrentTime] = useState("");

    const html5QrCodeRef = useRef(null);
    const lastScannedCodeRef = useRef(null);
    const lastScanTimeRef = useRef(0);

    // Живий годинник для шапки КПП
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString("uk-UA", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                })
            );
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] w-screen h-[100dvh] bg-[#070e1b] text-white flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* ВЕРХНЯ ПАНЕЛЬ УПРАВЛІННЯ КПП (WORKSTATION TOP BAR) */}
            <header className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 shadow-lg">
                {/* Ліва частина: Логотип та статус режиму КПП */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex sm:hidden w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 items-center justify-center transition-all active:scale-95 cursor-pointer"
                        title="Назад"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                    </div>

                    <div className="hidden sm:block">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                                Пропускний пункт КПП
                            </h2>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                ОНЛАЙН
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                            Робоче місце оператора вахти • Сканування цифрових перепусток
                        </p>
                    </div>
                </div>

                {/* Центр: Перемикачі режимів напрямку та введення (На ПК) */}
                <div className="flex items-center gap-2">
                    {/* Напрямок */}
                    <div className="flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setMode("auto")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                mode === "auto"
                                    ? "bg-emerald-600 text-white shadow-xs font-black"
                                    : "text-slate-400 hover:text-white"
                            }`}
                            title="Клавіша [1] на клавіатурі"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="hidden md:inline">Авто</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("entry")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                mode === "entry"
                                    ? "bg-emerald-600 text-white shadow-xs font-black"
                                    : "text-slate-400 hover:text-emerald-400"
                            }`}
                            title="Клавіша [2] на клавіатурі"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            <span>Вхід</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("exit")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                mode === "exit"
                                    ? "bg-amber-600 text-white shadow-xs font-black"
                                    : "text-slate-400 hover:text-amber-400"
                            }`}
                            title="Клавіша [3] на клавіатурі"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Вихід</span>
                        </button>
                    </div>

                    {/* Камера / Ручний */}
                    <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("camera");
                                handleContinueScan();
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === "camera"
                                    ? "bg-slate-800 text-emerald-400 shadow-xs font-black"
                                    : "text-slate-400 hover:text-white"
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
                                    ? "bg-slate-800 text-emerald-400 shadow-xs font-black"
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Код / Email</span>
                        </button>
                    </div>
                </div>

                {/* Права частина: Годинник та кнопка виходу з КПП */}
                <div className="flex items-center gap-3">
                    {currentTime && (
                        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-950/70 border border-slate-800 font-mono text-sm font-bold text-emerald-400 shadow-inner">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{currentTime}</span>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 hover:text-rose-200 text-xs font-black transition-all flex items-center gap-2 active:scale-95 cursor-pointer shadow-sm"
                        title="Закрити режим КПП (Esc)"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="hidden sm:inline">Вийти з КПП</span>
                    </button>
                </div>
            </header>

            {/* ОСНОВНА ЧАСТИНА: 2-КОЛОНКОВИЙ FULL-SCREEN РОБОЧИЙ ПРОСТІР НА ПК */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full items-stretch justify-center">
                {/* ЛІВА КОЛОНКА: ВІДЕОПОТІК КАМЕРИ / РУЧНИЙ ВВІД */}
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl relative">
                    {/* Перемикач вкладок для мобільних екранів */}
                    <div className="flex sm:hidden items-center gap-1.5 mb-4 p-1 bg-slate-950 rounded-2xl w-full">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("camera");
                                handleContinueScan();
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                                activeTab === "camera"
                                    ? "bg-emerald-600 text-white font-black"
                                    : "text-slate-400"
                            }`}
                        >
                            📷 Камера
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("manual")}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                                activeTab === "manual"
                                    ? "bg-emerald-600 text-white font-black"
                                    : "text-slate-400"
                            }`}
                        >
                            ⌨ Код / Email
                        </button>
                    </div>

                    {activeTab === "camera" && (
                        <div className="w-full flex flex-col items-center max-w-md">
                            <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)] flex items-center justify-center">
                                <div id="access-qr-reader" className="w-full h-full" />

                                {processing && (
                                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-3 z-20">
                                        <div className="w-12 h-12 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm font-black tracking-wide text-emerald-400">
                                            Перевірка перепустки...
                                        </span>
                                    </div>
                                )}
                            </div>

                            {cameraError ? (
                                <div className="mt-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs text-center w-full">
                                    <p className="font-semibold">{cameraError}</p>
                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        className="mt-2.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                                    >
                                        Спробувати знову
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-4 flex items-center justify-between w-full px-2 text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        Сканер активний
                                    </span>
                                    <span className="text-[11px] opacity-75">
                                        Наведіть камеру на QR
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "manual" && (
                        <div className="w-full max-w-md flex flex-col justify-center my-auto py-6">
                            <h3 className="text-base font-black text-white mb-2">
                                Ручний пошук перепустки
                            </h3>
                            <p className="text-xs text-slate-400 mb-5">
                                Якщо студент не має з собою смартфона або QR-код пошкоджено
                            </p>

                            <form onSubmit={handleManualSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                                        Номер ордера (ORD-2026-XXXX) або Email студента:
                                    </label>
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        placeholder="Введіть код або пошту..."
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-950 text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-500"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                                        Службова примітка вахтера (необов'язково):
                                    </label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Наприклад: Заніс валізу, запізнення..."
                                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || !manualCode.trim()}
                                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <span>{processing ? "Перевірка..." : "Перевірити та зафіксувати"}</span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* ПРАВА КОЛОНКА: РЕЗУЛЬТАТ СКАНУВАННЯ / КАРТКА СТУДЕНТА КПП */}
                <div className="flex-1 flex flex-col justify-center bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                    {lastResult ? (
                        <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
                            {/* Статусний бейдж пропуску */}
                            <div
                                className={`p-4 sm:p-5 rounded-3xl border-2 flex items-center gap-4 ${
                                    lastResult.valid
                                        ? lastResult.type === "entry"
                                            ? "bg-emerald-950/60 border-emerald-500/80 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                                            : "bg-amber-950/60 border-amber-500/80 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                                        : "bg-rose-950/60 border-rose-500/80 text-rose-100 shadow-[0_0_30px_rgba(244,63,94,0.2)]"
                                }`}
                            >
                                <div
                                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                                        lastResult.valid
                                            ? lastResult.type === "entry"
                                                ? "bg-emerald-600 text-white shadow-emerald-600/40"
                                                : "bg-amber-600 text-white shadow-amber-600/40"
                                            : "bg-rose-600 text-white shadow-rose-600/40"
                                    }`}
                                >
                                    {lastResult.valid ? (
                                        lastResult.type === "entry" ? (
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                        ) : (
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                        )
                                    ) : (
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    )}
                                </div>

                                <div>
                                    <span className="text-[11px] font-black uppercase tracking-wider block opacity-80">
                                        Результат верифікації:
                                    </span>
                                    <h3 className="text-lg sm:text-xl font-black">
                                        {lastResult.valid
                                            ? lastResult.type === "entry"
                                                ? "ВХІД ДОЗВОЛЕНО"
                                                : "ВИХІД ДОЗВОЛЕНО"
                                            : "ДОСТУП ЗАБОРОНЕНО"}
                                    </h3>
                                    {lastResult.message && (
                                        <p className="text-xs opacity-80 mt-0.5">{lastResult.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Персональні дані студента */}
                            {lastResult.student ? (
                                <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white text-xl font-black shadow-inner shrink-0">
                                            {lastResult.student.name?.charAt(0).toUpperCase() || "С"}
                                        </div>
                                        <div>
                                            <h4 className="text-base sm:text-lg font-black text-white">
                                                {lastResult.student.name}
                                            </h4>
                                            <p className="text-xs text-slate-400">
                                                {lastResult.student.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-bold">Спеціальність / Курс:</span>
                                            <span className="font-semibold text-slate-200">
                                                {lastResult.student.specialty || "Студент"}{" "}
                                                {lastResult.student.course ? `(${lastResult.student.course} курс)` : ""}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-bold">Академічна група:</span>
                                            <span className="font-semibold text-slate-200">
                                                {lastResult.student.group || "Не вказано"}
                                            </span>
                                        </div>

                                        {lastResult.room && (
                                            <div className="col-span-2 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60">
                                                <span className="text-[10px] text-emerald-400 block font-bold">Місце проживання:</span>
                                                <span className="font-black text-white text-sm">
                                                    Кімната {lastResult.room.room_number} (Поверх {lastResult.room.floor}) • {lastResult.room.building?.name}
                                                </span>
                                            </div>
                                        )}

                                        {lastResult.order_number && (
                                            <div className="col-span-2 text-[11px] text-slate-400 font-mono">
                                                Ордер: {lastResult.order_number}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            {/* Швидке виправлення напрямку */}
                            {lastResult.valid && lastResult.log && (
                                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                                    <span className="text-xs font-bold text-slate-300">
                                        Помилковий напрямок?
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={updatingDirection || lastResult.type === "entry"}
                                            onClick={() => handleToggleDirection("entry")}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                                lastResult.type === "entry"
                                                    ? "bg-emerald-600 text-white shadow-xs"
                                                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                            }`}
                                        >
                                            Вхід
                                        </button>
                                        <button
                                            type="button"
                                            disabled={updatingDirection || lastResult.type === "exit"}
                                            onClick={() => handleToggleDirection("exit")}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                                lastResult.type === "exit"
                                                    ? "bg-amber-600 text-white shadow-xs"
                                                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                            }`}
                                        >
                                            Вихід
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Велика кнопка «Наступний студент» */}
                            <button
                                type="button"
                                onClick={handleContinueScan}
                                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm tracking-wide transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Продовжити сканування (Пробіл)</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto">
                            <div className="w-20 h-20 rounded-3xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center text-slate-600 shadow-inner">
                                <svg className="w-10 h-10 text-emerald-500/80 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <div className="max-w-xs">
                                <h4 className="text-base font-black text-white">
                                    Очікування перепустки
                                </h4>
                                <p className="text-xs text-slate-400 mt-1">
                                    Піднесіть QR-код студента до об'єктива камери або введіть номер ордера вручну.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
