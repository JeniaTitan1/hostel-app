import React from "react";

export const BedIcon = ({ gender, isOccupied, name }) => {
    if (!isOccupied) {
        return (
            <svg
                className="w-5 h-5 text-slate-200 dark:text-gray-700 hover:text-slate-350 transition-colors"
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
    const colorClass =
        gender === "female"
            ? "text-pink-500 dark:text-pink-400 drop-shadow-[0_2px_4px_rgba(244,63,94,0.15)]"
            : "text-blue-500 dark:text-blue-400 drop-shadow-[0_2px_4px_rgba(59,130,246,0.15)]";
    return (
        <svg
            className={`w-5 h-5 ${colorClass} hover:scale-110 transition-all cursor-pointer`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            title={name}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2 4v16M2 8h20M22 4v16M2 18h20M6 8v5a3 3 0 003 3h6a3 3 0 003-3V8"
            />
            <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <path
                d="M12 12h5a1 1 0 011 1v3h-7v-3a1 1 0 011-1z"
                fill="currentColor"
                stroke="none"
            />
        </svg>
    );
};

export default BedIcon;
