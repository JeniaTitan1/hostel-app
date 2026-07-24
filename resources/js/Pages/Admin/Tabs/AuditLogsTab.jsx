import React from "react";

export default function AuditLogsTab({ auditLogs = [], handleClearLogs, handleExportPDF, handleExportCSV }) {
    return (
        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
                        Журнал аудиту дій
                    </h3>
                    <p className="text-xs text-gray-400">
                        Лог адміністративних дій та статусів заселення
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {handleExportPDF && (
                        <button
                            type="button"
                            onClick={handleExportPDF}
                            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-200/50 dark:border-emerald-800/40 transition-colors"
                        >
                            📄 Завантажити PDF
                        </button>
                    )}
                    {handleExportCSV && (
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-200/50 dark:border-indigo-800/40 transition-colors"
                        >
                            📊 Завантажити CSV
                        </button>
                    )}
                    {auditLogs.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearLogs}
                            className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl transition-colors border border-red-200/50 dark:border-red-800/40"
                        >
                            🗑️ Очистити журнал
                        </button>
                    )}
                </div>
            </div>

            {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                    Журнал аудиту порожній.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                <th className="p-4">Студент / Користувач</th>
                                <th className="p-4">Дія</th>
                                <th className="p-4">Подробиці</th>
                                <th className="p-4">Дата / Час</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-200">
                            {auditLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="p-4 font-semibold">
                                        {log.user ? (
                                            <div>
                                                <div className="text-gray-900 dark:text-white font-bold">{log.user.name}</div>
                                                <div className="text-[10px] text-gray-400 font-normal">{log.user.email}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Система / Адмін</span>
                                        )}
                                    </td>
                                    <td className="p-4 font-mono">
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                log.action.includes("approved")
                                                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300"
                                                    : log.action.includes("rejected") || log.action.includes("evicted")
                                                      ? "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300"
                                                      : log.action.includes("relocation")
                                                        ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300"
                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                            }`}
                                        >
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">{log.details}</td>
                                    <td className="p-4 text-gray-400">
                                        {new Date(log.created_at).toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })}
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
