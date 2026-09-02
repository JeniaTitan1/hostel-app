import React, { useState, useEffect } from "react";

export default function AuditLogsTab({ auditLogs = [], handleClearLogs, handleExportPDF, handleExportCSV }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);

    const filteredLogs = auditLogs.filter((log) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            log.action?.toLowerCase().includes(q) ||
            log.details?.toLowerCase().includes(q) ||
            log.user?.name?.toLowerCase().includes(q) ||
            log.user?.email?.toLowerCase().includes(q)
        );
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / perPage));
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    return (
        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-gray-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
                        Журнал аудиту дій
                    </h3>
                    <p className="text-xs text-gray-400">
                        Лог адміністративних дій та статусів заселення ({filteredLogs.length} записів)
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Пошук у журналі дій..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-56 focus:ring-2 focus:ring-emerald-500"
                    />

                    {handleExportPDF && (
                        <button
                            type="button"
                            onClick={handleExportPDF}
                            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-200/50 dark:border-emerald-800/40 transition-colors"
                        >
                            PDF
                        </button>
                    )}
                    {handleExportCSV && (
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-200/50 dark:border-indigo-800/40 transition-colors"
                        >
                            CSV
                        </button>
                    )}
                    {auditLogs.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearLogs}
                            className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl transition-colors border border-red-200/50 dark:border-red-800/40 flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Очистити</span>
                        </button>
                    )}
                </div>
            </div>

            {paginatedLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                    {auditLogs.length === 0 ? "Журнал аудиту порожній." : "Записів за вашим запитом не знайдено."}
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
                            {paginatedLogs.map((log) => (
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

            {/* Pagination Toolbar */}
            {filteredLogs.length > 0 && (
                <div className="p-4 border-t border-slate-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <span>Показано {Math.min((currentPage - 1) * perPage + 1, filteredLogs.length)} - {Math.min(currentPage * perPage, filteredLogs.length)} із {filteredLogs.length}</span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="text-xs rounded-lg border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-1 px-2 text-gray-700 dark:text-gray-200"
                        >
                            <option value={10}>10 на сторінці</option>
                            <option value={20}>20 на сторінці</option>
                            <option value={50}>50 на сторінці</option>
                            <option value={100}>100 на сторінці</option>
                        </select>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-gray-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-700 font-medium transition-colors"
                            >
                                &larr;
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((p, idx, arr) => (
                                    <React.Fragment key={p}>
                                        {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-1 text-gray-400">...</span>}
                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage(p)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                                currentPage === p
                                                    ? "bg-emerald-600 text-white"
                                                    : "border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    </React.Fragment>
                                ))}
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-gray-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-700 font-medium transition-colors"
                            >
                                &rarr;
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
