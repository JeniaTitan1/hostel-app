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
                className="w-5 h-5 text-pink-500 dark:text-pink-400 drop-shadow-sm hover:scale-110 transition-transform cursor-pointer shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                title={name ? `${name} (Дівчина)` : "Дівчина"}
            >
                {/* Голова */}
                <circle cx="12" cy="5.5" r="3.5" />
                {/* Силует дівчини (сукня) */}
                <path d="M8.2 12c-.7 0-1.2.6-1 1.3l1.8 6.7c.2.6.7 1 1.3 1h3.4c.6 0 1.1-.4 1.3-1l1.8-6.7c.2-.7-.3-1.3-1-1.3H8.2z" />
            </svg>
        );
    }

    // Хлопчик (male або за замовчуванням)
    return (
        <svg
            className="w-5 h-5 text-blue-500 dark:text-blue-400 drop-shadow-sm hover:scale-110 transition-transform cursor-pointer shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
            title={name ? `${name} (Хлопець)` : "Хлопець"}
        >
            {/* Голова */}
            <circle cx="12" cy="5.5" r="3.5" />
            {/* Силует хлопця (торс / плечі) */}
            <path d="M5.5 19c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5v.5c0 .6-.4 1-1 1h-11c-.6 0-1-.4-1-1V19z" />
        </svg>
    );
};

export default BedIcon;
