import React, { useState, useEffect } from "react";

/**
 * Преміальна плавна стартова заставка (Fluid Splash Curtain) для МНАУ Кампус:
 * - Миттєво покриває екран з 0-го кадру без жодних багів та мерехтінь.
 * - При підйомі вгору завіса має плавне фізичне округлення країв (ефект поверхневого натягу рідини).
 * - При досягненні верхнього краю плавно розчиняється без залишкових ліній або фантомних артефактів.
 */
export default function IntroWaveAnimation({ onClose }) {
    const [phase, setPhase] = useState("entering"); // 'entering' | 'revealing' | 'done'

    useEffect(() => {
        // 1. Фаза показу емблеми та підготовки до підйому (1.0 сек)
        const revealTimer = setTimeout(() => {
            setPhase("revealing");
        }, 1000);

        // 2. Фаза повного завершення та демонтажу (1.7 сек)
        const doneTimer = setTimeout(() => {
            setPhase("done");
            if (onClose) onClose();
        }, 1700);

        return () => {
            clearTimeout(revealTimer);
            clearTimeout(doneTimer);
        };
    }, [onClose]);

    if (phase === "done") return null;

    const isRevealing = phase === "revealing";

    return (
        <div
            className={`fixed inset-0 z-[99999] pointer-events-none select-none flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] transform-gpu ${
                isRevealing
                    ? "-translate-y-full opacity-0 rounded-b-[60px] sm:rounded-b-[100px]"
                    : "translate-y-0 opacity-100 rounded-b-none"
            }`}
            style={{
                background: "linear-gradient(160deg, #064e3b 0%, #047857 50%, #065f46 100%)",
                boxShadow: isRevealing ? "0 25px 50px -12px rgba(6, 78, 59, 0.4)" : "none",
            }}
        >
            {/* Фонове м'яке неонове сяйво */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] bg-emerald-400/25 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-teal-400/20 rounded-full blur-[80px]" />
            </div>

            {/* Центральний брендовий блок */}
            <div
                className={`relative z-10 flex flex-col items-center text-center px-4 transition-all duration-400 ease-out transform-gpu ${
                    isRevealing ? "opacity-0 -translate-y-14 scale-95" : "opacity-100 translate-y-0 scale-100"
                }`}
            >
                {/* Емблема / Логотип МНАУ */}
                <div className="relative mb-5">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-600 p-[2.5px] shadow-[0_12px_35px_rgba(16,185,129,0.35)] animate-bounce-short">
                        <div className="w-full h-full bg-slate-950/90 rounded-[21px] flex items-center justify-center backdrop-blur-md">
                            <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-emerald-100 to-emerald-400 tracking-tight">
                                М
                            </span>
                        </div>
                    </div>
                    {/* Пульсуючий індикатор */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-xs flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                    </div>
                </div>

                {/* Заголовок МНАУ */}
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
                    МНАУ <span className="text-emerald-400">КАМПУС</span>
                </h1>

                {/* Підзаголовок */}
                <p className="mt-1.5 text-xs sm:text-sm font-medium text-emerald-100/80 tracking-wide max-w-xs sm:max-w-sm">
                    Єдина система розселення та цифрових перепусток
                </p>

                {/* Акуратний індикатор */}
                <div className="mt-6 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                </div>
            </div>

            {/* М'яка фізична крапля/хвиля знизу полотна (без залишкових ліній) */}
            <div
                className={`absolute -bottom-6 left-0 right-0 h-10 pointer-events-none transition-opacity duration-300 ${
                    isRevealing ? "opacity-90" : "opacity-0"
                }`}
                style={{
                    background: "radial-gradient(ellipse 60% 100% at 50% 0%, #065f46 0%, transparent 100%)",
                }}
            />
        </div>
    );
}
