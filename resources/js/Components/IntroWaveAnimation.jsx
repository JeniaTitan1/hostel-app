import React, { useState, useEffect } from "react";

/**
 * Преміальна плавна стартова заставка (Splash Screen) для МНАУ Кампус:
 * - Миттєво перекриває екран з 0-го кадру (усуває мерехтіння/показ сайту на телефонах).
 * - Фірмовий логотип МНАУ з м'яким неоновим сяйвом та плавною появою.
 * - Елегантна хвиля, яка плавно піднімається вгору (Curtain Wave Wipe), відкриваючи сайт.
 * - Апаратне 60fps GPU-прискорення без лагів.
 */
export default function IntroWaveAnimation({ onClose }) {
    const [phase, setPhase] = useState("entering"); // 'entering' | 'revealing' | 'done'

    useEffect(() => {
        // 1. Фаза появи та тримання заставки (1.1 сек)
        const revealTimer = setTimeout(() => {
            setPhase("revealing");
        }, 1100);

        // 2. Фаза завершення підйому завіси та закриття (1.85 сек)
        const closeTimer = setTimeout(() => {
            setPhase("done");
            if (onClose) onClose();
        }, 1850);

        return () => {
            clearTimeout(revealTimer);
            clearTimeout(closeTimer);
        };
    }, [onClose]);

    if (phase === "done") return null;

    const isRevealing = phase === "revealing";

    return (
        <div
            className={`fixed inset-0 z-[99999] pointer-events-none select-none flex flex-col items-center justify-center overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] transform-gpu ${
                isRevealing ? "-translate-y-full" : "translate-y-0"
            }`}
            style={{
                background: "linear-gradient(145deg, #064e3b 0%, #047857 45%, #022c22 100%)",
            }}
        >
            {/* Фонове м'яке неонове сяйво */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] bg-emerald-400/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-teal-400/15 rounded-full blur-[80px]" />
            </div>

            {/* Центральний брендовий блок */}
            <div
                className={`relative z-10 flex flex-col items-center text-center px-4 transition-all duration-500 ease-out transform-gpu ${
                    isRevealing ? "opacity-0 -translate-y-12 scale-95" : "opacity-100 translate-y-0 scale-100"
                }`}
            >
                {/* Емблема / Логотип МНАУ */}
                <div className="relative mb-5">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 p-[2px] shadow-[0_10px_35px_rgba(16,185,129,0.35)] animate-bounce-short">
                        <div className="w-full h-full bg-slate-950/90 rounded-[22px] flex items-center justify-center backdrop-blur-md">
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

                {/* Акуратний індикатор завантаження */}
                <div className="mt-6 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                </div>
            </div>

            {/* Нижня хвиляста лінія шторки для м'якого відкриття */}
            <div className="absolute bottom-0 left-0 right-0 translate-y-[98%] pointer-events-none">
                <svg
                    viewBox="0 0 1440 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-12 sm:h-20 text-[#022c22] fill-current preserve-3d"
                    preserveAspectRatio="none"
                >
                    <path d="M0,0 C320,90 420,120 720,120 C1020,120 1120,90 1440,0 L1440,0 L0,0 Z" />
                </svg>
            </div>
        </div>
    );
}
