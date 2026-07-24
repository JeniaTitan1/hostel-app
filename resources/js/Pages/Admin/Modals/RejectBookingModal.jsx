import React from "react";
import { createPortal } from "react-dom";

export default function RejectBookingModal({
    rejectModalBookingId,
    onClose,
    rejectReason,
    setRejectReason,
    onSubmit,
    isProcessing,
}) {
    if (!rejectModalBookingId) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 w-full max-w-md p-6 space-y-4 mx-4 my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                        Відхилити заявку
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Вкажіть причину відхилення (необов'язково). Студент побачить це пояснення.
                    </p>
                </div>

                <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Наприклад: Перевищено ліміт мешканців у кімнаті, оберіть іншу..."
                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-gray-700 p-3 focus:border-red-400 focus:ring-0 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none h-24"
                    maxLength={500}
                />
                <p className="text-[10px] text-gray-400 text-right">
                    {rejectReason.length}/500
                </p>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Скасувати
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
                    >
                        {isProcessing ? "..." : "Підтвердити відхилення"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
