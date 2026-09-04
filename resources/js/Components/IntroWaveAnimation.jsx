import React, { useState, useEffect } from "react";

/**
 * Преміальна органічна рідка заставка (Liquid Aurora Wave Curtain) для МНАУ Кампус:
 * - Миттєво покриває екран без артефактів.
 * - Включає живі лавові хвилі та м'які неонові переливи.
 * - Плавний органічний підйом шторки з хвильовим зрізом на базі SVG та cubic-bezier.
 */
export default function IntroWaveAnimation({ onClose }) {
    const [phase, setPhase] = useState("entering"); // 'entering' | 'revealing' | 'done'

    useEffect(() => {
        // 1. Показ фірмової емблеми та підготовка до плавного підйому (1.0 сек)
        const revealTimer = setTimeout(() => {
            setPhase("revealing");
        }, 1000);

        // 2. Повний плавний підйом і демонтаж компонента (1.75 сек)
        const doneTimer = setTimeout(() => {
            setPhase("done");
            if (onClose) onClose();
        }, 1750);

        return () => {
            clearTimeout(revealTimer);
            clearTimeout(doneTimer);
        };
    }, [onClose]);

    if (phase === "done") return null;

    const isRevealing = phase === "revealing";

    return (
        <div
            className={`fixed inset-0 z-[99999] pointer-events-none select-none flex flex-col items-center justify-center overflow-hidden transition-all duration-750 ease-[cubic-bezier(0.77,0,0.175,1)] transform-gpu ${
                isRevealing
                    ? "-translate-y-full opacity-0"
                    : "translate-y-0 opacity-100"
            }`}
            style={{
                background: "linear-gradient(155deg, #022c22 0%, #064e3b 35%, #047857 70%, #065f46 100%)",
                boxShadow: isRevealing ? "0 30px 60px -15px rgba(2, 44, 34, 0.6)" : "none",
            }}
        >
            {/* Живі фонові лавові хвилі всередині завіси */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-dot-pattern opacity-30" />
                <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-gradient-to-br from-emerald-400/35 via-teal-300/20 to-transparent rounded-full blur-[90px] animate-lava-1" />
                <div className="absolute -bottom-20 -right-20 w-[520px] h-[520px] bg-gradient-to-tl from-cyan-400/30 via-emerald-400/25 to-transparent rounded-full blur-[100px] animate-lava-2" />
                <div className="absolute top-1/3 left-1/4 w-[420px] h-[420px] bg-gradient-to-tr from-teal-500/25 via-emerald-600/15 to-transparent rounded-full blur-[80px] animate-lava-3" />
            </div>

            {/* Центральний брендовий блок */}
            <div
                className={`relative z-10 flex flex-col items-center text-center px-4 transition-all duration-450 ease-out transform-gpu ${
                    isRevealing ? "opacity-0 -translate-y-16 scale-95" : "opacity-100 translate-y-0 scale-100"
                }`}
            >
                {/* Емблема / Логотип МНАУ із пульсуючим неоновим ореолом */}
                <div className="relative mb-5">
                    {/* М'яке свічення позаду логотипу */}
                    <div className="absolute inset-0 -m-4 bg-emerald-400/30 rounded-full blur-2xl animate-pulse" />

                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-emerald-300 via-teal-400 to-emerald-600 p-[2.5px] shadow-[0_12px_40px_rgba(16,185,129,0.45)]">
                        <div className="w-full h-full bg-slate-950/90 rounded-[21px] flex items-center justify-center backdrop-blur-md">
                            <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-emerald-100 to-emerald-300 tracking-tight">
                                М
                            </span>
                        </div>
                    </div>

                    {/* Пульсуючий індикатор статусу онлайн */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-xs flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                    </div>
                </div>

                {/* Заголовок МНАУ */}
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase drop-shadow-md">
                    МНАУ <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">КАМПУС</span>
                </h1>

                {/* Підзаголовок */}
                <p className="mt-1.5 text-xs sm:text-sm font-medium text-emerald-100/90 tracking-wide max-w-xs sm:max-w-sm drop-shadow-xs">
                    Єдина система розселення та цифрових перепусток
                </p>

                {/* Елегантний плавний прогрес-індикатор */}
                <div className="mt-6 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-300 animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-teal-300 animate-bounce" />
                </div>
            </div>

            {/* Органічна рідка хвиля (SVG Wave Edge) знизу шторки */}
            <div className="absolute -bottom-1 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none transform translate-y-full">
                <svg
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                    className="relative block w-full h-10 sm:h-16 text-[#065f46] fill-current"
                >
                    <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,60 L1200,0 L0,0 Z" />
                </svg>
            </div>
        </div>
    );
}
