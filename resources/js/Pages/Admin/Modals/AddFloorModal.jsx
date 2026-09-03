import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { router } from "@inertiajs/react";

export default function AddFloorModal({
    isOpen,
    onClose,
    buildingId,
    buildingName = "",
    suggestedFloor = 1,
}) {
    const [floor, setFloor] = useState(1);
    const [createRooms, setCreateRooms] = useState(true);
    const [roomsCount, setRoomsCount] = useState(5);
    const [maxCapacity, setMaxCapacity] = useState(4);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setFloor(suggestedFloor || 1);
            setCreateRooms(true);
            setRoomsCount(5);
            setMaxCapacity(4);
            setError("");
        }
    }, [isOpen, suggestedFloor]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        setIsProcessing(true);

        router.post(
            route("admin.floors.store"),
            {
                building_id: buildingId,
                floor: Number(floor),
                rooms_count: createRooms ? Number(roomsCount) : 0,
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
                    setError(errs.floor || errs.error || Object.values(errs)[0] || "Помилка при створенні поверху");
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
                            {buildingName}
                        </span>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            Додати поверх
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
                    {/* Номер поверху */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Номер поверху
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            required
                            value={floor}
                            onChange={(e) => setFloor(Math.max(1, Number(e.target.value)))}
                            className="w-full text-sm rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                        />
                    </div>

                    {/* Опція створення початкових кімнат */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-700/40 border border-slate-200 dark:border-gray-600 space-y-3">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={createRooms}
                                onChange={(e) => setCreateRooms(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                Створити кімнати на поверсі
                            </span>
                        </label>

                        {createRooms && (
                            <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-gray-600/60">
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-300 font-medium mb-1">
                                        Кількість кімнат:
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={roomsCount}
                                        onChange={(e) => setRoomsCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                                    />
                                    <span className="text-[10px] text-gray-400 block mt-1">
                                        Кімнати №{floor * 100 + 1} - №{floor * 100 + Number(roomsCount)}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-300 font-medium mb-1">
                                        Кількість ліжок у кімнаті (дефолт):
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
                            disabled={isProcessing}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
                        >
                            {isProcessing ? "Створення..." : "Створити поверх"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
