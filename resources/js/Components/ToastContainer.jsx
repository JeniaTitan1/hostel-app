import React, { useState, useEffect } from "react";

export function Toast({ toast, onClose }) {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const interval = 10;
        const step = (interval / toast.duration) * 100;
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    onClose();
                    return 0;
                }
                return prev - step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [toast.duration, onClose]);

    const isError = /помилка|не вдалося|error|не визначити/i.test(
        toast.message
    );
    const isWarning = /увага|попередження|warning|змішана/i.test(toast.message);

    let icon = (
        <svg
            className="w-5 h-5 text-blue-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    );
    let progressBg = "bg-emerald-500";

    if (isError) {
        icon = (
            <svg
                className="w-5 h-5 text-red-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        );
        progressBg = "bg-red-500";
    } else if (isWarning) {
        icon = (
            <svg
                className="w-5 h-5 text-amber-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
            </svg>
        );
        progressBg = "bg-amber-500";
    } else if (
        /успішно|створено|видалено|затверджено|виселено|заселено/i.test(
            toast.message
        )
    ) {
        icon = (
            <svg
                className="w-5 h-5 text-emerald-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        );
        progressBg = "bg-emerald-500";
    }

    return (
        <div className="pointer-events-auto flex flex-col min-w-[280px] max-w-sm rounded-xl border bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-lg overflow-hidden border-gray-150 dark:border-gray-700 transition-all duration-300 animate-slide-in-left">
            <div className="flex items-start p-3.5 gap-3">
                {icon}
                <div className="flex-1 text-xs font-semibold text-gray-800 dark:text-gray-200 leading-normal">
                    {toast.message}
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                >
                    <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
            <div className="h-0.5 w-full bg-gray-100 dark:bg-gray-700/50">
                <div
                    className={`h-full ${progressBg} transition-all duration-[10ms] ease-linear`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

export default function ToastContainer({ toasts, setToasts }) {
    return (
        <div className="fixed top-4 left-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    toast={toast}
                    onClose={() =>
                        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                    }
                />
            ))}
        </div>
    );
}
