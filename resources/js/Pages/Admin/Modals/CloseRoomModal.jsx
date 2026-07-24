import React from "react";
import { createPortal } from "react-dom";
import { useForm } from "@inertiajs/react";

export default function CloseRoomModal({ room, onClose }) {
    if (!room) return null;

    const form = useForm({
        closure_reason: "",
        closure_duration: "",
        hide_from_frontend: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post(route("admin.rooms.toggle-status", room.id), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
        });
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 w-full max-w-md p-6 space-y-4 mx-4 my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="border-b border-slate-100 dark:border-gray-700 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400 text-lg font-black shrink-0">
                            🔧
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                Технічне обслуговування
                            </span>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Закрити кімнату №{room.room_number} на ремонт
                            </h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 text-sm font-bold"
                    >
                        ✕
                    </button>
                </div>

                {/* Відображення помилки якщо в кімнаті є мешканці */}
                {form.errors.error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-semibold flex items-start gap-2">
                        <span className="text-sm shrink-0">⚠️</span>
                        <span>{form.errors.error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Причина закриття (необов'язково)
                        </label>
                        <input
                            type="text"
                            placeholder="напр. Капітальний ремонт сантехніки, фарбування"
                            value={form.data.closure_reason}
                            onChange={(e) => form.setData("closure_reason", e.target.value)}
                            className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 bg-slate-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                        />
                        <p className="text-[10px] text-gray-400">
                            Ця причина буде відображатися студентам на фронтенді.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Орієнтовний термін (необов'язково)
                        </label>
                        <input
                            type="text"
                            placeholder="напр. до 1 вересня, 2 тижні"
                            value={form.data.closure_duration}
                            onChange={(e) => form.setData("closure_duration", e.target.value)}
                            className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 bg-slate-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1 group">
                        <input
                            type="checkbox"
                            checked={form.data.hide_from_frontend}
                            onChange={(e) => form.setData("hide_from_frontend", e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:bg-gray-700"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                            Приховати кімнату з сайту повністю 🙈
                        </span>
                    </label>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-slate-50 transition-colors"
                        >
                            Скасувати
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                        >
                            <span>🔧</span>
                            <span>{form.processing ? "Збереження..." : "Закрити на ремонт"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
