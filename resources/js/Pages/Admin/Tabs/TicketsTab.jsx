import React from "react";

export default function TicketsTab({ tickets = [], handleResolveTicket, ticketProcessingId }) {
    return (
        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
                    Заявки на ремонт та обслуговування
                </h3>
                <p className="text-xs text-gray-400">
                    Звернення від студентів щодо технічних неполадок у кімнатах
                </p>
            </div>

            {tickets.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                    Немає заяв на ремонт.
                </div>
            ) : (
                <div className="overflow-x-auto">
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
            )}
        </div>
    );
}
