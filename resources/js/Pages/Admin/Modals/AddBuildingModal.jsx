import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { router } from "@inertiajs/react";

export default function AddBuildingModal({
    isOpen,
    onClose,
}) {
    const [name, setName] = useState("");
    const [scaffold, setScaffold] = useState(true);
    const [floorsCount, setFloorsCount] = useState(5);
    const [roomsPerFloor, setRoomsPerFloor] = useState(10);
    const [maxCapacity, setMaxCapacity] = useState(4);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setName("");
            setScaffold(true);
            setFloorsCount(5);
            setRoomsPerFloor(10);
            setMaxCapacity(4);
            setError("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        setIsProcessing(true);

        router.post(
            route("admin.buildings.store"),
            {
                name: name.trim(),
                floors_count: scaffold ? Number(floorsCount) : 0,
                rooms_per_floor: scaffold ? Number(roomsPerFloor) : 0,
                max_capacity: Number(maxCapacity),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsProcessing(false);
                    onClose();
                },
                onError: (errs) => {
                    setIsProcessing(false);
                    setError(errs.name || errs.error || Object.values(errs)[0] || "Помилка при створенні корпусу");
                },
            }
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 w-full max-w-md p-6 space-y-5 mx-4 my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Заголовок */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-gray-700 pb-3">
                    <div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                            Головний адміністратор
                        </span>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            Додати новий корпус
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-sm font-bold"
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Назва корпусу */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Назва корпусу
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="напр. Корпус №3"
                            className="w-full text-sm rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                        />
                    </div>

                    {/* Початкове структурування */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-700/40 border border-slate-200 dark:border-gray-600 space-y-3">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={scaffold}
                                onChange={(e) => setScaffold(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                Створити початкові поверхи та кімнати
                            </span>
                        </label>

                        {scaffold && (
                            <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-gray-600/60 text-xs">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-gray-600 dark:text-gray-300 font-medium mb-1">
                                            Кількість поверхів:
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={floorsCount}
                                            onChange={(e) => setFloorsCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                                            className="w-full rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-center"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 dark:text-gray-300 font-medium mb-1">
                                            Кімнат на поверх:
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={roomsPerFloor}
                                            onChange={(e) => setRoomsPerFloor(Math.max(1, Math.min(30, Number(e.target.value))))}
                                            className="w-full rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-center"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-600 dark:text-gray-300 font-medium mb-1">
                                        Ліжок у кімнаті за замовчуванням:
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                        {[2, 3, 4, 5, 6].map((cap) => (
                                            <button
                                                key={cap}
                                                type="button"
                                                onClick={() => setMaxCapacity(cap)}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                                    maxCapacity === cap
                                                        ? "bg-emerald-600 text-white border-emerald-600"
                                                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-slate-200 dark:border-gray-600 hover:bg-slate-100"
                                                }`}
                                            >
                                                {cap}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-[11px] text-gray-400">
                                    Буде згенеровано {floorsCount * roomsPerFloor} кімнат ({floorsCount} пов. × {roomsPerFloor} кімн.) з місткістю по {maxCapacity} ліжка.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Кнопки */}
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
                            disabled={isProcessing || !name.trim()}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
                        >
                            {isProcessing ? "Створення..." : "Створити корпус"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
