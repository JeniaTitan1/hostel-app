import React, { useState, useEffect } from "react";
import QrAccessScannerModal from "@/Components/QrAccessScannerModal";

export default function AccessLogsTab({
    accessLogs = [],
    accessStats = {
        entries_today: 0,
        exits_today: 0,
        denied_today: 0,
        total_scans_today: 0,
    },
    buildings = [],
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("all"); // 'all' | 'entry' | 'exit'
    const [selectedStatus, setSelectedStatus] = useState("all"); // 'all' | 'granted' | 'denied'
    const [selectedBuilding, setSelectedBuilding] = useState("all");
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [logsList, setLogsList] = useState(accessLogs);
    const [stats, setStats] = useState(accessStats);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    useEffect(() => {
        setLogsList(accessLogs);
    }, [accessLogs]);

    useEffect(() => {
        setStats(accessStats);
    }, [accessStats]);

    // Фільтрація логів
    const filteredLogs = logsList.filter((log) => {
        // Пошук за текстом
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const userName = log.user?.name?.toLowerCase() || "";
            const userEmail = log.user?.email?.toLowerCase() || "";
            const orderNum = log.booking?.order_number?.toLowerCase() || "";
            const roomNum = log.booking?.room?.room_number?.toLowerCase() || "";
            const notes = log.notes?.toLowerCase() || "";

            if (
                !userName.includes(q) &&
                !userEmail.includes(q) &&
                !orderNum.includes(q) &&
                !roomNum.includes(q) &&
                !notes.includes(q)
            ) {
                return false;
            }
        }

        // Фільтр за типом (вхід / вихід)
        if (selectedType !== "all" && log.type !== selectedType) {
            return false;
        }

        // Фільтр за статусом
        if (selectedStatus !== "all" && log.status !== selectedStatus) {
            return false;
        }

        // Фільтр за корпусом
        if (selectedBuilding !== "all") {
            const logBuildingId =
                log.building_id || log.booking?.room?.building_id;
            if (String(logBuildingId) !== String(selectedBuilding)) {
                return false;
            }
        }

        return true;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedType, selectedStatus, selectedBuilding]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / perPage));
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    const handleScanSuccess = (scanData) => {
        if (scanData.log) {
            const newLogEntry = {
                id: scanData.log.id,
                created_at: scanData.log.created_at,
                type: scanData.type,
                status: scanData.status,
                method: "qr_scan",
                notes: scanData.notes || null,
                user: scanData.student,
                booking: scanData.room
                    ? {
                          order_number: scanData.order_number,
                          room: scanData.room,
                      }
                    : null,
                building: scanData.room?.building || null,
            };

            setLogsList((prev) => [newLogEntry, ...prev]);

            // Оновлення лічильників
            setStats((prev) => {
                const next = { ...prev, total_scans_today: prev.total_scans_today + 1 };
                if (scanData.status === "granted") {
                    if (scanData.type === "entry") {
                        next.entries_today = prev.entries_today + 1;
                    } else {
                        next.exits_today = prev.exits_today + 1;
                    }
                } else {
                    next.denied_today = prev.denied_today + 1;
                }
                return next;
            });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return dateString;
            return d.toLocaleString("uk-UA", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 1. ВЕРХНІ КАРТКИ СТАТИСТИКИ (KPI) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Зайшло сьогодні */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xl shrink-0 border border-emerald-100 dark:border-emerald-800/40">
                        🟢
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                            {stats.entries_today}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-gray-400">
                            Входів сьогодні
                        </div>
                    </div>
                </div>

                {/* Вийшло сьогодні */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xl shrink-0 border border-amber-100 dark:border-amber-800/40">
                        🔴
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                            {stats.exits_today}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-gray-400">
                            Виходів сьогодні
                        </div>
                    </div>
                </div>

                {/* Відмовлено у вході */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-xl shrink-0 border border-rose-100 dark:border-rose-800/40">
                        🚫
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                            {stats.denied_today}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-gray-400">
                            Відмовлено в доступі
                        </div>
                    </div>
                </div>

                {/* Всього перевірок */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black text-xl shrink-0 border border-sky-100 dark:border-sky-800/40">
                        ⚡
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                            {stats.total_scans_today}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-gray-400">
                            Всього перевірок КПП
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. ПАНЕЛЬ ДІЙ ТА ФІЛЬТРІВ */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-3xl shadow-sm p-5 space-y-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-black text-gray-900 dark:text-white text-lg tracking-tight flex items-center gap-2">
                            <span>Журнал пропускного пункту (КПП)</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                                {filteredLogs.length} записів
                            </span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Фіксація входу/виходу студентів та гостей через цифрові QR-перепустки
                        </p>
                    </div>

                    {/* Головна кнопка виклику сканера */}
                    <button
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <span>📷 Відкрити QR-сканер КПП</span>
                    </button>
                </div>

                {/* Рядок фільтрів */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100 dark:border-gray-700">
                    {/* Пошук */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Пошук студента, ордера, кімнати..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>

                    {/* Фільтр за типом: Вхід / Вихід */}
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                        <option value="all">Усі напрямки (Вхід + Вихід)</option>
                        <option value="entry">🟢 Тільки Вхід</option>
                        <option value="exit">🔴 Тільки Вихід</option>
                    </select>

                    {/* Фільтр за статусом */}
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                        <option value="all">Усі статуси</option>
                        <option value="granted">✅ Доступ дозволено</option>
                        <option value="denied">❌ Відмовлено</option>
                    </select>

                    {/* Фільтр за гуртожитком */}
                    {buildings.length > 0 && (
                        <select
                            value={selectedBuilding}
                            onChange={(e) => setSelectedBuilding(e.target.value)}
                            className="text-xs rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                            <option value="all">Усі гуртожитки</option>
                            {buildings.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* 3. ТАБЛИЦЯ ТА СПИСОК ЖУРНАЛУ ВІДВІДУВАНЬ */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-3xl shadow-sm overflow-hidden">
                {paginatedLogs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 dark:text-gray-500">
                        <div className="text-4xl mb-2">📋</div>
                        <p className="font-bold text-sm text-slate-600 dark:text-gray-300">
                            Журнал відвідувань порожній
                        </p>
                        <p className="text-xs mt-1">
                            Натисніть кнопку «Відкрити QR-сканер КПП», щоб зафіксувати перший прохід студента.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50/80 dark:bg-gray-900/50 text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 py-3.5">Час / Дата</th>
                                        <th className="px-4 py-3.5">Студент</th>
                                        <th className="px-4 py-3.5">Кімната / Корпус</th>
                                        <th className="px-4 py-3.5">Напрямок</th>
                                        <th className="px-4 py-3.5">Статус</th>
                                        <th className="px-4 py-3.5">КПП / Перевірив</th>
                                        <th className="px-4 py-3.5">Примітки</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-gray-700/60">
                                    {paginatedLogs.map((log) => {
                                        const isEntry = log.type === "entry";
                                        const isGranted = log.status === "granted";

                                        return (
                                            <tr
                                                key={log.id}
                                                className="hover:bg-slate-50/60 dark:hover:bg-gray-700/40 transition-colors"
                                            >
                                                {/* Час */}
                                                <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-slate-700 dark:text-gray-300 font-mono text-[11px]">
                                                    {formatDate(log.created_at)}
                                                </td>

                                                {/* Студент */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 font-black text-xs flex items-center justify-center shrink-0">
                                                            {log.user?.name?.charAt(0)?.toUpperCase() || "S"}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-900 dark:text-white truncate">
                                                                {log.user?.name || "Невідомий"}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 dark:text-gray-500 truncate">
                                                                {log.user?.specialty ? `${log.user.specialty}` : log.user?.email}
                                                                {log.user?.group ? ` (${log.user.group})` : ""}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Кімната та корпус */}
                                                <td className="px-4 py-3.5">
                                                    {log.booking?.room ? (
                                                        <div>
                                                            <div className="font-bold text-emerald-700 dark:text-emerald-400">
                                                                Кімната {log.booking.room.room_number} (Поверх {log.booking.room.floor})
                                                            </div>
                                                            <div className="text-[10px] text-slate-400">
                                                                {log.booking.room.building?.name || log.building?.name}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-[11px]">
                                                            {log.building?.name || "Не закріплено"}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Напрямок */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                                                            isEntry
                                                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                                                                : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
                                                        }`}
                                                    >
                                                        <span>{isEntry ? "🟢" : "🔴"}</span>
                                                        <span>{isEntry ? "ВХІД" : "ВИХІД"}</span>
                                                    </span>
                                                </td>

                                                {/* Статус */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span
                                                        className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                                            isGranted
                                                                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200"
                                                                : "bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200"
                                                        }`}
                                                    >
                                                        {isGranted ? "Дозволено" : "Заборонено"}
                                                    </span>
                                                </td>

                                                {/* Хто перевірив */}
                                                <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-gray-400 text-[11px]">
                                                    <div className="font-semibold">
                                                        {log.scanner?.name || "КПП"}
                                                    </div>
                                                    <div className="text-[9px] text-slate-400 uppercase">
                                                        {log.method === "qr_scan" ? "📷 QR-сканер" : "⌨️ Вручну"}
                                                    </div>
                                                </td>

                                                {/* Примітки */}
                                                <td className="px-4 py-3.5 text-slate-500 dark:text-gray-400 text-[11px] max-w-xs truncate">
                                                    {log.notes || "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Пагінація */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-slate-100 dark:border-gray-700 flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
                                <div>
                                    Сторінка <strong>{currentPage}</strong> з <strong>{totalPages}</strong>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-gray-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-700"
                                    >
                                        ← Попередня
                                    </button>
                                    <button
                                        type="button"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-gray-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-700"
                                    >
                                        Наступна →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Модальне вікно сканера */}
            <QrAccessScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
            />
        </div>
    );
}
