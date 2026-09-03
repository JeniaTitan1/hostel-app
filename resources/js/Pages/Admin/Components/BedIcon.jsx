import React from "react";

export const BedIcon = ({ gender, isOccupied, name }) => {
    if (!isOccupied) {
        return (
            <svg
                className="w-5 h-5 text-slate-300 dark:text-gray-600 hover:text-emerald-500 transition-colors shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                title="Вільне ліжко"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2 4v16M2 8h20M22 4v16M2 18h20M6 8v5a3 3 0 003 3h6a3 3 0 003-3V8"
                />
            </svg>
        );
    }

    if (gender === "female") {
        return (
            <svg
                className="w-5 h-5 text-pink-500 dark:text-pink-400 drop-shadow-[0_2px_4px_rgba(244,63,94,0.2)] hover:scale-110 transition-all cursor-pointer shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                title={name ? `${name} (Дівчина)` : "Дівчина"}
            >
                {/* Зачіска дівчинки (довгі локони / бічні пасма) */}
                <path
                    d="M7 11.5C6.5 8 8 4 12 4s5.5 4 5 7.5c-.3 2.2-1.2 3.5-1.5 4"
                    strokeWidth="1.8"
                />
                <path
                    d="M7 11.5c.3 2.2 1.2 3.5 1.5 4"
                    strokeWidth="1.8"
                />
                {/* Обличчя */}
                <circle
                    cx="12"
                    cy="8.5"
                    r="3.5"
                    fill="currentColor"
                    fillOpacity="0.2"
                />
                {/* Корпус / плечі */}
                <path d="M5 20.5c0-3.5 3.13-6.5 7-6.5s7 3 7 6.5" />
                {/* Бантик / декольте */}
                <path d="M10.5 14a2 2 0 0 0 3 0" strokeWidth="1.5" />
            </svg>
        );
    }

    // Хлопчик (male або за замовчуванням)
    return (
        <svg
            className="w-5 h-5 text-blue-500 dark:text-blue-400 drop-shadow-[0_2px_4px_rgba(59,130,246,0.2)] hover:scale-110 transition-all cursor-pointer shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            title={name ? `${name} (Хлопець)` : "Хлопець"}
        >
            {/* Голова хлопчика */}
            <circle
                cx="12"
                cy="8"
                r="3.8"
                fill="currentColor"
                fillOpacity="0.2"
            />
            {/* Зачіска хлопчика (чубчик) */}
            <path
                d="M8.2 7c.6-2.5 2.2-3.8 3.8-3.8 2.2 0 3.8 1.5 4.3 3.5"
                strokeWidth="2.2"
            />
            {/* Корпус / плечі */}
            <path d="M5 20.5c0-3.5 3.13-6.5 7-6.5s7 3 7 6.5" />
            {/* Комірець сорочки */}
            <path d="M10 14l2 2.5 2-2.5" strokeWidth="1.5" />
        </svg>
    );
};

export default BedIcon;
