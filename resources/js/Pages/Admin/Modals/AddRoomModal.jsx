import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { router } from "@inertiajs/react";

export default function AddRoomModal({
    isOpen,
    onClose,
    buildingId,
    buildingName = "",
    floor = 1,
    suggestedRoomNumber = "",
}) {
    const [mode, setMode] = useState("single"); // "single" | "multiple"
    const [roomNumber, setRoomNumber] = useState("");
    const [count, setCount] = useState(3);
    const [maxCapacity, setMaxCapacity] = useState(4);
    const [isAccessible, setIsAccessible] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setRoomNumber(suggestedRoomNumber ? String(suggestedRoomNumber) : "");
            setCount(3);
            setMaxCapacity(4);
            setIsAccessible(false);
            setMode("single");
            setError("");
        }
    }, [isOpen, suggestedRoomNumber]);

    const backdropMouseDownRef = React.useRef(false);

    if (!isOpen || typeof document === "undefined") return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        setIsProcessing(true);

        router.post(
            route("admin.rooms.store"),
            {
                building_id: buildingId,
                floor: Number(floor),
                room_number: roomNumber.trim(),
                max_capacity: Number(maxCapacity),
                is_accessible: isAccessible,
                count: mode === "multiple" ? Number(count) : 1,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsProcessing(false);
                    onClose();
                },
                onError: (errs) => {
                    setIsProcessing(false);
                    setError(errs.room_number || errs.error || Object.values(errs)[0] || "Помилка при створенні кімнати");
                },
            }
        );
    };

    const handleBackdropMouseDown = (e) => {
        backdropMouseDownRef.current = e.target === e.currentTarget;
    };

    const handleBackdropClick = (e) => {
        if (backdropMouseDownRef.current && e.target === e.currentTarget) {
            onClose();
        }
        backdropMouseDownRef.current = false;
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
            onMouseDown={handleBackdropMouseDown}
            onClick={handleBackdropClick}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 w-full max-w-lg p-6 space-y-5 mx-4 my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Заголовок */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-gray-700 pb-3">
                    <div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                            {buildingName} • {floor} поверх
                        </span>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            Додати кімнату
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                        title="Закрити"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
                        {error}
                    </div>
                )}

                {/* Перемикач режиму: 1 кімната чи декілька */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-gray-700/60 rounded-xl text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setMode("single")}
                        className={`py-2 rounded-lg transition-colors ${
                            mode === "single"
                                ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900"
                        }`}
                    >
                        Одна кімната
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("multiple")}
                        className={`py-2 rounded-lg transition-colors ${
                            mode === "multiple"
                                ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900"
                        }`}
                    >
                        Кілька кімнат підряд
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Рядок: Номер кімнати та Кількість ліжок поряд */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                {mode === "single" ? "Номер кімнати" : "Початковий номер"}
                            </label>
                            <input
                                type="text"
                                required
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                placeholder={`напр. ${floor * 100 + 1}`}
                                className="w-full text-sm rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                            <span className="text-[10px] text-gray-400 block mt-1">
                                {mode === "single" ? "Унікальний номер на поверсі" : "Починаючи з цього номера"}
                            </span>
                        </div>

                        {/* Налаштування кількості ліжок (за дефолтом) поряд */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                Місткість (ліжок за дефолтом)
                            </label>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setMaxCapacity((prev) => Math.max(1, prev - 1))}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-black hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors shrink-0"
                                >
                                    −
                                </button>
                                <div className="flex-1 h-10 flex items-center justify-center bg-slate-50 dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-600 text-base font-black text-gray-900 dark:text-white">
                                    {maxCapacity}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMaxCapacity((prev) => Math.min(10, prev + 1))}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-black hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors shrink-0"
                                >
                                    +
                                </button>
                            </div>
                            {/* Швидкі пресети кількості ліжок */}
                            <div className="flex items-center gap-1 mt-1.5">
                                {[2, 3, 4, 5].map((cap) => (
                                    <button
                                        key={cap}
                                        type="button"
                                        onClick={() => setMaxCapacity(cap)}
                                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                            maxCapacity === cap
                                                ? "bg-emerald-600 text-white border-emerald-600"
                                                : "bg-slate-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-slate-200 dark:border-gray-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        {cap}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Додаткове поле для створення кількох кімнат */}
                    {mode === "multiple" && (
                        <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50 space-y-2">
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                                Скільки кімнат створити підряд:
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={count}
                                    onChange={(e) => setCount(Math.max(1, Math.min(30, Number(e.target.value))))}
                                    className="w-24 text-sm rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-center"
                                />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Буде створено {count} кімнат (кожна на {maxCapacity} ліжок)
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Опція: Інклюзивна кімната */}
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isAccessible}
                            onChange={(e) => setIsAccessible(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                        />
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs text-base select-none leading-none">
                                ♿
                            </div>
                            <div>
                                <span className="text-xs font-bold text-gray-900 dark:text-white block">
                                    Кімната для осіб з обмеженими можливостями (інклюзивна)
                                </span>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 block">
                                    Спеціально адаптована кімната зі зручним доступом та інклюзивним обладнанням
                                </span>
                            </div>
                        </div>
                    </label>

                    {/* Кнопки дій */}
                    <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Скасувати
                        </button>
                        <button
                            type="submit"
                            disabled={isProcessing || !roomNumber.trim()}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {isProcessing ? "Створення..." : mode === "multiple" ? `Створити ${count} кімнат` : "Створити кімнату"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
