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
    const [cameraError, setCameraError] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [activeTab, setActiveTab] = useState("camera"); // 'camera' | 'manual'
    const [notes, setNotes] = useState("");

    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);
    const lastScannedCodeRef = useRef(null);
    const lastScanTimeRef = useRef(0);

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
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            };

            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                onQrDecoded,
                (errorMessage) => {
                    // Ігноруємо проміжні помилки пошуку QR в кадрі
                }
            );
        } catch (err) {
            console.error("Camera start error:", err);
            setCameraError(
                "Не вдалося отримати доступ до камери. Перевірте дозволи або використовуйте ручне введення коду."
            );
            setIsScanning(false);
        }
    };

    const stopCamera = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
                html5QrCodeRef.current.clear();
            } catch (e) {
                console.warn("Error stopping camera:", e);
            }
            html5QrCodeRef.current = null;
        }
        setIsScanning(false);
    };

    const onQrDecoded = (decodedText) => {
        const now = Date.now();
        // Захист від повторного швидкого сканування одного й того ж коду (cooldown 3 сек)
        if (
            lastScannedCodeRef.current === decodedText &&
            now - lastScanTimeRef.current < 3000
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
            // Вібрація на смартфонах при зчитуванні
            if (typeof window !== "undefined" && window.navigator?.vibrate) {
                window.navigator.vibrate(15);
            }

            const res = await fetch(route("admin.access-logs.scan"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                {/* Шапка модалки */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between bg-slate-50/70 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xs">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                Сканер пропускного пункту (КПП)
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                                Автоматична фіксація входу та виходу студентів
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-gray-800 hover:bg-slate-300 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Налаштування напрямку (Вхід / Вихід / Авто) */}
                <div className="px-4 sm:px-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-gray-800 rounded-2xl w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setMode("auto")}
                            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                mode === "auto"
                                    ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs"
                                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900"
                            }`}
                        >
                            <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Авто-напрямок</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("entry")}
                            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                mode === "entry"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-600 dark:text-gray-400 hover:text-emerald-600"
                            }`}
                        >
                            <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            <span>Тільки Вхід</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("exit")}
                            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                mode === "exit"
                                    ? "bg-amber-600 text-white shadow-xs"
                                    : "text-slate-600 dark:text-gray-400 hover:text-amber-600"
                            }`}
                        >
                            <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Тільки Вихід</span>
                        </button>
                    </div>

                    {/* Перемикач режиму: Камера або Ручний пошук */}
                    <div className="flex items-center gap-2 text-xs font-bold w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={() => setActiveTab("camera")}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                                activeTab === "camera"
                                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black"
                                    : "text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800"
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Камера</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("manual")}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                                activeTab === "manual"
                                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black"
                                    : "text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800"
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Ручний ввід</span>
                        </button>
                    </div>
                </div>

                {/* Основний блок вмісту */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                    {/* ТАБ 1: КАМЕРА СКАНЕРА */}
                    {activeTab === "camera" && (
                        <div className="relative flex flex-col items-center">
                            <div className="relative w-full max-w-sm aspect-square bg-slate-950 rounded-3xl overflow-hidden border-2 border-emerald-500/30 shadow-inner flex items-center justify-center">
                                <div id="access-qr-reader" className="w-full h-full" />

                                {processing && (
                                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-20">
                                        <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs font-bold">Перевірка перепустки...</span>
                                    </div>
                                )}
                            </div>

                            {cameraError && (
                                <div className="mt-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs text-center w-full">
                                    <p className="font-semibold">{cameraError}</p>
                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        className="mt-2 px-3 py-1 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-500 transition-colors"
                                    >
                                        Спробувати знову
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ТАБ 2: РУЧНИЙ ВВІД КОДУ ОРДЕРА ЧИ EMAIL */}
                    {activeTab === "manual" && (
                        <form onSubmit={handleManualSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">
                                    Номер ордера (напр. ORD-2026-XXXX) або Email студента:
                                </label>
                                <input
                                    type="text"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    placeholder="Введіть код перепустки або email..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 dark:text-gray-400 mb-1">
                                    Службова примітка вахтера (необов'язково):
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Наприклад: Заніс валізу, запізнення..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-900 dark:text-white text-xs"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processing || !manualCode.trim()}
                                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span>{processing ? "Перевірка..." : "Перевірити та зафіксувати прохід"}</span>
                            </button>
                        </form>
                    )}

                    {/* РЕЗУЛЬТАТ ОСТАННЬОГО СКАНУВАННЯ */}
                    {lastResult && (
                        <div
                            className={`p-4 rounded-2xl border transition-all animate-fade-in ${
                                lastResult.valid
                                    ? lastResult.type === "entry"
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100"
                                        : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100"
                                    : "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700 text-red-950 dark:text-red-100"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                            lastResult.valid
                                                ? lastResult.type === "entry"
                                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                                    : "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                                                : "bg-red-600 text-white shadow-md shadow-red-600/30"
                                        }`}
                                    >
                                        {lastResult.valid ? (
                                            lastResult.type === "entry" ? (
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                </svg>
                                            ) : (
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                            )
                                        ) : (
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                    lastResult.valid
                                                        ? lastResult.type === "entry"
                                                            ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-white"
                                                            : "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-white"
                                                        : "bg-red-200 dark:bg-red-800 text-red-900 dark:text-white"
                                                }`}
                                            >
                                                {lastResult.valid
                                                    ? lastResult.type === "entry"
                                                        ? "ВХІД ДОЗВОЛЕНО"
                                                        : "ВИХІД ДОЗВОЛЕНО"
                                                    : "ДОСТУП ЗАБОРОНЕНО"}
                                            </span>
                                            {lastResult.log && (
                                                <span className="text-[10px] font-semibold text-slate-500 dark:text-gray-400">
                                                    {lastResult.log.created_at}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-sm font-black mt-0.5">
                                            {lastResult.student?.name || "Невідомий користувач"}
                                        </h4>
                                    </div>
                                </div>
                            </div>

                            {/* Деталі студента та кімнати */}
                            {lastResult.student && (
                                <div className="mt-3 pt-3 border-t border-current/10 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-[10px] opacity-75 block">Академічні дані:</span>
                                        <span className="font-bold">
                                            {lastResult.student.specialty || "Студент"}{" "}
                                            {lastResult.student.course ? `(${lastResult.student.course} курс)` : ""}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] opacity-75 block">Група:</span>
                                        <span className="font-bold">
                                            {lastResult.student.group || "Не вказано"}
                                        </span>
                                    </div>
                                    {lastResult.room && (
                                        <div className="col-span-2 mt-1">
                                            <span className="text-[10px] opacity-75 block">Місце проживання:</span>
                                            <span className="font-black text-emerald-800 dark:text-emerald-300">
                                                Кімната {lastResult.room.room_number} (Поверх {lastResult.room.floor}) · {lastResult.room.building?.name}
                                            </span>
                                        </div>
                                    )}
                                    {lastResult.order_number && (
                                        <div className="col-span-2 text-[10px] opacity-75 font-mono">
                                            Ордер: {lastResult.order_number}
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="mt-2 text-[11px] font-medium leading-tight">
                                {lastResult.message}
                            </p>
                        </div>
                    )}
                </div>

                {/* Футер */}
                <div className="p-4 border-t border-slate-100 dark:border-gray-800 flex justify-end bg-slate-50/50 dark:bg-gray-800/30">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 text-slate-800 dark:text-white text-xs font-bold transition-all cursor-pointer"
                    >
                        Закрити сканер
                    </button>
                </div>
            </div>
        </div>
    );
}
