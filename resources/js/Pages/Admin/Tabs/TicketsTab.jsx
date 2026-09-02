import React from "react";

export default function TicketsTab({ tickets = [], handleResolveTicket, ticketProcessingId }) {
    return (
        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight">
                    Заявки на ремонт та обслуговування
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-400">
                    Звернення від студентів щодо технічних неполадок у кімнатах ({tickets.length})
                </p>
            </div>

            {tickets.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                    Немає заяв на ремонт.
                </div>
            ) : (
                <>
                    {/* Mobile Cards View */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                        {tickets.map((t) => (
                            <div key={t.id} className="p-4 space-y-3 bg-white dark:bg-gray-800">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-bold text-sm text-gray-900 dark:text-white">
                                            {t.user?.name || "Студент"}
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono">
                                            {t.user?.email}
                                        </div>
                                    </div>
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                                            t.status === "resolved"
                                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                                : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                                        }`}
                                    >
                                        {t.status === "resolved" ? "Вирішено" : "В роботі"}
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-gray-700 text-xs space-y-2">
                                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                                        <span className="text-gray-400">Кімната:</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            №{t.room?.room_number} ({t.room?.building?.name})
                                        </span>
                                    </div>
                                    <div className="pt-1 border-t border-slate-200/60 dark:border-gray-700 text-gray-800 dark:text-gray-200 leading-relaxed">
                                        <span className="text-gray-400 block text-[10px] uppercase font-bold mb-0.5">Опис проблеми:</span>
                                        {t.description}
                                    </div>
                                </div>

                                {t.status === "pending" && (
                                    <button
                                        type="button"
                                        onClick={() => handleResolveTicket(t.id)}
                                        disabled={ticketProcessingId === t.id}
                                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 shadow-xs active:scale-95"
                                    >
                                        {ticketProcessingId === t.id ? "Оновлюється..." : "Позначити як виконано"}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    <th className="p-4">Студент</th>
                                    <th className="p-4">Кімната / Корпус</th>
                                    <th className="p-4">Опис поломки</th>
                                    <th className="p-4">Статус</th>
                                    <th className="p-4 text-right">Дія</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-200">
                                {tickets.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4 font-medium text-gray-900 dark:text-white">
                                            <div className="font-bold">{t.user?.name}</div>
                                            <div className="text-[10px] text-gray-400 font-normal">{t.user?.email}</div>
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300">
                                            Кімната №{t.room?.room_number} ({t.room?.building?.name})
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 max-w-xs truncate" title={t.description}>
                                            {t.description}
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    t.status === "resolved"
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                                                        : "bg-amber-50 text-amber-700 border border-amber-200/50"
                                                }`}
                                            >
                                                {t.status === "resolved" ? "Вирішено" : "Активна"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {t.status === "pending" && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleResolveTicket(t.id)}
                                                    disabled={ticketProcessingId === t.id}
                                                    className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline disabled:opacity-50"
                                                >
                                                    {ticketProcessingId === t.id ? "Вирішується..." : "Вирішити"}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
